package io.godseed.one;

import android.content.Context;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.util.Enumeration;
import java.util.Locale;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;

/**
 * Offline-only lore packs, isolated from localStorage and saved worlds.
 *
 * A .gspack is a ZIP containing exactly manifest.json and lore.json.
 * This implementation does not unzip arbitrary paths: it reads just two
 * named entries, validates both, then stores the original verified archive
 * as one app-private file. No network, script execution or broad permissions.
 */
public final class PackStore {
    private static final int MAX_PACK_BYTES = 8 * 1024 * 1024; // first release: lore ONLY
    private static final int MAX_LORE_BYTES = 2 * 1024 * 1024;
    private static final int MAX_MANIFEST_BYTES = 16 * 1024;
    private final File folder;

    public PackStore(Context context) {
        folder = new File(context.getFilesDir(), "optional-lore");
        if (!folder.isDirectory() && !folder.mkdirs())
            throw new IllegalStateException("Cannot create private content directory");
        File[] dangling = folder.listFiles((dir, name) -> name.startsWith(".incoming-"));
        if (dangling != null) for (File file : dangling) file.delete();
    }
    private static boolean safeId(String id) {
        return id != null && id.matches("[a-z][a-z0-9_-]{0,47}");
    }
    private static byte[] readLimited(InputStream in, int maximum) throws Exception {
        try (InputStream source = in; ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buf = new byte[8192];
            int n;
            while ((n = source.read(buf)) != -1) {
                if (n > maximum - out.size()) throw new IllegalArgumentException("Pack entry exceeds limit");
                out.write(buf, 0, n);
            }
            return out.toByteArray();
        }
    }
    private static String sha256(byte[] bytes) throws Exception {
        byte[] digest = MessageDigest.getInstance("SHA-256").digest(bytes);
        StringBuilder s = new StringBuilder(64);
        for (byte b : digest) s.append(String.format(Locale.ROOT, "%02x", b & 255));
        return s.toString();
    }
    private static JSONObject validatedManifest(File file) throws Exception {
        try (ZipFile zip = new ZipFile(file)) {
            ZipEntry manifestEntry = zip.getEntry("manifest.json");
            ZipEntry loreEntry = zip.getEntry("lore.json");
            if (manifestEntry == null || loreEntry == null)
                throw new IllegalArgumentException("Expected manifest.json and lore.json");
            int count = 0;
            Enumeration<? extends ZipEntry> iterator = zip.entries();
            while (iterator.hasMoreElements()) {
                ZipEntry entry = iterator.nextElement();
                if (!"manifest.json".equals(entry.getName()) &&
                    !"lore.json".equals(entry.getName()))
                    throw new IllegalArgumentException("Unknown ZIP entry");
                if (entry.isDirectory()) throw new IllegalArgumentException("Directories are forbidden");
                count++;
            }
            if (count != 2) throw new IllegalArgumentException("Duplicate or missing ZIP entries");
            JSONObject m = new JSONObject(new String(readLimited(zip.getInputStream(manifestEntry),
                MAX_MANIFEST_BYTES), StandardCharsets.UTF_8));
            String id = m.getString("pack_id");
            if (!safeId(id)) throw new IllegalArgumentException("Invalid pack identifier");
            if (m.getInt("schema_version") != 1 || m.getInt("game_min_version") > 1 ||
                m.getInt("game_min_version") < 1 ||
                !"lore".equals(m.getString("content_type")) || !m.optBoolean("optional", false))
                throw new IllegalArgumentException("Unsupported lore pack");
            JSONArray dependencies = m.optJSONArray("dependencies");
            if (dependencies != null && dependencies.length() != 0)
                throw new IllegalArgumentException("Dependencies unsupported by v1");
            byte[] content = readLimited(zip.getInputStream(loreEntry), MAX_LORE_BYTES);
            if (m.getLong("installed_bytes") != content.length)
                throw new IllegalArgumentException("Incorrect unpacked size");
            if (!sha256(content).equals(m.getString("sha256")))
                throw new IllegalArgumentException("Lore digest mismatch");
            JSONObject lore = new JSONObject(new String(content, StandardCharsets.UTF_8));
            JSONArray entries = lore.getJSONArray("entries");
            if (entries.length() > 128) throw new IllegalArgumentException("Too many lore entries");
            for (int i = 0; i < entries.length(); i++) {
                JSONObject entry = entries.getJSONObject(i);
                String region = entry.getString("region_id");
                String title = entry.getString("title"), body = entry.getString("text");
                if (!region.matches("R0[0-7]") || title.length() < 1 ||
                    title.length() > 100 || body.length() < 1 || body.length() > 4000)
                    throw new IllegalArgumentException("Invalid lore entry");
            }
            return m;
        }
    }
    private File[] installed() {
        File[] files = folder.listFiles((dir, name) -> name.endsWith(".gspack") &&
            safeId(name.substring(0, name.length() - 7)));
        return files == null ? new File[0] : files;
    }
    public synchronized long optionalBytes() {
        long sum = 0;
        for (File f : installed()) sum += f.length();
        return sum;
    }
    public synchronized String install(InputStream selectedFile, long coreBytes) throws Exception {
        long available = folder.getUsableSpace();
        long existing = optionalBytes();
        File stage = File.createTempFile(".incoming-", ".tmp", folder);
        try {
            try (InputStream input = selectedFile; FileOutputStream output = new FileOutputStream(stage)) {
                byte[] buffer = new byte[8192];
                long written = 0;
                int n;
                while ((n = input.read(buffer)) != -1) {
                    written += n;
                    if (written > MAX_PACK_BYTES ||
                        !StorageQuota.canStage(coreBytes, existing, 0, written, available))
                        throw new IllegalArgumentException("Pack size or free-space safety limit exceeded");
                    output.write(buffer, 0, n);
                }
                output.getFD().sync();
            }
            JSONObject meta = validatedManifest(stage);
            String id = meta.getString("pack_id");
            File target = new File(folder, id + ".gspack");
            if (target.exists()) throw new IllegalArgumentException("Pack already installed: " + id);
            if (!StorageQuota.canStage(coreBytes, existing, 0, stage.length(), available))
                throw new IllegalArgumentException("Insufficient storage quota");
            Files.move(stage.toPath(), target.toPath(), StandardCopyOption.ATOMIC_MOVE);
            return id;
        } finally {
            if (stage.exists()) stage.delete();
        }
    }
    public synchronized boolean remove(String id) {
        if (!safeId(id)) return false;
        File target = new File(folder, id + ".gspack");
        return target.isFile() && target.delete();
    }
    public synchronized JSONObject status(long coreBytes) throws Exception {
        JSONObject status = new JSONObject();
        status.put("core_bytes_estimate", coreBytes);
        status.put("optional_used_bytes", optionalBytes());
        status.put("optional_limit_bytes", StorageQuota.OPTIONAL_CAP_BYTES);
        status.put("app_managed_limit_bytes", StorageQuota.TOTAL_CAP_BYTES);
        status.put("phone_free_bytes", folder.getUsableSpace());
        status.put("core_target_bytes", StorageQuota.CORE_TARGET_BYTES);
        status.put("native_app", true);
        JSONArray packs = new JSONArray();
        for (File file : installed()) {
            JSONObject item = new JSONObject();
            item.put("pack_id", file.getName().substring(0, file.getName().length() - 7));
            item.put("bytes", file.length());
            packs.put(item);
        }
        status.put("packs", packs);
        return status;
    }
    public synchronized JSONArray loreForRegion(String region) throws Exception {
        if (!region.matches("R0[0-7]")) throw new IllegalArgumentException("Invalid region");
        JSONArray result = new JSONArray();
        for (File file : installed()) {
            try (ZipFile zip = new ZipFile(file)) {
                byte[] bytes = readLimited(zip.getInputStream(zip.getEntry("lore.json")),
                    MAX_LORE_BYTES);
                JSONArray entries = new JSONObject(new String(bytes,
                    StandardCharsets.UTF_8)).getJSONArray("entries");
                for (int i = 0; i < entries.length(); i++) {
                    JSONObject item = entries.getJSONObject(i);
                    if (region.equals(item.getString("region_id"))) result.put(item);
                }
            }
        }
        return result;
    }
}
