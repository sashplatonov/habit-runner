import type { PullResponseDto, PushResponseDto } from '@/types/sync';
import type { OutboxEntry } from '@/lib/storage/db';
import { buildApiUrl } from '@/lib/api/url';
import { getValidAccessToken } from '@/lib/auth/session';
import { logClientError, logClientInfo } from '@/lib/logging/clientLogger';

const buildUrl = buildApiUrl;

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function createErrorWithCause(message: string, cause: unknown): Error {
  const error = new Error(message);
  (error as Error & { cause?: unknown }).cause = cause;
  return error;
}

function parseDurationHeader(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }
  return Math.round(parsed);
}

function getServerDurationMs(response: Response): number | undefined {
  const explicitHeader = parseDurationHeader(response.headers.get('x-sync-duration-ms'));
  if (explicitHeader !== undefined) {
    return explicitHeader;
  }
  const serverTiming = response.headers.get('server-timing');
  if (!serverTiming) {
    return undefined;
  }
  const match = serverTiming.match(/dur=([0-9.]+)/i);
  return match ? parseDurationHeader(match[1]) : undefined;
}

function logSyncHttpSuccess(
  url: string,
  method: string,
  response: Response,
  startedAt: number
): void {
  const durationMs = Math.round(nowMs() - startedAt);
  const context: Record<string, unknown> = {
    url,
    method,
    status: response.status,
    durationMs
  };
  const serverDurationMs = getServerDurationMs(response);
  if (serverDurationMs !== undefined) {
    context.serverDurationMs = serverDurationMs;
  }
  logClientInfo('sync.http_request', 'Sync request completed', context);
}

function logSyncHttpFailure(
  url: string,
  method: string,
  startedAt: number,
  err: unknown,
  status?: number
): void {
  const durationMs = Math.round(nowMs() - startedAt);
  const context: Record<string, unknown> = {
    url,
    method,
    durationMs,
    error: err instanceof Error ? err.message : String(err)
  };
  if (status !== undefined) {
    context.status = status;
  }
  logClientError('sync.http_failed', 'Sync request failed', context);
}

async function parseJsonResponse<T>(
  response: Response,
  operation: 'pull' | 'push'
): Promise<T> {
  const startedAt = nowMs();
  const payload = await response.json() as T;
  const duration = Math.round(nowMs() - startedAt);
  const payloadRecord = typeof payload === 'object' && payload !== null
    ? payload as Record<string, unknown>
    : null;
  const habits = payloadRecord?.['habits'];
  const checkins = payloadRecord?.['checkins'];
  const tombstones = payloadRecord?.['tombstones'];
  const summary = payloadRecord
    ? {
        habits: Array.isArray(habits) ? habits.length : undefined,
        checkins: Array.isArray(checkins) ? checkins.length : undefined,
        tombstones: Array.isArray(tombstones) ? tombstones.length : undefined
      }
    : undefined;
  logClientInfo('sync.http_body_parsed', 'Sync response body parsed', {
    operation,
    durationMs: duration,
    ...summary
  });
  return payload;
}

async function fetchJson(
  url: string,
  init: RequestInit = {},
  timeoutMs = 15_000
): Promise<Response> {
  const startedAt = nowMs();
  const method = init.method ?? 'GET';
  const headers = new Headers(init.headers);
  const accessToken = await getValidAccessToken();
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  } else {
    throw new Error('Authentication required');
  }
  if (init.method && init.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      headers,
      cache: 'no-store',
      signal: controller.signal
    });
    if (!response.ok) {
      logSyncHttpFailure(url, method, startedAt, new Error(`HTTP ${response.status}`), response.status);
      throw new Error(
        `Sync request failed: ${response.status} ${response.statusText}`
      );
    }
    logSyncHttpSuccess(url, method, response, startedAt);
    return response;
  } catch (err: unknown) {
    logSyncHttpFailure(url, method, startedAt, err);
    // Preserve original error as `cause` when wrapping to satisfy preserve-caught-error.
    if (err instanceof Error && (err as Error).name === 'AbortError') {
      throw createErrorWithCause('Sync request timed out', err);
    }
    if (err instanceof Error) {
      throw err;
    }
    // Non-Error throwables: normalize to Error while preserving the original value.
    throw createErrorWithCause('Sync request failed with a non-Error throwable', err);
  } finally {
    clearTimeout(timeoutHandle);
  }
}

export async function pullChanges(
  since?: string
): Promise<PullResponseDto> {
  const url = new URL(buildUrl('/sync/pull'));
  if (since) {url.searchParams.set('since', since);}
  const response = await fetchJson(url.toString(), { method: 'GET' });
  return await parseJsonResponse<PullResponseDto>(response, 'pull');
}

export async function pushChanges(
  entries: OutboxEntry[]
): Promise<PushResponseDto> {
  const payload = {
    ops: entries.map((entry) => ({
      id: entry.id,
      entity: entry.entity,
      type: entry.type,
      payload: entry.payload,
      clientTime: entry.clientTime
    }))
  };
  const response = await fetchJson(buildUrl('/sync/push'), {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return await parseJsonResponse<PushResponseDto>(response, 'push');
}
