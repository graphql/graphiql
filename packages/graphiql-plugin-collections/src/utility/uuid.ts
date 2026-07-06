/** Stable unique id for collections and operations. Uses `crypto.randomUUID`
 * when available, falling back to a timestamp + random suffix on plain http
 * where `crypto.randomUUID` is undefined. */
export function randomId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') {
    return c.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
