package io.godseed.one;

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import java.io.IOException;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/** Separate conventional-host experiment. Keeps the original file-origin save identity. */
public final class MainActivity extends Activity {
    private static final String GAME = "file:///android_asset/index.html";
    private WebView view;
    private PackBridge packs;
    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        view = new WebView(this);
        WebSettings settings = view.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setBlockNetworkLoads(true);
        view.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView web, WebResourceRequest request) {
                return !GAME.equals(request.getUrl().toString());
            }
            @Override public boolean shouldOverrideUrlLoading(WebView web, String url) {
                return !GAME.equals(url);
            }
        });
        try { packs=new PackBridge(this,view); view.addJavascriptInterface(packs,"GodseedNativePacks"); } catch(IOException unavailable) { /* Core remains playable without optional storage. */ }
        setContentView(view);
        view.loadUrl(GAME);
    }
    @Override protected void onPause() {
        view.evaluateJavascript("window.GodseedHostLifecycle && GodseedHostLifecycle.pause()", null);
        view.onPause();
        super.onPause();
    }
    @Override protected void onResume() {
        super.onResume();
        if (view != null) {
            view.onResume();
            view.evaluateJavascript("window.GodseedHostLifecycle && GodseedHostLifecycle.resume()", null);
        }
    }
    @Override public void onBackPressed() {
        view.evaluateJavascript("(()=>{for(const id of ['confirmDialog','saveDialog']){const d=document.getElementById(id);if(d&&!d.hidden){d.hidden=true;return true;}}return false;})()", value -> {
            if (!"true".equals(value)) { moveTaskToBack(true); }
        });
    }
    @Override protected void onActivityResult(int request,int result,Intent data) {
        super.onActivityResult(request,result,data);
        if(request==PackBridge.PICK_PACK&&result==RESULT_OK&&data!=null&&data.getData()!=null&&packs!=null)packs.chosen(data.getData());
    }
    @Override protected void onDestroy() {
        if(packs!=null)packs.close();
        if (view != null) { view.destroy(); view = null; }
        super.onDestroy();
    }
}
