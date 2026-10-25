const listeners = new Set<() => void>();
let channel: BroadcastChannel | null = null;

const cache = new Map<string, { raw: string | null; value: unknown }>();

function emit() {
  listeners.forEach((listener) => listener());
  channel?.postMessage(Date.now());
}

function onStorage(event: StorageEvent) {
  if (!event.key || event.key.startsWith('medquiz-v2')) emit();
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1 && typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage);
    channel = new BroadcastChannel('medquiz-v2');
    channel.onmessage = () => listeners.forEach((item) => item());
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener('storage', onStorage);
      channel?.close();
      channel = null;
    }
  };
}

export function readFresh<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(key);
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T;
  try {
    const value = raw ? (JSON.parse(raw) as T) : fallback;
    cache.set(key, { raw, value });
    return value;
  } catch {
    cache.set(key, { raw, value: fallback });
    return fallback;
  }
}

export function writeKey(key: string, value: unknown) {
  const raw = JSON.stringify(value);
  window.localStorage.setItem(key, raw);
  cache.set(key, { raw, value });
  emit();
}

export function updateKey<T>(key: string, fallback: T, fn: (current: T) => T): T {
  const raw = window.localStorage.getItem(key);
  let current = fallback;
  try {
    current = raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    current = fallback;
  }
  const next = fn(current);
  writeKey(key, next);
  return next;
}

export function readSession<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeSession(key: string, value: unknown) {
  window.sessionStorage.setItem(key, JSON.stringify(value));
}

export function clearSession(key: string) {
  window.sessionStorage.removeItem(key);
}
