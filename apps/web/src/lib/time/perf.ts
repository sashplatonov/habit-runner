/** Returns a monotonic timestamp in milliseconds, using `performance.now()` when available. */
export function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

/** Returns elapsed milliseconds since `startedAt` (from `nowMs()`), rounded to the nearest ms. */
export function durationMs(startedAt: number): number {
  return Math.round(nowMs() - startedAt);
}
