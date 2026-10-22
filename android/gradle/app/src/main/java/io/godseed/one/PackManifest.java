package io.godseed.one;
import org.json.*;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
public final class PackManifest {
    private static String digest(byte[] bytes)throws Exception{return PackStore.hex(MessageDigest.getInstance("SHA-256").digest(bytes));}
    public static String displayTitle(byte[] bytes) {
        try {return new JSONObject(parse(bytes,java.util.Collections.emptyList(),false).getString("payload")).getString("title");}
        catch(Exception invalid){return "Unreadable lore (remove to repair)";}
    }
    public static void checkRemoval(PackStore store,String id)throws Exception {
        for(String other:store.ids()){
            if(other.equals(id))continue; // A damaged pack must remain removable.
            JSONObject p;
            try{p=parse(store.read(other),store.ids(),false);}catch(Exception invalid){continue;}
            JSONArray deps=p.getJSONArray("dependencies");
            for(int i=0;i<deps.length();i++)if(id.equals(deps.getString(i)))throw new IOException("Another installed pack depends on this one");
        }
    }
    public static JSONObject parse(byte[] bytes,java.util.List<String> installed,boolean checkDependencies)throws Exception {
        if(bytes.length<1||bytes.length>PackStore.MAX_PACK)throw new IOException("Unsupported pack size");
        JSONObject pack=new JSONObject(new String(bytes,StandardCharsets.UTF_8));
        String id=pack.getString("pack_id"),payload=pack.getString("payload");
        if(!id.matches("[a-z][a-z0-9-]{0,47}")||pack.getInt("schema_version")!=1||pack.getInt("game_min_version")!=1||!pack.getBoolean("optional")||!"lore".equals(pack.getString("content_type"))||!"remove-lore-only".equals(pack.getString("uninstall")))throw new IOException("Unsupported pack manifest");
        if(pack.getLong("compressed_bytes")!=bytes.length||pack.getLong("installed_bytes")!=bytes.length||!digest(payload.getBytes(StandardCharsets.UTF_8)).equals(pack.getString("sha256")))throw new IOException("Pack size or SHA256 mismatch");
        JSONArray deps=pack.getJSONArray("dependencies");if(deps.length()>8)throw new IOException("Too many dependencies");
        for(int i=0;i<deps.length();i++){String dep=deps.getString(i);if(!dep.matches("[a-z][a-z0-9-]{0,47}")||id.equals(dep)||(checkDependencies&&!installed.contains(dep)))throw new IOException("Missing or invalid pack dependency");}
        JSONObject lore=new JSONObject(payload);if(lore.getString("title").length()>80)throw new IOException("Title too long");
        JSONArray entries=lore.getJSONArray("entries");if(entries.length()<1||entries.length()>64)throw new IOException("Unsupported lore count");
        for(int i=0;i<entries.length();i++){JSONObject e=entries.getJSONObject(i);if(!e.getString("region_id").matches("R0[0-7]")||e.getString("text").length()>4000)throw new IOException("Invalid regional lore");}
        return pack;
    }
}
