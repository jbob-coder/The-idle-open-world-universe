package io.godseed.one;
import java.io.*;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.util.*;
public final class StorageChecks {
 static int checks;
 static void check(boolean ok){checks++;if(!ok)throw new AssertionError("check "+checks);}
 static String hash(byte[] data)throws Exception{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(data));}
 static void rejected(RunnableWithError action)throws Exception{try{action.run();throw new AssertionError("accepted invalid install");}catch(IOException expected){checks++;}}
 interface RunnableWithError{void run()throws Exception;}
 public static void main(String[] args)throws Exception{
  check(StoragePolicy.accept(1_000_000_000L,0,2_000_000_000L,100_000_000L,0));
  check(!StoragePolicy.accept(1_000_000_000L,0,0,1,0));
  check(!StoragePolicy.accept(1_000_000_000L,0,300_000_000L,1,0));
  check(StoragePolicy.accept(1_000_000_000L,0,600_000_000L,100_000_000L,0));
  check(!StoragePolicy.accept(1_000_000_000L,0,599_999_999L,100_000_000L,0));
  check(!StoragePolicy.accept(1_000_000_000L,5_000_000_000L,8_000_000_000L,1,0));
  check(!StoragePolicy.accept(1_100_000_000L,4_900_000_000L,8_000_000_000L,1,0));
  check(!StoragePolicy.accept(Long.MAX_VALUE,0,Long.MAX_VALUE,1,0));
  Path root=Files.createTempDirectory("godseed-packs");Path save=root.resolve("save.json");Files.write(save,"protected world".getBytes(StandardCharsets.UTF_8));
  long[] free={2_000_000_000L};PackStore store=new PackStore(root.resolve("packs").toFile(),()->free[0],()->1000);
  byte[] first="first lore".getBytes(),next="new lore".getBytes();
  store.install("moonwell",new ByteArrayInputStream(first),first.length,hash(first));check(Arrays.equals(store.read("moonwell"),first));
  rejected(()->store.install("../save",new ByteArrayInputStream(next),next.length,hash(next)));
  rejected(()->store.install("moonwell",new ByteArrayInputStream(next),next.length,"00".repeat(32)));check(Arrays.equals(store.read("moonwell"),first));
  free[0]=300_000_000L;rejected(()->store.install("moonwell",new ByteArrayInputStream(next),next.length,hash(next)));free[0]=2_000_000_000L;
  rejected(()->store.install("moonwell",new InputStream(){int n;public int read()throws IOException{if(n++>3)throw new IOException("disk failure");return 42;}},100,hash(next)));
  check(Arrays.equals(store.read("moonwell"),first));
  rejected(()->store.install("moonwell",new ByteArrayInputStream(next),PackStore.MAX_PACK+1,hash(next)));
  store.install("moonwell",new ByteArrayInputStream(next),next.length,hash(next));check(Arrays.equals(store.read("moonwell"),next));
  // Available space falls after the first staged chunk: preserve the installed pack.
  byte[] large=new byte[20_000];String largeHash=hash(large);
  InputStream shrinking=new ByteArrayInputStream(large){
   int chunks;
   @Override public synchronized int read(byte[] b,int off,int len){
    int n=super.read(b,off,len);if(++chunks==2)free[0]=100;return n;
   }
  };
  rejected(()->store.install("moonwell",shrinking,large.length,largeHash));free[0]=2_000_000_000L;
  check(Arrays.equals(store.read("moonwell"),next));check(!Files.exists(root.resolve("packs/moonwell.pending")));
  // Interrupted swap: previous survives startup and staged garbage is discarded.
  Files.move(root.resolve("packs/moonwell.pack"),root.resolve("packs/moonwell.previous"));Files.write(root.resolve("packs/moonwell.pending"),"partial".getBytes(StandardCharsets.UTF_8));
  PackStore recovered=new PackStore(root.resolve("packs").toFile(),()->free[0],()->1000);check(Arrays.equals(recovered.read("moonwell"),next));
  recovered.remove("moonwell");check(recovered.ids().isEmpty());check(new String(Files.readAllBytes(save),StandardCharsets.UTF_8).equals("protected world"));
  System.out.println("PASS "+checks+" storage checks: quotas, reserve, corrupt/oversize/partial writes, recovery, removal and save isolation");
 }
}
