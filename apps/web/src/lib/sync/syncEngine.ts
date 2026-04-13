import {
  applyAcknowledgedPushResponse,
  ensureSyncMeta,
  updateSyncMeta,
  applyPullResponse,
  getReadyOutboxEntries,
  markOutboxEntriesInflight,
  deleteOutboxEntries,
  updateOutboxEntryFailure,
  countPendingOutboxEntries,
  getBackoffMs
} from '@/lib/storage/db';
import { pullChanges, pushChanges } from '@/lib/api/sync';
import { logClientInfo } from '@/lib/logging/clientLogger';

export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'error';

export interface SyncRunResult {
  status: SyncStatus;
  pending: number;
  conflicts: number;
  lastError?: string;
  lastSyncedAt?: string;
  lastCursor?: string;
}

let activeSyncRun: Promise<SyncRunResult> | null = null;
let shouldRerunAfterActiveSync = false;
let scheduledSyncHandle: number | null = null;
const SYNC_TRIGGER_DEBOUNCE_MS = 180;

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function durationMs(startedAt: number): number {
  return Math.round(nowMs() - startedAt);
}

type SyncCycleMetricsContext = {
  cursorAfterPull: string;
  firstPull: Awaited<ReturnType<typeof pullChanges>>;
  firstPullDurationMs: number;
  firstPullApplyDurationMs: number;
  pushDurationMs: number;
  pushApplyDurationMs: number;
  cycleStartedAt: number;
};

async function pushPendingOutbox(): Promise<{
  attempted: number;
  applied: number;
  conflicts: number;
  serverTime: string;
  nextCursor?: string;
  habits: Awaited<ReturnType<typeof pullChanges>>['habits'];
  checkins: Awaited<ReturnType<typeof pullChanges>>['checkins'];
  tombstones: Awaited<ReturnType<typeof pullChanges>>['tombstones'];
}> {
  const entries = await getReadyOutboxEntries(32);
  if (entries.length === 0) {
    return {
      attempted: 0,
      applied: 0,
      conflicts: 0,
      serverTime: new Date().toISOString(),
      habits: [],
      checkins: [],
      tombstones: []
    };
  }

  await markOutboxEntriesInflight(entries.map((entry) => entry.id));
  const response = await pushChanges(entries);
  await deleteOutboxEntries(response.applied);

  const appliedSet = new Set(response.applied);
  await Promise.all(
    entries.map(async (entry) => {
      if (appliedSet.has(entry.id)) {return;}
      const conflict = response.conflicts.find((c) => c.opId === entry.id);
      const reason = conflict?.reason ?? 'push rejected';
      const nextRetry = new Date(
        Date.now() + getBackoffMs(entry.retryCount + 1)
      ).toISOString();
      await updateOutboxEntryFailure(entry, reason, nextRetry);
    })
  );

  return {
    attempted: entries.length,
    applied: response.applied.length,
    conflicts: response.conflicts.length,
    serverTime: response.serverTime,
    nextCursor: response.nextCursor,
    habits: response.habits,
    checkins: response.checkins,
    tombstones: response.tombstones
  };
}

async function finalizePullOnlyCycle(
  result: SyncRunResult,
  context: SyncCycleMetricsContext
): Promise<SyncRunResult> {
  await updateSyncMeta({
    status: 'idle',
    lastError: undefined
  });
  result.status = 'idle';
  result.lastCursor = context.cursorAfterPull;
  result.lastSyncedAt = context.firstPull.serverTime;
  logClientInfo('sync.cycle_metrics', 'Background sync cycle completed', {
    mode: 'pull_only',
    firstPullDurationMs: context.firstPullDurationMs,
    firstPullApplyDurationMs: context.firstPullApplyDurationMs,
    pushDurationMs: context.pushDurationMs,
    pushApplyDurationMs: context.pushApplyDurationMs,
    totalDurationMs: durationMs(context.cycleStartedAt),
    pulledHabits: context.firstPull.habits.length,
    pulledCheckins: context.firstPull.checkins.length,
    pulledTombstones: context.firstPull.tombstones.length,
    pushedOpsAttempted: 0,
    pushedOpsApplied: 0,
    pendingAfter: result.pending
  });
  return result;
}

