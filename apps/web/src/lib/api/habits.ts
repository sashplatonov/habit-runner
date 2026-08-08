import type {
  HabitCreateRequestDto,
  HabitResponseDto,
  HabitStatusUpdateRequestDto,
  HabitUpdateRequestDto,
  CursorPageDto
} from '@/types/habit-api';
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
    throw new Error(`Habit request failed: ${response.status} ${response.statusText}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return await parseResponse<T>(response);
}

export async function createHabit(requestBody: HabitCreateRequestDto): Promise<HabitResponseDto> {
  return await request<HabitResponseDto>('/habits', {
    method: 'POST',
    body: JSON.stringify(requestBody)
  });
}

export async function fetchHabits(): Promise<HabitResponseDto[]> {
  return await request<HabitResponseDto[]>('/habits', {
    method: 'GET'
  });
}

export async function fetchHabitsPage(limit = 50, cursor?: string): Promise<CursorPageDto<HabitResponseDto>> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) {
    params.set('cursor', cursor);
  }
  return await request<CursorPageDto<HabitResponseDto>>(`/habits/page?${params.toString()}`, { method: 'GET' });
}

export async function updateHabit(habitId: string, requestBody: HabitUpdateRequestDto): Promise<HabitResponseDto> {
  return await request<HabitResponseDto>(`/habits/${encodeURIComponent(habitId)}`, {
    method: 'PUT',
    body: JSON.stringify(requestBody)
  });
}

export async function updateHabitStatus(
  habitId: string,
  requestBody: HabitStatusUpdateRequestDto
): Promise<HabitResponseDto> {
  return await request<HabitResponseDto>(`/habits/${encodeURIComponent(habitId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify(requestBody)
  });
}

export async function deleteHabit(habitId: string): Promise<void> {
  await request<void>(`/habits/${encodeURIComponent(habitId)}`, {
    method: 'DELETE'
  });
}
