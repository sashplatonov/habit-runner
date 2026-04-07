import { pullChanges, pushChanges } from '$lib/api/sync';
import { SYNC_DISABLED_REASON, SYNC_ENABLED } from '$lib/core/config';
import {
  applyPullResponse,
  enqueueOutboxEntry,
  ensureSyncMeta,
  getBackoffMs,
  type OutboxEntry,
  updateOutboxEntryFailure,
  updateSyncMeta
} from '$lib/storage/db';

export interface WriteThroughResult {
  status: 'synced' | 'queued';
  applied: number;
  queued: number;
  conflicts: number;
  lastError?: string;
}

interface PushAttemptResult {
  appliedCount: number;
  queuedEntries: OutboxEntry[];
  conflictCount: number;
  serverTime: string;
}

function buildQueuedResult(
  entries: OutboxEntry[],
  lastError: string,
  conflicts = 0
): WriteThroughResult {
  return {
    status: 'queued',
    applied: 0,
    queued: entries.length,
    conflicts,
    lastError
  };
}

function buildCompletionResult(
  pushResult: PushAttemptResult,
  lastError?: string
): WriteThroughResult {
  return {
    status: pushResult.queuedEntries.length > 0 ? 'queued' : 'synced',
    applied: pushResult.appliedCount,
    queued: pushResult.queuedEntries.length,
    conflicts: pushResult.conflictCount,
    lastError
  };
}

async function queuePendingEntries(entries: OutboxEntry[]): Promise<void> {
  await Promise.all(entries.map(async (entry) => enqueueOutboxEntry(entry)));
}

async function queueRejectedEntries(
  entries: OutboxEntry[],
  reasons: Map<string, string>
): Promise<void> {
  await Promise.all(
    entries.map(async (entry) => {
      await enqueueOutboxEntry(entry);
      const reason = reasons.get(entry.id) ?? 'push rejected';
      const nextRetryAt = new Date(
        Date.now() + getBackoffMs(entry.retryCount + 1)
      ).toISOString();
      await updateOutboxEntryFailure(entry, reason, nextRetryAt);
    })
  );
}

function getOfflineNavigator(): Navigator | undefined {
  if (typeof navigator === 'undefined') {
    return undefined;
  }
  return navigator;
}

function resolveSyncFailureStatus(): 'offline' | 'error' {
  const currentNavigator = getOfflineNavigator();
  if (!currentNavigator?.onLine) {
    return 'offline';
  }
  return 'error';
}

async function queueAndMarkFailure(
  entries: OutboxEntry[],
  message: string
): Promise<WriteThroughResult> {
  await queuePendingEntries(entries);
  await updateSyncMeta({
    status: resolveSyncFailureStatus(),
    lastError: message
  });
  return buildQueuedResult(entries, message);
}

async function performInitialPull(lastCursor?: string): Promise<void> {
  const firstPull = await pullChanges(lastCursor);
  await applyPullResponse(firstPull);
  await updateSyncMeta({
    lastCursor: firstPull.nextCursor ?? lastCursor ?? firstPull.serverTime,
    lastSyncedAt: firstPull.serverTime,
    status: 'syncing',
    lastError: undefined
  });
}

async function pushEntriesImmediately(entries: OutboxEntry[]): Promise<PushAttemptResult> {
  const response = await pushChanges(entries);
  const appliedSet = new Set(response.applied);
  const queuedEntries = entries.filter((entry) => !appliedSet.has(entry.id));
  const reasons = new Map(
    response.conflicts.map((conflict) => [conflict.opId, conflict.reason])
  );
  await queueRejectedEntries(queuedEntries, reasons);
  await updateSyncMeta({
    lastSyncedAt: response.serverTime
  });
  return {
    appliedCount: response.applied.length,
    queuedEntries,
    conflictCount: response.conflicts.length,
    serverTime: response.serverTime
  };
}

async function finalizeSync(pushResult: PushAttemptResult): Promise<WriteThroughResult> {
  const secondPull = await pullChanges();
  await applyPullResponse(secondPull);
  const queuedMessage =
    pushResult.queuedEntries.length > 0 ? 'Some changes were queued for retry' : undefined;
  await updateSyncMeta({
    lastCursor: secondPull.nextCursor ?? secondPull.serverTime,
    lastSyncedAt: secondPull.serverTime,
    status: pushResult.queuedEntries.length > 0 ? 'error' : 'idle',
    lastError: queuedMessage
  });
  return buildCompletionResult(pushResult, queuedMessage);
}

async function queueForOffline(entries: OutboxEntry[]): Promise<WriteThroughResult> {
  const message = 'network unavailable';
  await queuePendingEntries(entries);
  await updateSyncMeta({
    status: 'offline',
    lastError: message
  });
  return buildQueuedResult(entries, message);
}

async function queueForDisabledSync(entries: OutboxEntry[]): Promise<WriteThroughResult> {
  await queuePendingEntries(entries);
  await updateSyncMeta({
    status: 'offline',
    lastError: SYNC_DISABLED_REASON
  });
  return buildQueuedResult(entries, SYNC_DISABLED_REASON);
}

export async function syncEntriesWithFallback(entries: OutboxEntry[]): Promise<WriteThroughResult> {
  if (entries.length === 0) {
    return { status: 'synced', applied: 0, queued: 0, conflicts: 0 };
  }
  if (!SYNC_ENABLED) {
    return queueForDisabledSync(entries);
  }
  if (!getOfflineNavigator()?.onLine) {
    return queueForOffline(entries);
  }
  const meta = await ensureSyncMeta();
  try {
    await performInitialPull(meta.lastCursor);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return queueAndMarkFailure(entries, message);
  }
  let pushResult: PushAttemptResult;
  try {
    pushResult = await pushEntriesImmediately(entries);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return queueAndMarkFailure(entries, message);
  }
  try {
    return await finalizeSync(pushResult);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await updateSyncMeta({
      status: resolveSyncFailureStatus(),
      lastSyncedAt: pushResult.serverTime,
      lastError: message
    });
    return buildCompletionResult(pushResult, message);
  }
}
