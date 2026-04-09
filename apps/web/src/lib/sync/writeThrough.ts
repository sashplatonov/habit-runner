import type { PullResponseDto } from '@/types/sync';
import { pullChanges, pushChanges } from '@/lib/api/sync';
import { SYNC_DISABLED_REASON, SYNC_ENABLED } from '@/lib/core/config';
import { logClientInfo } from '@/lib/logging/clientLogger';
import {
  applyPullResponse,
  enqueueOutboxEntry,
  ensureSyncMeta,
  getBackoffMs,
  type OutboxEntry,
  updateOutboxEntryFailure,
  updateSyncMeta
} from '@/lib/storage/db';

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
  nextCursor?: string;
  habits: PullResponseDto['habits'];
  checkins: PullResponseDto['checkins'];
  tombstones: PullResponseDto['tombstones'];
}

type WriteThroughSyncContext = {
  cursorAfterPull: string;
  cycleStartedAt: number;
  firstPullDurationMs: number;
  firstPullApplyDurationMs: number;
  pushDurationMs: number;
};

type QueuedWriteThroughRequest = {
  entries: OutboxEntry[];
  resolve: (result: WriteThroughResult) => void;
  reject: (error: unknown) => void;
};

const WRITE_THROUGH_COALESCE_MS = 180;

let writeThroughFlushHandle: number | null = null;
let activeWriteThroughPromise: Promise<void> | null = null;
const pendingWriteThroughRequests: QueuedWriteThroughRequest[] = [];

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function durationMs(startedAt: number): number {
  return Math.round(nowMs() - startedAt);
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

async function performInitialPull(lastCursor?: string): Promise<WriteThroughSyncContext> {
  const firstPullStartedAt = nowMs();
  const firstPull = await pullChanges(lastCursor);
  const firstPullDurationMs = durationMs(firstPullStartedAt);
  const firstPullApplyStartedAt = nowMs();
  await applyPullResponse(firstPull);
  const firstPullApplyDurationMs = durationMs(firstPullApplyStartedAt);
  const cursorAfterPull = firstPull.nextCursor ?? lastCursor ?? firstPull.serverTime;
  await updateSyncMeta({
    lastCursor: cursorAfterPull,
    lastSyncedAt: firstPull.serverTime,
    status: 'syncing',
    lastError: undefined
  });
  return {
    cursorAfterPull,
    cycleStartedAt: firstPullStartedAt,
    firstPullDurationMs,
    firstPullApplyDurationMs,
    pushDurationMs: 0
  };
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
    serverTime: response.serverTime,
    nextCursor: response.nextCursor,
    habits: response.habits,
    checkins: response.checkins,
    tombstones: response.tombstones
  };
}

async function finalizeSync(
  pushResult: PushAttemptResult,
  context: WriteThroughSyncContext
): Promise<WriteThroughResult> {
  const queuedMessage =
    pushResult.queuedEntries.length > 0 ? 'Some changes were queued for retry' : undefined;
  const pushApplyStartedAt = nowMs();
  await applyPullResponse({
    habits: pushResult.habits,
    checkins: pushResult.checkins,
    tombstones: pushResult.tombstones,
    nextCursor: pushResult.nextCursor,
    serverTime: pushResult.serverTime
  });
  const pushApplyDurationMs = durationMs(pushApplyStartedAt);
  const nextMeta: {
    lastCursor?: string;
    lastSyncedAt: string;
    status: 'idle' | 'error';
    lastError?: string;
  } = {
    lastCursor: context.cursorAfterPull,
    lastSyncedAt: pushResult.serverTime,
    status: pushResult.queuedEntries.length > 0 ? 'error' : 'idle',
    lastError: queuedMessage
  };
  await updateSyncMeta(nextMeta);
  logClientInfo('sync.write_through_metrics', 'Write-through sync completed', {
    mode: 'pull_push',
    firstPullDurationMs: context.firstPullDurationMs,
    firstPullApplyDurationMs: context.firstPullApplyDurationMs,
    pushDurationMs: context.pushDurationMs,
    pushApplyDurationMs,
    totalDurationMs: durationMs(context.cycleStartedAt),
    pushedOpsApplied: pushResult.appliedCount,
    pushedOpsQueued: pushResult.queuedEntries.length,
    conflicts: pushResult.conflictCount
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

async function syncEntriesImmediately(entries: OutboxEntry[]): Promise<WriteThroughResult> {
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
  let context: WriteThroughSyncContext;
  try {
    context = await performInitialPull(meta.lastCursor);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return queueAndMarkFailure(entries, message);
  }
  let pushResult: PushAttemptResult;
  try {
    const pushStartedAt = nowMs();
    pushResult = await pushEntriesImmediately(entries);
    context.pushDurationMs = durationMs(pushStartedAt);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return queueAndMarkFailure(entries, message);
  }
  try {
    return await finalizeSync(pushResult, context);
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

function scheduleWriteThroughFlush(): void {
  if (writeThroughFlushHandle !== null) {
    clearTimeout(writeThroughFlushHandle);
  }
  writeThroughFlushHandle = setTimeout(() => {
    writeThroughFlushHandle = null;
    void flushPendingWriteThroughRequests();
  }, WRITE_THROUGH_COALESCE_MS) as unknown as number;
}

async function flushPendingWriteThroughRequests(): Promise<void> {
  if (activeWriteThroughPromise || pendingWriteThroughRequests.length === 0) {
    return;
  }
  const requests = pendingWriteThroughRequests.splice(0, pendingWriteThroughRequests.length);
  const entries = requests.flatMap((request) => request.entries);
  activeWriteThroughPromise = (async () => {
    try {
      const result = await syncEntriesImmediately(entries);
      requests.forEach((request) => request.resolve(result));
    } catch (error) {
      requests.forEach((request) => request.reject(error));
    }
  })().finally(() => {
    activeWriteThroughPromise = null;
    if (pendingWriteThroughRequests.length > 0) {
      scheduleWriteThroughFlush();
    }
  });
  await activeWriteThroughPromise;
}

export async function syncEntriesWithFallback(entries: OutboxEntry[]): Promise<WriteThroughResult> {
  if (entries.length === 0) {
    return { status: 'synced', applied: 0, queued: 0, conflicts: 0 };
  }
  return await new Promise<WriteThroughResult>((resolve, reject) => {
    pendingWriteThroughRequests.push({ entries, resolve, reject });
    scheduleWriteThroughFlush();
  });
}
