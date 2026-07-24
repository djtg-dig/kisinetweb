type CacheEntry<T> = {
  value?: T;
  expiresAt: number;
  promise?: Promise<T>;
};

const requestCache = new Map<string, CacheEntry<unknown>>();

type CacheOptions = {
  ttlMs?: number;
};

export function dedupeRequest<T>(
  key: string,
  loader: () => Promise<T>,
  options: CacheOptions = {},
): Promise<T> {
  const now = Date.now();
  const existing = requestCache.get(key) as CacheEntry<T> | undefined;

  if (existing?.value !== undefined && existing.expiresAt > now) {
    return Promise.resolve(existing.value);
  }

  if (existing?.promise) {
    return existing.promise;
  }

  const promise = loader()
    .then((value) => {
      const ttlMs = options.ttlMs ?? 0;
      if (ttlMs > 0) {
        requestCache.set(key, {
          value,
          expiresAt: Date.now() + ttlMs,
        });
      } else {
        requestCache.delete(key);
      }

      return value;
    })
    .catch((error) => {
      requestCache.delete(key);
      throw error;
    });

  requestCache.set(key, {
    expiresAt: 0,
    promise,
  });

  return promise;
}

export function clearApiRequestCache() {
  requestCache.clear();
}
