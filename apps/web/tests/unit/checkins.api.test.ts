import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockAuthenticatedFetch } = vi.hoisted(() => ({
  mockAuthenticatedFetch: vi.fn()
}));

vi.mock('$lib/auth/session', () => ({
  authenticatedFetch: mockAuthenticatedFetch
}));

import { deleteCheckin, fetchAllCheckins, upsertCheckin } from '$lib/api/checkins';

describe('checkins api', () => {
  beforeEach(() => {
    mockAuthenticatedFetch.mockReset();
  });

  it('normalizes canonical completion keys to plain calendar dates for upsert', async () => {
    mockAuthenticatedFetch.mockResolvedValue(new Response(JSON.stringify({
      id: 'checkin-1',
      habitId: 'habit-1',
      date: '2026-07-09',
      done: true,
      count: 1,
      createdAt: '2026-07-09T10:00:00Z',
      updatedAt: '2026-07-09T10:00:00Z',
      version: 1
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }));

    await upsertCheckin('habit-1', '2026-07-09T00:00:00Z', { done: true, count: 1 });

    expect(mockAuthenticatedFetch).toHaveBeenCalledWith(
      expect.stringContaining('/checkins/habits/habit-1/dates/2026-07-09'),
      expect.objectContaining({ method: 'PUT' })
    );
  });

  it('normalizes canonical completion keys to plain calendar dates for delete', async () => {
    mockAuthenticatedFetch.mockResolvedValue(new Response(null, { status: 204 }));

    await deleteCheckin('habit-1', '2026-07-09T00:00:00Z');

    expect(mockAuthenticatedFetch).toHaveBeenCalledWith(
      expect.stringContaining('/checkins/habits/habit-1/dates/2026-07-09'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('loads all check-in pages in cursor order', async () => {
    mockAuthenticatedFetch
      .mockResolvedValueOnce(new Response(JSON.stringify({
        items: [{ id: 'checkin-1' }],
        nextCursor: 'cursor-1'
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        items: [{ id: 'checkin-2' }],
        nextCursor: null
      }), { status: 200 }));

    await expect(fetchAllCheckins(1)).resolves.toEqual([
      { id: 'checkin-1' },
      { id: 'checkin-2' }
    ]);
    expect(mockAuthenticatedFetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/checkins/page?limit=1&cursor=cursor-1'),
      expect.anything()
    );
  });

  it('rejects a repeated cursor instead of looping forever', async () => {
    mockAuthenticatedFetch
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [], nextCursor: 'cursor-1' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [], nextCursor: 'cursor-1' }), { status: 200 }));

    await expect(fetchAllCheckins()).rejects.toThrow('Invalid or repeated check-in cursor');
  });
});
