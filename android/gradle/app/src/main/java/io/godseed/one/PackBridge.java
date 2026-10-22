package io.godseed.one;

import android.app.*;
import android.content.*;
import android.net.Uri;
import android.webkit.*;
import org.json.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.security.MessageDigest;
import java.util.concurrent.*;

/** Narrow bridge: local lore packs only; never paths, scripts or world saves. */
public final class PackBridge {
    public static final int PICK_PACK=41;
    private final Activity activity;
    private final WebView web;
    private final File root;
    private final PackStore store;
    private final ExecutorService worker=Executors.newSingleThreadExecutor();
    public PackBridge(Activity activity,WebView web)throws IOException {
        this.activity=activity;this.web=web;root=new File(activity.getFilesDir(),"optional-packs");
        store=new PackStore(root,()->root.getUsableSpace(),this::coreBytes);
    }
    private static long size(File f) {
        if(Files.isSymbolicLink(f.toPath()))return 0;
        if(f.isFile())return f.length();long n=0;File[] children=f.listFiles();if(children!=null)for(File c:children)n+=size(c);return n;
    }
    private long apkBytes(){return new File(activity.getApplicationInfo().sourceDir).length();}
    private long coreBytes(){return apkBytes()+Math.max(0,size(activity.getDataDir())-size(root));}
    private static String digest(byte[] bytes)throws Exception{return PackStore.hex(MessageDigest.getInstance("SHA-256").digest(bytes));}
    private JSONObject parse(byte[] bytes,boolean checkDependencies)throws Exception {return PackManifest.parse(bytes,store.ids(),checkDependencies);}
    @JavascriptInterface public String usage() {
        try {
            JSONObject out=new JSONObject();long optional=store.used();out.put("coreBytes",apkBytes());out.put("mutableBytes",Math.max(0,coreBytes()-apkBytes()));out.put("optionalBytes",optional);out.put("freeBytes",root.getUsableSpace());out.put("cacheBytes",size(activity.getCacheDir())+size(activity.getCodeCacheDir()));out.put("maxPackBytes",PackStore.MAX_PACK);
            JSONArray packs=new JSONArray();for(String id:store.ids()){JSONObject row=new JSONObject();row.put("id",id);row.put("bytes",store.length(id));String title="Unreadable lore (remove to repair)";try{title=PackManifest.displayTitle(store.read(id));}catch(Exception invalid){}row.put("title",title);packs.put(row);}out.put("packs",packs);return out.toString();
        }catch(Exception e){return "{\"error\":\"Storage accounting unavailable\"}";}
    }
    @JavascriptInterface public void requestImport() {activity.runOnUiThread(()->{Intent pick=new Intent(Intent.ACTION_OPEN_DOCUMENT);pick.setType("application/json");pick.addCategory(Intent.CATEGORY_OPENABLE);try{activity.startActivityForResult(pick,PICK_PACK);}catch(ActivityNotFoundException e){message("No local document picker is available.");}});}
    public void chosen(Uri uri) {worker.execute(()->{try {
        byte[] raw;try(InputStream input=activity.getContentResolver().openInputStream(uri);ByteArrayOutputStream bytes=new ByteArrayOutputStream()){
            if(input==null)throw new IOException("Cannot open selected file");byte[] buf=new byte[8192];int n;while((n=input.read(buf))!=-1){if(bytes.size()+n>PackStore.MAX_PACK)throw new IOException("Pack exceeds 1 MiB supported lore size");bytes.write(buf,0,n);}raw=bytes.toByteArray();
        }
        JSONObject pack=parse(raw,true);String id=pack.getString("pack_id"),title=new JSONObject(pack.getString("payload")).getString("title");
        activity.runOnUiThread(()->new AlertDialog.Builder(activity).setTitle("Install optional lore?").setMessage(title+"\n"+raw.length+" bytes. Core play does not require this pack. Existing pack with this ID will be replaced.").setNegativeButton("Cancel",null).setPositiveButton("Install",(d,w)->worker.execute(()->{try{parse(raw,true);store.install(id,new ByteArrayInputStream(raw),raw.length,digest(raw));message("Installed "+title);}catch(Exception e){message("Install refused: "+e.getMessage());}})).show());
    }catch(Exception e){message("Pack rejected: "+e.getMessage());}});}
    @JavascriptInterface public void requestRemove(String id) {activity.runOnUiThread(()->new AlertDialog.Builder(activity).setTitle("Remove optional lore?").setMessage("This removes the selected lore pack. Your world save is preserved.").setNegativeButton("Cancel",null).setPositiveButton("Remove",(d,w)->worker.execute(()->{try{
        PackManifest.checkRemoval(store,id);
        store.remove(id);message("Optional pack removed.");
    }catch(Exception e){message("Removal refused: "+e.getMessage());}})).show());}
    @JavascriptInterface public String lore(String id) {try{return parse(store.read(id),false).getString("payload");}catch(Exception e){return "{\"title\":\"Unavailable\",\"entries\":[]}";}}
    private void message(String text){activity.runOnUiThread(()->{if(!activity.isFinishing()&&!activity.isDestroyed())web.evaluateJavascript("window.GodseedStorage && GodseedStorage.refresh("+JSONObject.quote(text)+")",null);});}
    public void close(){worker.shutdown();}
}
