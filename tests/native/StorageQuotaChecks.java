package io.godseed.one;

public final class StorageQuotaChecks {
    private static int passed = 0;
    private static void ok(boolean condition, String message) {
        if (!condition) throw new AssertionError(message);
        passed++;
    }
    private static boolean accept(long core, long optional, long old, long incoming, long free) {
        return StorageQuota.canStage(core, optional, old, incoming, free);
    }
    public static void main(String[] args) {
        ok(StorageQuota.CORE_TARGET_BYTES == 1_000_000_000L, "decimal core target");
        ok(StorageQuota.OPTIONAL_CAP_BYTES == 5_000_000_000L, "decimal optional cap");
        ok(StorageQuota.TOTAL_CAP_BYTES == 6_000_000_000L, "decimal total cap");
        ok(StorageQuota.freeReserve(0) == 500_000_000L, "fixed minimum reserve");
        ok(StorageQuota.freeReserve(1_000_000_000L) == 500_000_000L, "1 GB reserve floor");
        ok(StorageQuota.freeReserve(5_000_000_000L) == 500_000_000L, "10% equal floor");
        ok(StorageQuota.freeReserve(9_000_000_001L) == 900_000_001L, "rounds fraction up");
        ok(accept(1_000_000_000L, 0, 0, 2_000_000L, 2_000_000_000L), "small pack approved");
        ok(!accept(1_000_000_000L, 0, 0, 2_000_000L, 300_000_000L), "low space");
        ok(!accept(1_000_000_000L, 0, 0, 0, 2_000_000_000L), "empty pack");
        ok(!accept(-1, 0, 0, 100, 2_000_000_000L), "negative core");
        ok(!accept(0, -1, 0, 100, 2_000_000_000L), "negative optional");
        ok(!accept(0, 0, -1, 100, 2_000_000_000L), "negative previous");
        ok(!accept(0, 0, 0, -1, 2_000_000_000L), "negative incoming");
        ok(!accept(0, 0, 0, 100, -1), "negative available");
        ok(!accept(0, 2, 3, 100, 2_000_000_000L), "cannot replace more than used");
        ok(!accept(1_000_000_000L, 5_000_000_000L, 0, 1, 2_000_000_000L), "optional cap");
        ok(!accept(5_999_999_999L, 0, 0, 2, 2_000_000_000L), "total cap");
        ok(accept(1_000_000_000L, 4_000_000_000L, 0, 1_000_000_000L, 8_000_000_000L), "boundary 5GB allowed");
        ok(!accept(1_000_000_000L, 4_000_000_000L, 0, 1_000_000_001L, 8_000_000_000L), "boundary +1 rejected");
        ok(accept(1_000_000_000L, 4_000_000_000L, 1_000_000_000L, 1_000_000_000L, 8_000_000_000L), "replacement does not double count final footprint");
        ok(!accept(1_000_000_000L, 4_000_000_000L, 1_000_000_000L, 1_000_000_000L, 1_400_000_000L), "but replacement requires staging headroom");
        ok(!accept(1_000_000_000L, 0, 0, 1_000_000_001L, 1_500_000_000L), "must leave the reserve");
        ok(accept(1_000_000_000L, 0, 0, 999_999_999L, 1_500_000_000L), "one-byte headroom");
        ok(!accept(1_000_000_000L, 0, 0, Long.MAX_VALUE, Long.MAX_VALUE), "no arithmetic overflow");
        ok(!accept(Long.MAX_VALUE, 0, 0, 100, Long.MAX_VALUE), "overflow-resistant core");
        ok(!accept(0, Long.MAX_VALUE, 0, 100, Long.MAX_VALUE), "invalid existing use");
        ok(StorageQuota.freeReserve(1) == 500_000_000L, "small free reserve");
        System.out.println("PASS " + passed + " native storage quota boundary checks");
    }
}
