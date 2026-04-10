import { buildApiUrl } from '@/lib/api/url';

type FrontendMetricPayload = {
  name: string;
  value: number;
  unit?: string;
  operation?: string;
  status?: number;
  success?: boolean;
};

function isEnabled(): boolean {
  return (import.meta.env.VITE_FRONTEND_METRICS_ENABLED ?? 'true') !== 'false';
}

function sanitizePayload(payload: FrontendMetricPayload): FrontendMetricPayload | null {
  if (!payload.name || !Number.isFinite(payload.value)) {
    return null;
  }

  return {
    name: payload.name,
    value: Math.max(payload.value, 0),
    unit: payload.unit,
    operation: payload.operation,
    status: payload.status,
    success: payload.success
  };
}

export function emitFrontendMetric(payload: FrontendMetricPayload): void {
  if (!isEnabled() || typeof window === 'undefined') {
    return;
  }

  const sanitized = sanitizePayload(payload);
  if (!sanitized) {
    return;
  }

  const url = buildApiUrl('/metrics/frontend');
  const body = JSON.stringify(sanitized);

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon(url, blob)) {
        return;
      }
    }

    void fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body,
      keepalive: true,
      credentials: 'omit',
      cache: 'no-store'
    });
  } catch {
    // Intentionally ignore observability transport errors.
  }
}
