package io.godseed.one;
import java.io.*;
import java.nio.file.*;
import java.security.*;
import java.util.*;

/** App-private, bounded local lore packs. Never touches the world's save directory. */
public final class PackStore {
    public static final int MAX_PACK=1_048_576, MAX_PACKS=64;
    public interface Bytes { long get(); }
    private final File root;
    private final Bytes available,core;
    public PackStore(File root,Bytes available,Bytes core)throws IOException {
        this.root=root;this.available=available;this.core=core;
        if(!root.isDirectory()&&!root.mkdirs())throw new IOException("Cannot open optional storage");
        recover();
    }
    private File file(String id,String suffix)throws IOException {
        if(id==null||!id.matches("[a-z][a-z0-9-]{0,47}"))throw new IOException("Invalid pack ID");
        File f=new File(root,id+suffix);
        if(!f.getCanonicalFile().getParentFile().equals(root.getCanonicalFile())||Files.isSymbolicLink(f.toPath()))throw new IOException("Unsafe pack path");
        return f;
    }
    public synchronized List<String> ids() {
        List<String> out=new ArrayList<>();File[] files=root.listFiles();
        if(files!=null)for(File f:files)if(f.getName().matches("[a-z][a-z0-9-]{0,47}\\.pack")&&!Files.isSymbolicLink(f.toPath()))out.add(f.getName().substring(0,f.getName().length()-5));
        Collections.sort(out);return out;
    }
    public synchronized long used() { long sum=0;File[] files=root.listFiles();if(files!=null)for(File f:files)if(f.isFile()&&!Files.isSymbolicLink(f.toPath()))sum+=f.length();return sum; }
    public synchronized long length(String id)throws IOException {return file(id,".pack").length();}
    public synchronized byte[] read(String id)throws IOException {File f=file(id,".pack");if(f.length()>MAX_PACK)throw new IOException("Oversized installed pack");return Files.readAllBytes(f.toPath());}
    public synchronized void install(String id,InputStream input,long length,String expectedHash)throws IOException {
        File target=file(id,".pack"),stage=file(id,".pending"),previous=file(id,".previous");
        if(length<1||length>MAX_PACK||expectedHash==null||!expectedHash.matches("[a-f0-9]{64}"))throw new IOException("Invalid pack size or hash");
        if(!target.exists()&&ids().size()>=MAX_PACKS)throw new IOException("Pack collection is full");
        long free=available.get(),reserve=StoragePolicy.reserve(free);
        if(!StoragePolicy.accept(core.get(),used(),free,length,target.length()))throw new IOException("Not enough safe storage capacity");
        MessageDigest hash;try{hash=MessageDigest.getInstance("SHA-256");}catch(NoSuchAlgorithmException e){throw new IOException(e);}
        try {
            long count=0;byte[] buffer=new byte[8192];
            try(FileOutputStream output=new FileOutputStream(stage)) {
                int n;while((n=input.read(buffer))!=-1){if(n==0)continue;count+=n;if(count>length||available.get()-n<reserve)throw new IOException("Pack exceeds space or declared size");output.write(buffer,0,n);hash.update(buffer,0,n);}
                output.getFD().sync();
            }
            if(count!=length||!hex(hash.digest()).equals(expectedHash))throw new IOException("Pack integrity check failed");
            if(previous.exists())throw new IOException("Recovery required before update");
            if(target.exists()&&!target.renameTo(previous))throw new IOException("Cannot preserve previous pack");
            if(!stage.renameTo(target)){if(previous.exists())previous.renameTo(target);throw new IOException("Cannot commit pack");}
            if(previous.exists()&&!previous.delete())throw new IOException("Installed; old copy needs cleanup");
        } finally { if(stage.exists())stage.delete(); }
    }
    public synchronized void remove(String id)throws IOException {File f=file(id,".pack");if(f.exists()&&!f.delete())throw new IOException("Could not remove pack");}
    private void recover()throws IOException {
        File[] files=root.listFiles();if(files==null)return;
        for(File f:files){String name=f.getName();if(name.endsWith(".pending")){file(name.substring(0,name.length()-8),".pending").delete();}
            else if(name.endsWith(".previous")){String id=name.substring(0,name.length()-9);File current=file(id,".pack"),old=file(id,".previous");if(current.exists())old.delete();else if(!old.renameTo(current))throw new IOException("Cannot recover previous pack");}}
    }
    public static String hex(byte[] bytes){StringBuilder s=new StringBuilder();for(byte b:bytes)s.append(String.format(Locale.ROOT,"%02x",b&255));return s.toString();}
}
