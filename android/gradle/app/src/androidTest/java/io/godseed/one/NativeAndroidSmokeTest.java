package io.godseed.one;

import android.content.Context;
import android.content.pm.PackageManager;
import android.webkit.WebView;
import android.view.View;
import android.view.ViewGroup;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import static org.junit.Assert.*;

/** On-emulator smoke tests; not a substitute for a 2 GB physical phone. */
@RunWith(AndroidJUnit4.class)
public class NativeAndroidSmokeTest {
    private static final String PACK_ID = "instrument_mossveil";

    private Context context() {
        return InstrumentationRegistry.getInstrumentation().getTargetContext();
    }

    private String hash(byte[] raw) throws Exception {
        StringBuilder result = new StringBuilder();
        for (byte b : MessageDigest.getInstance("SHA-256").digest(raw))
            result.append(String.format(java.util.Locale.ROOT, "%02x", b & 255));
        return result.toString();
    }

    private byte[] zipLore(boolean brokenDigest, boolean evilEntry, String region) throws Exception {
        JSONObject item = new JSONObject()
            .put("region_id", region)
            .put("title", "Forest Memory")
            .put("text", "A mossy trail remembers an ancient vow.");
        byte[] payload = new JSONObject()
            .put("entries", new JSONArray().put(item))
            .toString().getBytes(StandardCharsets.UTF_8);
        JSONObject manifest = new JSONObject()
            .put("pack_id", PACK_ID)
            .put("schema_version", 1)
            .put("game_min_version", 1)
            .put("content_type", "lore")
            .put("optional", true)
            .put("installed_bytes", payload.length)
            .put("sha256", brokenDigest ? "00" : hash(payload))
            .put("dependencies", new JSONArray());
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        try (ZipOutputStream zip = new ZipOutputStream(output)) {
            ZipEntry m = new ZipEntry("manifest.json");
            zip.putNextEntry(m);
            zip.write(manifest.toString().getBytes(StandardCharsets.UTF_8));
            zip.closeEntry();
            ZipEntry lore = new ZipEntry("lore.json");
            zip.putNextEntry(lore);
            zip.write(payload);
            zip.closeEntry();
            if (evilEntry) {
                zip.putNextEntry(new ZipEntry("../outside.txt"));
                zip.write(new byte[]{1});
                zip.closeEntry();
            }
        }
        return output.toByteArray();
    }

    private static void mustReject(PackStore packs, byte[] bytes) throws Exception {
        try {
            packs.install(new ByteArrayInputStream(bytes), 1_000_000_000L);
            fail("Invalid ZIP pack must be rejected");
        } catch (IllegalArgumentException expected) {
            // Expected: no pack installed or replaced.
        }
    }

    @Test public void acceptsSignedLoreAndPreservesUnrelatedFiles() throws Exception {
        PackStore packs = new PackStore(context());
        packs.remove(PACK_ID);
        try {
            byte[] bytes = zipLore(false, false, "R03");
            long before = packs.optionalBytes();
            assertEquals(PACK_ID, packs.install(new ByteArrayInputStream(bytes), 1_000_000_000L));
            assertEquals(before + bytes.length, packs.optionalBytes());
            assertEquals(1, packs.loreForRegion("R03").length());
            assertEquals(0, packs.loreForRegion("R04").length());
            JSONObject status = packs.status(1_000_000_000L);
            assertEquals(StorageQuota.OPTIONAL_CAP_BYTES, status.getLong("optional_limit_bytes"));
            assertEquals(StorageQuota.TOTAL_CAP_BYTES, status.getLong("app_managed_limit_bytes"));
            assertTrue(status.getLong("phone_free_bytes") >= 0);
        } finally {
            assertTrue(packs.remove(PACK_ID));
        }
        assertEquals(0, packs.loreForRegion("R03").length());
    }

    @Test public void rejectsInvalidDigestsEntriesAndRegionIds() throws Exception {
        PackStore packs = new PackStore(context());
        packs.remove(PACK_ID);
        mustReject(packs, zipLore(true, false, "R03"));
        mustReject(packs, zipLore(false, true, "R03"));
        mustReject(packs, zipLore(false, false, "R99"));
        assertFalse("invalid imports must not remain installed",
            packs.status(1_000_000_000L).toString().contains(PACK_ID));
    }

    @Test public void rejectsDuplicateWithoutReplacingOriginal() throws Exception {
        PackStore packs = new PackStore(context());
        packs.remove(PACK_ID);
        byte[] bytes = zipLore(false, false, "R03");
        try {
            assertEquals(PACK_ID, packs.install(new ByteArrayInputStream(bytes), 1_000_000_000L));
            mustReject(packs, bytes);
            assertEquals(1, packs.loreForRegion("R03").length());
            assertEquals(bytes.length, packs.optionalBytes());
        } finally {
            packs.remove(PACK_ID);
        }
    }

    @Test public void nativeWebViewLoadsGameOfflineWithoutInternetPermission() throws Exception {
        assertEquals(PackageManager.PERMISSION_DENIED,
            context().getPackageManager().checkPermission("android.permission.INTERNET",
                context().getPackageName()));
        try (ActivityScenario<MainActivity> activity = ActivityScenario.launch(MainActivity.class)) {
            for (int i = 0; i < 20; i++) {
                CountDownLatch complete = new CountDownLatch(1);
                final String[] result = {null};
                activity.onActivity(current -> {
                    View root = current.findViewById(android.R.id.content);
                    WebView web = findWebView(root);
                    assertNotNull("Activity must host WebView", web);
                    web.evaluateJavascript(
                        "(function(){return document.readyState==='complete'" +
                        " && typeof window.GodseedDebug==='object'" +
                        " && !!window.GodseedAssets" +
                        " && document.getElementById('nativeStoragePanel').hidden===false" +
                        " && document.querySelector('#world').width===512" +
                        " && window.GodseedStorage!==undefined" +
                        " && location.href==='file:///android_asset/index.html';})()",
                        value -> {
                            result[0] = value;
                            complete.countDown();
                        });
                });
                assertTrue("WebView JS callback timed out", complete.await(10, TimeUnit.SECONDS));
                if ("true".equals(result[0])) return;
                Thread.sleep(500);
            }
            fail("Offline HTML, native bridge, pixel canvas or 32x20 camera did not load");
        }
    }

    private static WebView findWebView(View view) {
        if (view instanceof WebView) return (WebView) view;
        if (!(view instanceof ViewGroup)) return null;
        ViewGroup group = (ViewGroup) view;
        for (int i = 0; i < group.getChildCount(); i++) {
            WebView found = findWebView(group.getChildAt(i));
            if (found != null) return found;
        }
        return null;
    }
}
