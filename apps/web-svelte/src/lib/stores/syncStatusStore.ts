import { writable, get } from 'svelte/store';
import type { SyncRunResult, SyncStatus } from '$lib/sync/syncEngine';
import { runSyncCycle } from '$lib/sync/syncEngine';
import { SYNC_ENABLED, SYNC_DISABLED_REASON } from '$lib/core/config';
import { logClientError, logClientInfo } from '$lib/logging/clientLogger';

export interface SyncEngineState extends SyncRunResult {
  syncNow: () => Promise<void>;
}

function createSyncStatusStore() {
  const state = writable<SyncRunResult>({
    status: 'idle',
    pending: 0,
    conflicts: 0
  });

  let running = false;
  let interval: ReturnType<typeof setInterval> | null = null;
  let enabled = false;

  async function syncNow() {
    if (!enabled) {
      logClientInfo('sync.skipped', 'Sync skipped because user is not authenticated');
      state.update((prev) => ({
        ...prev,
        status: 'offline' as SyncStatus,
        lastError: 'authentication required'
      }));
      return;
    }
    if (running) return;
    running = true;
    state.update((prev) => ({
      ...prev,
      status: (typeof navigator !== 'undefined' && navigator.onLine ? 'syncing' : 'offline') as SyncStatus
    }));

    if (!SYNC_ENABLED) {
      logClientInfo('sync.disabled', SYNC_DISABLED_REASON);
      state.update((prev) => ({
        ...prev,
        status: 'offline' as SyncStatus,
        lastError: SYNC_DISABLED_REASON
      }));
      running = false;
      return;
    }

    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        state.update((prev) => ({ ...prev, status: 'offline' as SyncStatus }));
        return;
      }
      const result = await runSyncCycle();
      state.set(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status: SyncStatus = (typeof navigator !== 'undefined' && !navigator.onLine) ? 'offline' : 'error';
      logClientError('sync.cycle_failed', message, { status });
      state.update((prev) => ({
        ...prev,
        status,
        lastError: message
      }));
    } finally {
      running = false;
    }
  }

  function start() {
    enabled = true;
    syncNow();
    interval = setInterval(syncNow, 30_000);

    const handleOnline = () => syncNow();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncNow();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('visibilitychange', handleVisibility);
      enabled = false;
    };
  }

  function stop() {
    enabled = false;
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  }

  return {
    subscribe: state.subscribe,
    syncNow,
    start,
    stop
  };
}

export const syncStatusStore = createSyncStatusStore();
