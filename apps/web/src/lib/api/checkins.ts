import type { CheckinResponseDto, CheckinUpsertRequestDto } from '@/types/checkin-api';
import { buildApiUrl } from '@/lib/api/url';
import { authenticatedFetch } from '@/lib/auth/session';

async function parseResponse<T>(response: Response): Promise<T> {
  return await response.json() as T;
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await authenticatedFetch(buildApiUrl(path), {
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {})
    },
    ...init
  });
  if (!response.ok) {
    throw new Error(`Checkin request failed: ${response.status} ${response.statusText}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return await parseResponse<T>(response);
}

export async function fetchCheckins(): Promise<CheckinResponseDto[]> {
  return await request<CheckinResponseDto[]>('/checkins', { method: 'GET' });
}

export async function upsertCheckin(
  habitId: string,
  date: string,
  requestBody: CheckinUpsertRequestDto
): Promise<CheckinResponseDto> {
  return await request<CheckinResponseDto>(
      `/checkins/habits/${encodeURIComponent(habitId)}/dates/${encodeURIComponent(date)}`,
      {
        method: 'PUT',
        body: JSON.stringify(requestBody)
      }
  );
}

export async function deleteCheckin(habitId: string, date: string): Promise<void> {
  await request<void>(`/checkins/habits/${encodeURIComponent(habitId)}/dates/${encodeURIComponent(date)}`, {
    method: 'DELETE'
  });
}
