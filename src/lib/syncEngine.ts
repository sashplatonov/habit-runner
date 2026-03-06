import {
  ensureSyncMeta,
  updateSyncMeta,
  applyPullResponse,
  getReadyOutboxEntries,
  markOutboxEntriesInflight,
  deleteOutboxEntries,
  updateOutboxEntryFailure,
  countPendingOutboxEntries,
  getBackoffMs
} from './db';
import { pullChanges, pushChanges } from './api/sync';

export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'error';

export interface SyncRunResult {
  status: SyncStatus;
  pending: number;
  conflicts: number;
  lastError?: string;
  lastSyncedAt?: string;
  lastCursor?: string;
}

async function pushPendingOutbox(): Promise<{
  applied: number;
  conflicts: number;
  serverTime: string;
}> {
  const entries = await getReadyOutboxEntries(32);
  if (entries.length === 0) {
    return {
      applied: 0,
      conflicts: 0,
      serverTime: new Date().toISOString()
    };
  }

  await markOutboxEntriesInflight(entries.map((entry) => entry.id));
  const response = await pushChanges(entries);
  await deleteOutboxEntries(response.applied);

  const appliedSet = new Set(response.applied);
  await Promise.all(
    entries.map(async (entry) => {
      if (appliedSet.has(entry.id)) return;
      const conflict = response.conflicts.find((c) => c.opId === entry.id);
      const reason = conflict?.reason ?? 'push rejected';
      const nextRetry = new Date(
        Date.now() + getBackoffMs(entry.retryCount + 1)
      ).toISOString();
      await updateOutboxEntryFailure(entry, reason, nextRetry);
    })
  );

  return {
    applied: response.applied.length,
    conflicts: response.conflicts.length,
    serverTime: response.serverTime
  };
}

export async function runSyncCycle(): Promise<SyncRunResult> {
  const meta = await ensureSyncMeta();
  const result: SyncRunResult = {
    status: 'syncing',
    pending: 0,
    conflicts: 0
  };

  try {
    const firstPull = await pullChanges(meta.lastCursor);
    await applyPullResponse(firstPull);
    const cursorAfterPull =
      firstPull.nextCursor ?? meta.lastCursor ?? firstPull.serverTime;
    await updateSyncMeta({
      lastCursor: cursorAfterPull,
      lastSyncedAt: firstPull.serverTime,
      status: 'syncing',
      lastError: undefined
    });

    const pushResult = await pushPendingOutbox();
    result.conflicts = pushResult.conflicts;
    result.pending = await countPendingOutboxEntries();
    await updateSyncMeta({
      lastSyncedAt: pushResult.serverTime
    });

    const secondPull = await pullChanges(cursorAfterPull);
    await applyPullResponse(secondPull);
    const nextCursor = secondPull.nextCursor ?? cursorAfterPull;
    await updateSyncMeta({
      lastCursor: nextCursor,
      lastSyncedAt: secondPull.serverTime,
      status: 'idle',
      lastError: undefined
    });

    result.status = 'idle';
    result.lastCursor = nextCursor;
    result.lastSyncedAt = secondPull.serverTime;
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status: SyncStatus = !navigator.onLine ? 'offline' : 'error';
    await updateSyncMeta({
      status,
      lastError: message
    });
    const pending = await countPendingOutboxEntries();
    return {
      status,
      pending,
      conflicts: 0,
      lastError: message
    };
  }
}
