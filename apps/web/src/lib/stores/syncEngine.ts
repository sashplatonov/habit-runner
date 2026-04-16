import { get, writable, type Readable } from 'svelte/store';
import { SYNC_DISABLED_REASON, SYNC_ENABLED } from '$lib/core/config';
import { logClientError, logClientInfo } from '$lib/logging/clientLogger';
import { runSyncCycle, type SyncRunResult, type SyncStatus } from '$lib/sync/syncEngine';

export interface SyncEngineSnapshot extends SyncRunResult {
  isActive: boolean;
  enabled: boolean;
}

export interface SyncEngineStore extends Readable<SyncEngineSnapshot> {
  syncNow: () => Promise<void>;
  start: () => void;
  stop: () => void;
  setEnabled: (enabled: boolean) => void;
}

function createSnapshot(result: SyncRunResult, isActive: boolean, enabled: boolean): SyncEngineSnapshot {
  return {
    ...result,
    isActive,
    enabled
  };
}

export function createSyncEngineStore(initiallyEnabled = true): SyncEngineStore {
  const store = writable<SyncEngineSnapshot>(
    createSnapshot({ status: 'idle', pending: 0, conflicts: 0 }, false, initiallyEnabled)
  );
  let enabled = initiallyEnabled;
  let running = false;
  let started = false;
  let intervalId: number | null = null;
  let onlineHandler: (() => void) | null = null;
  let visibilityHandler: (() => void) | null = null;

  async function syncNow() {
    if (!enabled) {
      logClientInfo('sync.skipped', 'Sync skipped because it is disabled for the current session');
      store.update((current) => createSnapshot({
        ...current,
        status: 'offline',
        lastError: 'authentication required'
      }, false, enabled));
      return;
    }

    if (running) {
      return;
    }

    running = true;
    logClientInfo('sync.start', 'Sync cycle started');
    store.update((current) => createSnapshot({
      ...current,
      status: navigator.onLine ? 'syncing' : 'offline'
    }, true, enabled));

    if (!SYNC_ENABLED) {
      logClientInfo('sync.disabled', SYNC_DISABLED_REASON);
      store.update((current) => createSnapshot({
        ...current,
        status: 'offline',
        lastError: SYNC_DISABLED_REASON
      }, false, enabled));
      running = false;
      return;
    }

    try {
      if (!navigator.onLine) {
        store.update((current) => createSnapshot({ ...current, status: 'offline' }, false, enabled));
        return;
      }

      const result = await runSyncCycle();
      store.set(createSnapshot(result, false, enabled));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status: SyncStatus = navigator.onLine ? 'error' : 'offline';
      logClientError('sync.cycle_failed', message, { status });
      store.update((current) => createSnapshot({
        ...current,
        status,
        lastError: message
      }, false, enabled));
    } finally {
      running = false;
      logClientInfo('sync.end', 'Sync cycle finished');
    }
  }

  function stop() {
    if (intervalId !== null) {
      window.clearInterval(intervalId);
      intervalId = null;
    }
    if (onlineHandler) {
      window.removeEventListener('online', onlineHandler);
      onlineHandler = null;
    }
    if (visibilityHandler) {
      window.removeEventListener('visibilitychange', visibilityHandler);
      visibilityHandler = null;
    }
    started = false;
    store.update((current) => createSnapshot(current, false, enabled));
  }

  function start() {
    if (typeof window === 'undefined' || started || !enabled) {
      return;
    }

    started = true;
    void syncNow();

    intervalId = window.setInterval(() => {
      void syncNow();
    }, 30_000);

    onlineHandler = () => {
      void syncNow();
    };
    visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        void syncNow();
      }
    };

    window.addEventListener('online', onlineHandler);
    window.addEventListener('visibilitychange', visibilityHandler);
  }

  return {
    subscribe: store.subscribe,
    syncNow,
    start,
    stop,
    setEnabled(nextEnabled) {
      enabled = nextEnabled;
      const state = get(store);
      store.set(createSnapshot(state, state.isActive, enabled));
      if (!enabled) {
        stop();
        store.update((current) => createSnapshot({
          ...current,
          status: 'offline',
          lastError: 'authentication required'
        }, false, enabled));
        return;
      }

      start();
    }
  };
}

export const syncEngineStore = createSyncEngineStore(false);
