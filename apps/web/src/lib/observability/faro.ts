/**
 * Grafana Faro RUM initialisation + typed business-event helpers.
 *
 * All configuration is read from Vite env variables (VITE_FARO_*).
 * Set VITE_FARO_ENABLED=false to disable every helper as a no-op – useful
 * for local development and unit tests without requiring env stubs.
 *
 * Import order matters: call initFaro() as early as possible in main
 * entry-point (before any fetch / XHR that should be traced).
 */

import type { Faro } from '@grafana/faro-web-sdk';

// ── Module-level singleton ──────────────────────────────────────────────────
let _faro: Faro | null = null;

function isEnabled(): boolean {
  return (import.meta.env.VITE_FARO_ENABLED as string | undefined) !== 'false';
}

// ── Sampling helpers ─────────────────────────────────────────────────────────

const STORAGE_KEY = 'habbit_runner_faro_sampled_v1';

function resolveSampled(rate: number, persistent: boolean): boolean {
  if (persistent) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        return stored === '1';
      }
    } catch {
      // storage blocked – fall through to fresh sample
    }
  }

  const sampled = Math.random() < Math.max(0, Math.min(1, rate));

  if (persistent) {
    try {
      localStorage.setItem(STORAGE_KEY, sampled ? '1' : '0');
    } catch { /* ignore */ }
  }

  return sampled;
}

// ── Initialisation ───────────────────────────────────────────────────────────

/**
 * Dynamically imports Faro packages (tree-shaking friendly) and initialises
 * the SDK.  Must be awaited before the first network request you want traced.
 */
export async function initFaro(): Promise<void> {
  if (typeof window === 'undefined' || !isEnabled()) {
    return;
  }

  const url = import.meta.env.VITE_FARO_URL as string | undefined;
  if (!url) {
    return;
  }

  const samplingRate = Number(import.meta.env.VITE_FARO_SAMPLING_RATE ?? '1');
  const persistent = (import.meta.env.VITE_FARO_PERSISTENT_SESSIONS as string | undefined) === 'true';

  if (!resolveSampled(samplingRate, persistent)) {
    return;
  }

  try {
    const [faroPkg, tracingPkg] = await Promise.all([
      import('@grafana/faro-web-sdk'),
      import('@grafana/faro-web-tracing'),
    ]);

    const {
      initializeFaro,
      FetchInstrumentation,
      XhrInstrumentation,
      ConsoleInstrumentation,
      ErrorsInstrumentation,
      PerformanceInstrumentation,
      SessionInstrumentation,
    } = faroPkg;

    const { TracingInstrumentation } = tracingPkg;

    _faro = initializeFaro({
      url,
      app: {
        name: (import.meta.env.VITE_FARO_APP_NAME as string | undefined) ?? 'Habbit Runner',
        version: (import.meta.env.VITE_FARO_APP_VERSION as string | undefined) ?? '1.0.0',
        environment: (import.meta.env.VITE_FARO_ENVIRONMENT as string | undefined) ?? 'production',
      },
      /*
       * TracingInstrumentation propagates W3C traceparent into every outgoing
       * fetch/XHR request, connecting the browser span to the backend trace.
       * The backend reads the header via quarkus-opentelemetry automatically.
       */
      instrumentations: [
        new FetchInstrumentation(),
        new XhrInstrumentation(),
        new ConsoleInstrumentation(),
        new ErrorsInstrumentation(),
        new PerformanceInstrumentation(),
        new SessionInstrumentation(),
        new TracingInstrumentation(),
      ],
    });
  } catch (err) {
    // Faro is best-effort: never let it crash the app startup.
    // eslint-disable-next-line no-console
    console.warn('[faro] init failed:', err);
  }
}

/**
 * Attach authenticated user metadata so Faro sessions can be correlated with
 * the backend user ID.  Call after the auth session is resolved.
 */
export function setFaroUser(userId: string, email?: string): void {
  if (!isEnabled() || !_faro) {
    return;
  }
  _faro.api.setUser({ id: userId, email });
}

// ── Typed business-event helpers ─────────────────────────────────────────────
// These are the only public surface callers should use; they never throw.

export function trackSyncStarted(type: 'pull' | 'push'): void {
  if (!isEnabled() || !_faro) {
    return;
  }
  _faro.api.pushEvent('sync_started', { type }, 'sync');
}

export function trackSyncCompleted(type: 'pull' | 'push', durationMs: number): void {
  if (!isEnabled() || !_faro) {
    return;
  }
  _faro.api.pushEvent('sync_completed', { type, duration_ms: String(durationMs) }, 'sync');
  _faro.api.pushMeasurement({
    type: 'sync_duration',
    values: { duration_ms: durationMs },
  });
}

export function trackSyncFailed(type: 'pull' | 'push', error: unknown): void {
  if (!isEnabled() || !_faro) {
    return;
  }
  const message = error instanceof Error ? error.message : String(error);
  _faro.api.pushEvent('sync_failed', { type, error: message }, 'sync');
  _faro.api.pushError(error instanceof Error ? error : new Error(message));
}

