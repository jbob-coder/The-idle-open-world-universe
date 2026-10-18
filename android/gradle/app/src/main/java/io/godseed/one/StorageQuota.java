package io.godseed.one;

/**
 * Bounded, opt-in persistent storage policy. Values are decimal BYTES, not RAM.
 * This is pure Java so policy can be tested without Android SDK or WebView.
 */
public final class StorageQuota {
    public static final long CORE_TARGET_BYTES = 1_000_000_000L;
    public static final long OPTIONAL_CAP_BYTES = 5_000_000_000L;
    public static final long TOTAL_CAP_BYTES = 6_000_000_000L;
    public static final long MIN_FREE_BYTES = 500_000_000L;
    private StorageQuota() {}

    public static long freeReserve(long availableBytes) {
        if (availableBytes < 0) throw new IllegalArgumentException("negative free space");
        long tenPercent = (availableBytes / 10L) + (availableBytes % 10L == 0 ? 0 : 1);
        return Math.max(MIN_FREE_BYTES, tenPercent);
    }

    /**
     * incomingBytes is the actual staged, compressed pack size.
     * previousBytes refers to a pack being replaced, if any (normally zero).
     * At peak, BOTH previous and incoming may be on disk.
     *
     * Never claim this is a measured all-app quota: Android's caches and
     * WebView storage can consume additional bytes outside this pack store.
     */
    public static boolean canStage(long coreBytes, long optionalBytes,
                                   long previousBytes, long incomingBytes,
                                   long availableBytes) {
        if (coreBytes < 0 || optionalBytes < 0 || previousBytes < 0 ||
            incomingBytes <= 0 || availableBytes < 0) return false;
        if (previousBytes > optionalBytes || optionalBytes > OPTIONAL_CAP_BYTES) return false;
        long afterOptional = optionalBytes - previousBytes;
        if (incomingBytes > OPTIONAL_CAP_BYTES - afterOptional) return false;
        long afterTotalOptional = afterOptional + incomingBytes;
        if (coreBytes > TOTAL_CAP_BYTES - afterTotalOptional) return false;
        long reserve = freeReserve(availableBytes);
        return incomingBytes <= availableBytes - reserve;
    }
}
