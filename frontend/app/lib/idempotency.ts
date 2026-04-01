// Simple in-memory idempotency store for API layer.
// Production: replace with Redis (e.g., Upstash) and set a TTL.
// Reason: Prevent duplicate POST processing at the API layer.

export type StoredResponse = {
  status: number;
  payload: unknown;
  storedAt: number; // ms
  ttlMs: number;
};

const store = new Map<string, StoredResponse>();

export function buildIdemKey(scope: string, userId: string, key: string) {
  return `idem:${scope}:${userId}:${key}`;
}

export function setIdempotent(key: string, payload: unknown, status = 200, ttlMs = 15 * 60 * 1000) {
  const value: StoredResponse = { status, payload, storedAt: Date.now(), ttlMs };
  store.set(key, value);
}

export function getIdempotent(key: string): StoredResponse | null {
  const v = store.get(key);
  if (!v) return null;
  if (Date.now() - v.storedAt > v.ttlMs) {
    store.delete(key);
    return null;
  }
  return v;
}

export function purgeExpired() {
  const now = Date.now();
  for (const [k, v] of store.entries()) {
    if (now - v.storedAt > v.ttlMs) {
      store.delete(k);
    }
  }
}
