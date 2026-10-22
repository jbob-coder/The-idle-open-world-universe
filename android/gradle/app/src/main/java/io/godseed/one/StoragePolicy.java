package io.godseed.one;
/** Decimal disk budgets. These values never allocate space or describe RAM. */
public final class StoragePolicy {
    public static final long OPTIONAL_MAX=5_000_000_000L, MANAGED_MAX=6_000_000_000L, RESERVE_MIN=500_000_000L;
    public static long reserve(long free) { return Math.max(RESERVE_MIN,free/10+(free%10==0?0:1)); }
    public static boolean accept(long core,long optional,long free,long incoming,long replaced) {
        if(core<0||optional<0||free<0||incoming<0||replaced<0||replaced>optional)return false;
        try {
            long next=Math.addExact(optional-replaced,incoming);
            // Old bytes remain until the new file is verified and swapped.
            return next<=OPTIONAL_MAX&&Math.addExact(core,next)<=MANAGED_MAX&&free-incoming>=reserve(free);
        } catch(ArithmeticException overflow) { return false; }
    }
    private StoragePolicy() {}
}
