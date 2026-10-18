package io.godseed.one;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.provider.OpenableColumns;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import org.json.JSONObject;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.InputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Supported-toolchain Android host for the existing offline Canvas/JS game.
 * This is a separate evaluation build: does not replace SDK-free debug APK.
 * IMPORTANT: retain file:///android_asset/index.html storage origin.
 */
public final class MainActivity extends Activity {
    private static final int PICK_BACKUP = 401, PICK_LORE = 402;
    private static final String GAME_URL = "file:///android_asset/index.html";
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private WebView web;
    private PackStore packs;
    private ValueCallback<Uri[]> backupPicker;

    private boolean trusted(Uri uri) {
        String target = uri == null ? "" : uri.toString();
        return GAME_URL.equals(target) || "about:blank".equals(target);
    }
    private long estimatedCoreBytes() {
        File apk = new File(getApplicationInfo().sourceDir);
        // Approximate packaged APK size, not Android's complete installed footprint.
        return apk.isFile() ? apk.length() : 0L;
    }
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        packs = new PackStore(getApplicationContext());
        web = new WebView(this);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true); // only packaged file:///android_asset entrypoint
        settings.setAllowContentAccess(true); // Android document picker for backup import
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !trusted(request.getUrl());
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return !trusted(Uri.parse(url));
            }
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                String scheme = request.getUrl().getScheme();
                if ("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme))
                    return new WebResourceResponse("text/plain", "utf-8",
                        new ByteArrayInputStream(new byte[0]));
                return super.shouldInterceptRequest(view, request);
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view,
                    ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (backupPicker != null) backupPicker.onReceiveValue(null);
                backupPicker = callback;
                try {
                    startActivityForResult(params.createIntent(), PICK_BACKUP);
                    return true;
                } catch (Exception e) {
                    backupPicker = null;
                    callback.onReceiveValue(null);
                    return false;
                }
            }
        });
        web.addJavascriptInterface(new LocalStorageBridge(), "GodseedStorage");
        setContentView(web);
        web.loadUrl(GAME_URL);
    }
    private String displayName(Uri uri) {
        try (Cursor cursor = getContentResolver().query(uri,
                new String[] {OpenableColumns.DISPLAY_NAME}, null, null, null)) {
            if (cursor != null && cursor.moveToFirst()) return cursor.getString(0);
        } catch (Exception ignored) { }
        return "selected local content";
    }
    private void choosePackFile() {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");
        startActivityForResult(intent, PICK_LORE);
    }
    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request == PICK_BACKUP) {
            if (backupPicker != null) {
                Uri[] files = result == RESULT_OK && data != null && data.getData() != null
                    ? new Uri[]{data.getData()} : null;
                backupPicker.onReceiveValue(files);
                backupPicker = null;
            }
            return;
        }
        if (request != PICK_LORE || result != RESULT_OK || data == null || data.getData() == null)
            return;
        Uri uri = data.getData();
        // The picker is the user's first action; this is a second explicit confirmation.
        new AlertDialog.Builder(this)
            .setTitle("Install optional offline lore?")
            .setMessage(displayName(uri) + "\n\nOnly verified small lore packs are accepted. Your saves will not be touched.")
            .setNegativeButton("Cancel", null)
            .setPositiveButton("Install", (dialog, which) -> {
                io.submit(() -> {
                    try (InputStream source = getContentResolver().openInputStream(uri)) {
                        if (source == null) throw new IllegalArgumentException("File unavailable");
                        String id = packs.install(source, estimatedCoreBytes());
                        signal(true, "Installed optional lore: " + id);
                    } catch (Exception e) {
                        signal(false, "Pack rejected: " + e.getMessage());
                    }
                });
            }).show();
    }
    private void signal(boolean success, String message) {
        runOnUiThread(() -> {
            if (web == null) return;
            String script = "window.dispatchEvent(new CustomEvent('godseed:storage'," +
                "{detail:{ok:" + success + ",message:" + JSONObject.quote(message) + "}}))";
            web.evaluateJavascript(script, null);
        });
    }
    private final class LocalStorageBridge {
        @JavascriptInterface public String status() {
            try { return packs.status(estimatedCoreBytes()).toString(); }
            catch (Exception e) { return "{\"error\":\"Storage unavailable\"}"; }
        }
        @JavascriptInterface public void chooseLorePack() {
            runOnUiThread(() -> choosePackFile());
        }
        @JavascriptInterface public void removeLorePack(String id) {
            if (id == null || !id.matches("[a-z][a-z0-9_-]{0,47}")) return;
            runOnUiThread(() -> new AlertDialog.Builder(MainActivity.this)
                .setTitle("Remove optional lore?")
                .setMessage("Remove " + id + "? Your game save remains unchanged.")
                .setNegativeButton("Cancel", null)
                .setPositiveButton("Remove", (dialog, which) ->
                    io.submit(() -> signal(packs.remove(id), "Optional lore removal: " + id)))
                .show());
        }
        @JavascriptInterface public String loreForRegion(String regionId) {
            try { return packs.loreForRegion(regionId).toString(); }
            catch (Exception e) { return "[]"; }
        }
    }
    @Override protected void onPause() {
        if (web != null) {
            web.evaluateJavascript("if(window.GodseedHostLifecycle)GodseedHostLifecycle.pause()", null);
            web.onPause();
        }
        super.onPause();
    }
    @Override protected void onResume() {
        super.onResume();
        if (web != null) {
            web.onResume();
            web.evaluateJavascript("if(window.GodseedHostLifecycle)GodseedHostLifecycle.resume()", null);
        }
    }
    @Override public void onBackPressed() {
        new AlertDialog.Builder(this).setTitle("Leave GODSEED?")
            .setMessage("The world is saved locally. Export a backup before uninstalling.")
            .setNegativeButton("Continue playing", null)
            .setPositiveButton("Save and exit", (dialog, which) -> {
                if (web != null) web.evaluateJavascript(
                    "if(window.GodseedHostLifecycle)GodseedHostLifecycle.pause()", null);
                finish();
            }).show();
    }
    @Override protected void onDestroy() {
        io.shutdown();
        if (backupPicker != null) { backupPicker.onReceiveValue(null); backupPicker = null; }
        if (web != null) { web.destroy(); web = null; }
        super.onDestroy();
    }
}
