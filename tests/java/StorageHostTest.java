package io.godseed.one;
import org.junit.Test;
import static org.junit.Assert.*;
import org.json.*;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.io.IOException;
public class StorageHostTest {
 @Test public void filesystemBoundaries()throws Exception{StorageChecks.main(new String[0]);}
 private byte[] encode(JSONObject p)throws Exception {
  byte[] bytes=new byte[0];for(int i=0;i<8;i++){bytes=p.toString().getBytes(StandardCharsets.UTF_8);p.put("compressed_bytes",bytes.length);p.put("installed_bytes",bytes.length);}return p.toString().getBytes(StandardCharsets.UTF_8);
 }
 private JSONObject fixture()throws Exception{return new JSONObject(new String(Files.readAllBytes(Path.of("../../../content-packs/borderland-echoes.godseed.json")),StandardCharsets.UTF_8));}
 private void rejected(JSONObject p,String reason)throws Exception{try{PackManifest.parse(encode(p),List.of(),true);fail("Accepted invalid metadata");}catch(IOException expected){assertTrue(expected.getMessage(),expected.getMessage().contains(reason));}}
 @Test public void originalPackIsValidatedAndContainsEightRegions()throws Exception {
  JSONObject p=PackManifest.parse(encode(fixture()),List.of(),true);assertEquals("borderland-echoes",p.getString("pack_id"));assertEquals(8,new JSONObject(p.getString("payload")).getJSONArray("entries").length());
 }
 @Test public void rejectUnsupportedManifestAndUnsafeIds()throws Exception {
  rejected(fixture().put("schema_version",2),"Unsupported");rejected(fixture().put("pack_id","../save"),"Unsupported");rejected(fixture().put("content_type","javascript"),"Unsupported");rejected(fixture().put("optional",false),"Unsupported");
 }
 @Test public void hashesAndDependenciesAreAuthoritative()throws Exception {
  rejected(fixture().put("sha256","0".repeat(64)),"SHA256");rejected(fixture().put("dependencies",new JSONArray().put("missing")),"dependency");
  byte[] bad=encode(fixture());bad[bad.length-2]='x';try{PackManifest.parse(bad,List.of(),true);fail("Accepted corrupt data");}catch(Exception expected){}
 }
 @Test public void corruptInstalledLoreRemainsVisibleAndRemovable()throws Exception {
  PackStore store=new PackStore(Files.createTempDirectory("godseed-damaged").toFile(),()->2_000_000_000L,()->1000);
  byte[] bad="broken json".getBytes(StandardCharsets.UTF_8);
  store.install("damaged",new java.io.ByteArrayInputStream(bad),bad.length,StorageChecks.hash(bad));
  assertEquals("Unreadable lore (remove to repair)",PackManifest.displayTitle(store.read("damaged")));
  PackManifest.checkRemoval(store,"damaged");
  byte[] dependent=encode(fixture().put("dependencies",new JSONArray().put("damaged")));
  store.install("borderland-echoes",new java.io.ByteArrayInputStream(dependent),dependent.length,StorageChecks.hash(dependent));
  assertEquals("Echoes of the Borderlands",PackManifest.displayTitle(dependent));
  try{PackManifest.checkRemoval(store,"damaged");fail("Allowed removal of a dependency");}catch(IOException expected){}
  PackManifest.checkRemoval(store,"borderland-echoes");store.remove("borderland-echoes");PackManifest.checkRemoval(store,"damaged");store.remove("damaged");assertTrue(store.ids().isEmpty());
 }
}