async function finalizePushCycle(
  result: SyncRunResult,
  pushResult: Awaited<ReturnType<typeof pushPendingOutbox>>,
  context: SyncCycleMetricsContext
): Promise<SyncRunResult> {
  const pushApplyStartedAt = nowMs();
  await applyAcknowledgedPushResponse({
    habits: pushResult.habits,
    checkins: pushResult.checkins,
    tombstones: pushResult.tombstones,
    nextCursor: pushResult.nextCursor,
    serverTime: pushResult.serverTime
  });
  context.pushApplyDurationMs = durationMs(pushApplyStartedAt);
  await updateSyncMeta({
    lastCursor: context.cursorAfterPull,
    lastSyncedAt: pushResult.serverTime,
    status: 'idle',
    lastError: undefined
  });

  result.status = 'idle';
  result.lastCursor = context.cursorAfterPull;
  result.lastSyncedAt = pushResult.serverTime;
  logClientInfo('sync.cycle_metrics', 'Background sync cycle completed', {
    mode: 'pull_push',
    firstPullDurationMs: context.firstPullDurationMs,
    firstPullApplyDurationMs: context.firstPullApplyDurationMs,
    pushDurationMs: context.pushDurationMs,
    pushApplyDurationMs: context.pushApplyDurationMs,
    totalDurationMs: durationMs(context.cycleStartedAt),
    pulledHabits: context.firstPull.habits.length,
    pulledCheckins: context.firstPull.checkins.length,
    pulledTombstones: context.firstPull.tombstones.length,
    pushedOpsAttempted: pushResult.attempted,
    pushedOpsApplied: pushResult.applied,
    pendingAfter: result.pending,
    conflicts: result.conflicts
  });
  return result;
}

async function runSyncCycleOnce(): Promise<SyncRunResult> {
  const meta = await ensureSyncMeta();
  const result: SyncRunResult = {
    status: 'syncing',
    pending: 0,
    conflicts: 0
  };

  try {
    const cycleStartedAt = nowMs();

    const firstPullStartedAt = nowMs();
    const firstPull = await pullChanges(meta.lastCursor);
    const firstPullDurationMs = durationMs(firstPullStartedAt);
    const firstPullApplyStartedAt = nowMs();
    await applyPullResponse(firstPull);
    const firstPullApplyDurationMs = durationMs(firstPullApplyStartedAt);
    const cursorAfterPull =
      firstPull.nextCursor ?? meta.lastCursor ?? firstPull.serverTime;
    const metricsContext: SyncCycleMetricsContext = {
      cursorAfterPull,
      firstPull,
      firstPullDurationMs,
      firstPullApplyDurationMs,
      pushDurationMs: 0,
      pushApplyDurationMs: 0,
      cycleStartedAt
    };
    logClientInfo('sync.pull_applied', 'Pull response applied locally', {
      habits: firstPull.habits.length,
      checkins: firstPull.checkins.length,
      tombstones: firstPull.tombstones.length,
      firstPullDurationMs,
      firstPullApplyDurationMs
    });
    await updateSyncMeta({
      lastCursor: cursorAfterPull,
      lastSyncedAt: firstPull.serverTime,
      status: 'syncing',
      lastError: undefined
    });

    const pushStartedAt = nowMs();
    const pushResult = await pushPendingOutbox();
    const pushDurationMs = durationMs(pushStartedAt);
    metricsContext.pushDurationMs = pushDurationMs;
    result.conflicts = pushResult.conflicts;
    result.pending = await countPendingOutboxEntries();
    await updateSyncMeta({
      lastSyncedAt: pushResult.serverTime
    });

    if (pushResult.attempted === 0) {
      return await finalizePullOnlyCycle(result, metricsContext);
    }

    return await finalizePushCycle(result, pushResult, metricsContext);
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

export async function runSyncCycle(): Promise<SyncRunResult> {
  if (activeSyncRun) {
    shouldRerunAfterActiveSync = true;
    return activeSyncRun;
  }

  activeSyncRun = runSyncCycleOnce().finally(() => {
    activeSyncRun = null;
    if (!shouldRerunAfterActiveSync) {
      return;
    }
    shouldRerunAfterActiveSync = false;
    scheduleSyncCycle();
  });

  return activeSyncRun;
}

export function scheduleSyncCycle(delayMs = 0): void {
  if (typeof window === 'undefined') {
    return;
  }
  if (scheduledSyncHandle !== null) {
    window.clearTimeout(scheduledSyncHandle);
  }
  const effectiveDelayMs = Math.max(delayMs, SYNC_TRIGGER_DEBOUNCE_MS);
  scheduledSyncHandle = window.setTimeout(() => {
    scheduledSyncHandle = null;
    void runSyncCycle();
  }, effectiveDelayMs);
}
