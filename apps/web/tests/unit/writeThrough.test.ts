import type { OutboxEntry } from '@/lib/storage/db';
import { syncEntriesWithFallback } from '@/lib/sync/writeThrough';
import { pullChanges, pushChanges } from '@/lib/api/sync';
import {
  applyAcknowledgedPushResponse,
  applyPullResponse,
  enqueueOutboxEntry,
  ensureSyncMeta,
  updateOutboxEntryFailure,
  updateSyncMeta
} from '@/lib/storage/db';

vi.mock('@/lib/api/sync', () => ({
  pullChanges: vi.fn(),
  pushChanges: vi.fn()
}));

vi.mock('@/lib/core/config', () => ({
  SYNC_ENABLED: true,
  SYNC_DISABLED_REASON: 'sync disabled'
}));

vi.mock('@/lib/storage/db', () => ({
  applyAcknowledgedPushResponse: vi.fn(),
  applyPullResponse: vi.fn(),
  enqueueOutboxEntry: vi.fn(),
  ensureSyncMeta: vi.fn(),
  getBackoffMs: vi.fn(() => 1_000),
  updateOutboxEntryFailure: vi.fn(),
  updateSyncMeta: vi.fn()
}));

const mockedPullChanges = vi.mocked(pullChanges);
const mockedPushChanges = vi.mocked(pushChanges);
const mockedApplyAcknowledgedPushResponse = vi.mocked(applyAcknowledgedPushResponse);
const mockedApplyPullResponse = vi.mocked(applyPullResponse);
const mockedEnqueueOutboxEntry = vi.mocked(enqueueOutboxEntry);
const mockedEnsureSyncMeta = vi.mocked(ensureSyncMeta);
const mockedUpdateOutboxEntryFailure = vi.mocked(updateOutboxEntryFailure);
const mockedUpdateSyncMeta = vi.mocked(updateSyncMeta);

const baseEntry: OutboxEntry = {
  id: 'op-1',
  userId: 'user-1',
  entity: 'habit',
  type: 'upsert',
  payload: { id: 'habit-1', name: 'Read' },
  clientTime: '2026-03-12T10:00:00.000Z',
  status: 'pending',
  retryCount: 0,
  nextRetryAt: null,
  createdAt: '2026-03-12T10:00:00.000Z'
};

