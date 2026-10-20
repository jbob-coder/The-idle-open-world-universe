package io.godseed.v3preview;

import android.app.Activity;
import android.app.AlertDialog;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.View;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.ByteArrayInputStream;

/**
 * Isolated WebGL V3 preview. This package has no network permission, and its
 * separate application identity preserves legacy GODSEED application data.
 */
public final class MainActivity extends Activity {
    private static final String GAME_URL = "file:///android_asset/index.html";
    private static final String SAVE_SCRIPT =
        "(function(){if(!window.GodseedV3Debug)return false;" +
        "window.GodseedV3Debug.pause();" +
        "return window.GodseedV3Debug.save();})()";
    private static final String TAG = "GODSEED_V3";
    // Read-only runtime inspection: distinguish unavailable WebGL, incomplete
    // JavaScript initialization and a graphics/shader failure in the actual APK.
    private static final String RUNTIME_DIAGNOSTIC =
        "(function(){var d=window.GodseedV3Debug;" +
        "var c=document.getElementById('scene');" +
        "var w=document.getElementById('warning');" +
        "return JSON.stringify({ready:!!d,webgl:!!(d&&d.hasWebGL())," +
        "canvas:!!c,canvasWidth:c?c.width:0,canvasHeight:c?c.height:0," +
        "warning:w&&w.style.display==='block'?w.textContent:''," +
        "userAgent:navigator.userAgent})})()";
    private static final String SNAPSHOT_SCRIPT =
        "(function(){var d=window.GodseedV3Debug;" +
        "if(!d)return 'UNAVAILABLE';var s=d.getState();" +
        "return [s.seed,s.tick,s.harvested,s.spent,s.wood," +
        "s.structures.length].join(':')})()";
    private WebView web;

    private void logSnapshot(WebView active, String label, Runnable complete) {
        if (web != active || isDestroyed()) {
            if (complete != null) complete.run();
            return;
        }
        active.evaluateJavascript(SNAPSHOT_SCRIPT, result -> {
            Log.i(TAG, "STATE_" + label + "=" + result);
            if (complete != null) complete.run();
        });
    }

    private void inspectRuntime(WebView active, int attempt) {
        if (web != active || isDestroyed() || isFinishing()) return;
        active.evaluateJavascript(
            "(function(){return Boolean(window.GodseedV3Debug&&" +
            "GodseedV3Debug.hasWebGL())})()",
            result -> {
                if (web != active || isDestroyed()) return;
                Log.i(TAG, "WEBGL_CONTEXT=" + result + " attempt=" + attempt);
                if (!"true".equals(result)) {
                    active.evaluateJavascript(RUNTIME_DIAGNOSTIC,
                        details -> Log.i(TAG, "WEBGL_DIAGNOSTIC=" + details));
                }
            });
    }

    private static boolean trusted(Uri uri) {
        String url = uri == null ? "" : uri.toString();
        return GAME_URL.equals(url) || "about:blank".equals(url);
    }

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        // The activity and WebView must not silently switch to software
        // compositing when attempting a WebGL context.
        web.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onConsoleMessage(ConsoleMessage message) {
                if (message.messageLevel() == ConsoleMessage.MessageLevel.ERROR ||
                    message.messageLevel() == ConsoleMessage.MessageLevel.WARNING) {
                    Log.w(TAG, "JS_CONSOLE=" + message.message() +
                        " @" + message.lineNumber());
                }
                return false;
            }
        });
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);  // bundled android_asset only
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        web.setWebViewClient(new WebViewClient() {
            @Override public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                if (!GAME_URL.equals(url)) return;
                // A page-load event is not proof that inline V3 JS or the GPU
                // renderer initialized. Probe a bounded number of times.
                // Never report a fabricated success when WebGL is unavailable.
                Handler handler = new Handler(Looper.getMainLooper());
                // This state is read-only. Restored V3 saves start paused,
                // allowing an exact resource/tick comparison after relaunch.
                handler.postDelayed(() -> logSnapshot(view, "LOADED", null), 1200);
                for (int attempt = 0; attempt < 5; attempt++) {
                    final int number = attempt;
                    handler.postDelayed(() -> inspectRuntime(view, number),
                        attempt * 2000L);
                }
            }
            @Override public boolean shouldOverrideUrlLoading(
                    WebView view, WebResourceRequest request) {
                return !trusted(request.getUrl());
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return !trusted(Uri.parse(url));
            }
            @Override public WebResourceResponse shouldInterceptRequest(
                    WebView view, WebResourceRequest request) {
                String scheme = request.getUrl().getScheme();
                if ("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme)) {
                    return new WebResourceResponse(
                        "text/plain", "utf-8", 403, "Blocked",
                        java.util.Collections.emptyMap(),
                        new ByteArrayInputStream(new byte[0]));
                }
                return super.shouldInterceptRequest(view, request);
            }
        });
        setContentView(web);
        web.loadUrl(GAME_URL);
    }

    @Override protected void onPause() {
        // Do not pause the WebView until JavaScript has had an opportunity to
        // synchronously persist its current state. The timeout also avoids
        // holding up WebView pause indefinitely if JS is unavailable.
        final WebView active = web;
        if (active != null) {
            active.evaluateJavascript(SAVE_SCRIPT, result -> {
                Log.i(TAG, "LIFECYCLE_SAVE=" + result);
                if (web != active) return;
                if ("true".equals(result)) {
                    logSnapshot(active, "SAVED", () -> {
                        if (web == active) active.onPause();
                    });
                } else {
                    active.onPause();
                }
            });
            new Handler(Looper.getMainLooper()).postDelayed(() -> {
                if (web == active) active.onPause();
            }, 1000);
        }
        super.onPause();
    }

    @Override protected void onResume() {
        super.onResume();
        if (web != null) web.onResume();
        // Preserve the paused state after backgrounding; user resumes explicitly.
    }

    private void saveAndExit() {
        final WebView active = web;
        if (active == null) { finish(); return; }
        active.evaluateJavascript(SAVE_SCRIPT, result -> {
            if (isFinishing() || isDestroyed()) return;
            if ("true".equals(result)) {
                finish();
            } else {
                new AlertDialog.Builder(MainActivity.this)
                    .setTitle("V3 world was not saved")
                    .setMessage("Remain in the preview and try saving manually.")
                    .setNegativeButton("Keep playing", null)
                    .setPositiveButton("Exit without saving", (dialog, which) -> finish())
                    .show();
            }
        });
    }

    @Override public void onBackPressed() {
        new AlertDialog.Builder(this)
            .setTitle("Exit GODSEED V3 preview?")
            .setMessage("Save this world before leaving. The V1 game is separate.")
            .setNegativeButton("Cancel", null)
            .setPositiveButton("Save and exit", (dialog, which) -> saveAndExit())
            .show();
    }

    @Override protected void onDestroy() {
        if (web != null) { web.destroy(); web = null; }
        super.onDestroy();
    }
}
