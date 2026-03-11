import type { PullResponseDto, PushResponseDto } from '@/types/sync';
import type { OutboxEntry } from '@/lib/storage/db';
import { buildApiUrl } from '@/lib/api/url';
import { getValidAccessToken } from '@/lib/auth/session';

const buildUrl = buildApiUrl;

async function fetchJson(
  url: string,
  init: RequestInit = {}
): Promise<Response> {
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

  const response = await fetch(url, { ...init, headers });
  if (!response.ok) {
    throw new Error(
      `Sync request failed: ${response.status} ${response.statusText}`
    );
  }
  return response;
}

export async function pullChanges(
  since?: string
): Promise<PullResponseDto> {
  const url = new URL(buildUrl('/sync/pull'));
  if (since) {url.searchParams.set('since', since);}
  const response = await fetchJson(url.toString(), { method: 'GET' });
  return response.json();
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
  return response.json();
}
