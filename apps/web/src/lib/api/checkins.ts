import type { CheckinResponseDto, CheckinUpsertRequestDto, CursorPageDto } from '@/types/checkin-api';
import { completionKeyToCalendarDate } from '@/lib/completionKey';
import { buildApiUrl } from '@/lib/api/url';
import { authenticatedFetch } from '@/lib/auth/session';
import { ApiError } from '$lib/api/ApiError';

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
    throw await ApiError.fromResponse(response);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return await parseResponse<T>(response);
}

function toCheckinPathDate(date: string): string {
  return completionKeyToCalendarDate(date);
}

export async function fetchCheckins(): Promise<CheckinResponseDto[]> {
  return await request<CheckinResponseDto[]>('/checkins', { method: 'GET' });
}

export async function fetchCheckinsPage(limit = 50, cursor?: string): Promise<CursorPageDto<CheckinResponseDto>> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) {
    params.set('cursor', cursor);
  }
  return await request<CursorPageDto<CheckinResponseDto>>(`/checkins/page?${params.toString()}`, { method: 'GET' });
}

export async function upsertCheckin(
  habitId: string,
  date: string,
  requestBody: CheckinUpsertRequestDto
): Promise<CheckinResponseDto> {
  return await request<CheckinResponseDto>(
      `/checkins/habits/${encodeURIComponent(habitId)}/dates/${encodeURIComponent(toCheckinPathDate(date))}`,
      {
        method: 'PUT',
        body: JSON.stringify(requestBody)
      }
  );
}

export async function deleteCheckin(habitId: string, date: string): Promise<void> {
  await request<void>(`/checkins/habits/${encodeURIComponent(habitId)}/dates/${encodeURIComponent(toCheckinPathDate(date))}`, {
    method: 'DELETE'
  });
}
