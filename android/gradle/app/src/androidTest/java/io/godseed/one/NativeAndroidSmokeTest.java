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


    /**
     * Real Android WebView persistence regression. Saving a deterministic Nim
     * world in the Gradle host must survive Activity/WebView recreation.
     * This test deliberately does not use the browser mock bridge.
     */
    @Test public void saveRestoresAcrossNativeActivityRecreation() throws Exception {
        try (ActivityScenario<MainActivity> activity = ActivityScenario.launch(MainActivity.class)) {
            boolean ready = false;
            for (int i = 0; i < 30; i++) {
                String value = evaluate(activity,
                    "typeof window.GodseedDebug==='object' && document.readyState==='complete'");
                if ("true".equals(value)) { ready = true; break; }
                Thread.sleep(500);
            }
            assertTrue("Game JavaScript not ready", ready);
            String before = evaluate(activity,
                "(function(){GodseedDebug.newWorld(9817);GodseedDebug.setSpeed(0);" +
                "GodseedDebug.step(13);document.getElementById('save').click();" +
                "return JSON.parse(localStorage.getItem('godseed-one-small-life-v1')).tick;})()");
            assertEquals("13", before);
            activity.recreate();
            // Restore deliberately resumes at speed 1, so the simulation may
            // advance beyond tick 13 before the first instrumentation callback.
            // Stop it and verify the saved world identity plus monotonic progress.
            boolean restored = false;
            for (int i = 0; i < 30; i++) {
                String value = evaluate(activity,
                    "(function(){if(typeof window.GodseedDebug!=='object')return false;" +
                    "GodseedDebug.setSpeed(0);var world=GodseedDebug.getState();" +
                    "return world.worldSeed===9817 && world.tick>=13;})()");
                if ("true".equals(value)) { restored = true; break; }
                Thread.sleep(500);
            }
            assertTrue("Saved seed and progress not restored after native Activity recreation", restored);
        }
    }

    /**
     * The user may exit before the regular autosave timer fires.
     * Exercise actual WebView persistence without clicking the manual Save button.
     */
    @Test public void savesUnsavedWorldBeforeNativeExit() throws Exception {
        try (ActivityScenario<MainActivity> activity = ActivityScenario.launch(MainActivity.class)) {
            boolean ready = false;
            for (int i = 0; i < 30; i++) {
                if ("true".equals(evaluate(activity,
                    "typeof window.GodseedDebug==='object' && document.readyState==='complete'"))) {
                    ready = true;
                    break;
                }
                Thread.sleep(500);
            }
            assertTrue("Game not ready for exit test", ready);
            String before = evaluate(activity,
                "(function(){GodseedDebug.newWorld(17017);GodseedDebug.setSpeed(0);" +
                "GodseedDebug.step(23);localStorage.removeItem('godseed-one-small-life-v1');" +
                "return GodseedDebug.getState().tick;})()");
            assertEquals("23", before);
            assertEquals("true", evaluate(activity,
                "localStorage.getItem('godseed-one-small-life-v1')===null"));
            activity.onActivity(MainActivity::saveAndExit);
            boolean destroyed = false;
            for (int i = 0; i < 40; i++) {
                if ("DESTROYED".equals(activity.getState().name())) {
                    destroyed = true;
                    break;
                }
                Thread.sleep(150);
            }
            assertTrue("Save callback must finish native Activity", destroyed);
        }
        try (ActivityScenario<MainActivity> next = ActivityScenario.launch(MainActivity.class)) {
            boolean recovered = false;
            for (int i = 0; i < 30; i++) {
                String recoveredWorld = evaluate(next,
                    "(function(){if(typeof window.GodseedDebug!=='object')return false;" +
                    "GodseedDebug.setSpeed(0);var world=GodseedDebug.getState();" +
                    "return world.worldSeed===17017 && world.tick>=23;})()");
                if ("true".equals(recoveredWorld)) {
                    recovered = true;
                    break;
                }
                Thread.sleep(500);
            }
            assertTrue("Unsaved world changes must survive confirmed native exit", recovered);
        }
    }

    private static String evaluate(ActivityScenario<MainActivity> activity, String js)
            throws InterruptedException {
        CountDownLatch done = new CountDownLatch(1);
        final String[] response = {null};
        activity.onActivity(a -> {
            WebView web = findWebView(a.findViewById(android.R.id.content));
            assertNotNull(web);
            web.evaluateJavascript(js, result -> {
                response[0] = result;
                done.countDown();
            });
        });
        assertTrue("Native WebView evaluateJavascript timeout", done.await(15, TimeUnit.SECONDS));
        return response[0];
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