function setNavigatorOnline(onLine: boolean) {
  Object.defineProperty(globalThis, 'navigator', {
    value: { onLine },
    configurable: true
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedEnsureSyncMeta.mockResolvedValue({
    id: 'meta:user-1',
    status: 'idle',
    lastCursor: 'cursor-1'
  });
  setNavigatorOnline(true);
});

test('pushes changes immediately when network is available', async () => {
  mockedPullChanges.mockResolvedValueOnce({
    habits: [],
    checkins: [],
    tombstones: [],
    nextCursor: 'cursor-2',
    serverTime: '2026-03-12T10:01:00.000Z'
  });
  mockedPushChanges.mockResolvedValue({
    applied: ['op-1'],
    conflicts: [],
    serverTime: '2026-03-12T10:01:30.000Z',
    habits: [],
    checkins: [],
    tombstones: []
  });

  const result = await syncEntriesWithFallback([baseEntry]);

  expect(result).toEqual({
    status: 'synced',
    applied: 1,
    queued: 0,
    conflicts: 0,
    lastError: undefined
  });
  expect(mockedPushChanges).toHaveBeenCalledWith([baseEntry]);
  expect(mockedEnqueueOutboxEntry).not.toHaveBeenCalled();
  expect(mockedApplyPullResponse).toHaveBeenCalledTimes(1);
  expect(mockedApplyAcknowledgedPushResponse).toHaveBeenCalledTimes(1);
  expect(mockedUpdateOutboxEntryFailure).not.toHaveBeenCalled();
});

test('queues changes in outbox when browser is offline', async () => {
  setNavigatorOnline(false);

  const result = await syncEntriesWithFallback([baseEntry]);

  expect(result).toEqual({
    status: 'queued',
    applied: 0,
    queued: 1,
    conflicts: 0,
    lastError: 'network unavailable'
  });
  expect(mockedPullChanges).not.toHaveBeenCalled();
  expect(mockedPushChanges).not.toHaveBeenCalled();
  expect(mockedEnqueueOutboxEntry).toHaveBeenCalledWith(baseEntry);
  expect(mockedUpdateSyncMeta).toHaveBeenCalledWith({
    status: 'offline',
    lastError: 'network unavailable'
  });
});

test('queues changes when the initial pull fails', async () => {
  mockedPullChanges.mockRejectedValueOnce(new Error('Authentication required'));

  const result = await syncEntriesWithFallback([baseEntry]);

  expect(result).toEqual({
    status: 'queued',
    applied: 0,
    queued: 1,
    conflicts: 0,
    lastError: 'Authentication required'
  });
  expect(mockedPushChanges).not.toHaveBeenCalled();
  expect(mockedEnqueueOutboxEntry).toHaveBeenCalledWith(baseEntry);
  expect(mockedUpdateOutboxEntryFailure).not.toHaveBeenCalled();
  expect(mockedUpdateSyncMeta).toHaveBeenLastCalledWith({
    status: 'error',
    lastError: 'Authentication required'
  });
});

test('queues changes when the push request throws', async () => {
  mockedPullChanges.mockResolvedValueOnce({
    habits: [],
    checkins: [],
    tombstones: [],
    nextCursor: 'cursor-2',
    serverTime: '2026-03-12T10:01:00.000Z'
  });
  mockedPushChanges.mockRejectedValueOnce(new Error('Sync request failed'));

  const result = await syncEntriesWithFallback([baseEntry]);

  expect(result).toEqual({
    status: 'queued',
    applied: 0,
    queued: 1,
    conflicts: 0,
    lastError: 'Sync request failed'
  });
  expect(mockedEnqueueOutboxEntry).toHaveBeenCalledWith(baseEntry);
  expect(mockedUpdateOutboxEntryFailure).not.toHaveBeenCalled();
  expect(mockedUpdateSyncMeta).toHaveBeenLastCalledWith({
    status: 'error',
    lastError: 'Sync request failed'
  });
});

test('moves rejected push responses to outbox with retry metadata', async () => {
  mockedPullChanges.mockResolvedValueOnce({
    habits: [],
    checkins: [],
    tombstones: [],
    nextCursor: 'cursor-2',
    serverTime: '2026-03-12T10:01:00.000Z'
  });
  mockedPushChanges.mockResolvedValue({
    applied: [],
    conflicts: [{ opId: 'op-1', reason: 'server already has newer habit' }],
    serverTime: '2026-03-12T10:01:30.000Z',
    habits: [],
    checkins: [],
    tombstones: []
  });

  const result = await syncEntriesWithFallback([baseEntry]);

  expect(result).toEqual({
    status: 'queued',
    applied: 0,
    queued: 1,
    conflicts: 1,
    lastError: 'Some changes were queued for retry'
  });
  expect(mockedEnqueueOutboxEntry).toHaveBeenCalledWith(baseEntry);
  expect(mockedUpdateOutboxEntryFailure).toHaveBeenCalledTimes(1);
  expect(mockedUpdateOutboxEntryFailure).toHaveBeenCalledWith(
    baseEntry,
    'server already has newer habit',
    expect.any(String)
  );
});

test('coalesces rapid write-through calls into one push batch', async () => {
  vi.useFakeTimers();
  mockedPullChanges.mockResolvedValue({
    habits: [],
    checkins: [],
    tombstones: [],
    nextCursor: 'cursor-2',
    serverTime: '2026-03-12T10:01:00.000Z'
  });
  mockedPushChanges.mockResolvedValue({
    applied: ['op-1', 'op-2'],
    conflicts: [],
    serverTime: '2026-03-12T10:01:30.000Z',
    habits: [],
    checkins: [],
    tombstones: []
  });

  const secondEntry = {
    ...baseEntry,
    id: 'op-2',
    payload: { id: 'habit-2', name: 'Walk' }
  };

  const firstPromise = syncEntriesWithFallback([baseEntry]);
  const secondPromise = syncEntriesWithFallback([secondEntry]);

  await vi.advanceTimersByTimeAsync(250);

  const [firstResult, secondResult] = await Promise.all([firstPromise, secondPromise]);

  expect(mockedPullChanges).toHaveBeenCalledTimes(1);
  expect(mockedPushChanges).toHaveBeenCalledTimes(1);
  expect(mockedPushChanges).toHaveBeenCalledWith([baseEntry, secondEntry]);
  expect(firstResult.status).toBe('synced');
  expect(secondResult.status).toBe('synced');
  vi.useRealTimers();
});
