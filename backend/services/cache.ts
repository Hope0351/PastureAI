/**
 * Lightweight in-memory TTL cache for demo responsiveness
 */
type CacheEntry<T> = { value: T; expiresAt: number };

export class TtlCache {
  private store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  clear(): void {
    this.store.clear();
  }

  stats(): { keys: number } {
    return { keys: this.store.size };
  }
}

export const appCache = new TtlCache();
