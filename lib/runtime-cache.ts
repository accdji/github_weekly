type CacheEntry = {
  expiresAt: number;
  value: Promise<unknown>;
};

const globalCache = globalThis as typeof globalThis & {
  __trendRuntimeCache?: Map<string, CacheEntry>;
};

const runtimeCache = globalCache.__trendRuntimeCache ?? new Map<string, CacheEntry>();

if (!globalCache.__trendRuntimeCache) {
  globalCache.__trendRuntimeCache = runtimeCache;
}

export function memoizeWithTTL<Args extends unknown[], Result>(
  keyPrefix: string,
  ttlSeconds: number,
  fn: (...args: Args) => Promise<Result>,
) {
  return async (...args: Args): Promise<Result> => {
    const key = `${keyPrefix}:${JSON.stringify(args)}`;
    const now = Date.now();
    const cached = runtimeCache.get(key);

    if (cached && cached.expiresAt > now) {
      return cached.value as Promise<Result>;
    }

    const pending = fn(...args);
    runtimeCache.set(key, {
      expiresAt: now + ttlSeconds * 1000,
      value: pending,
    });

    try {
      const resolved = await pending;
      runtimeCache.set(key, {
        expiresAt: now + ttlSeconds * 1000,
        value: Promise.resolve(resolved),
      });
      return resolved;
    } catch (error) {
      runtimeCache.delete(key);
      throw error;
    }
  };
}
