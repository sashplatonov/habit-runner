import { useCallback, useEffect, useRef, useState } from 'react';
import type { SyncRunResult, SyncStatus } from '@/lib/sync/syncEngine';
import { runSyncCycle } from '@/lib/sync/syncEngine';
import { SYNC_ENABLED, SYNC_DISABLED_REASON } from '@/lib/core/config';
import { logClientError, logClientInfo } from '@/lib/logging/clientLogger';

export interface SyncEngineState extends SyncRunResult {
  syncNow: () => Promise<void>;
  isActive: boolean;
}

export function useSyncEngine(enabled = true): SyncEngineState {
  const [state, setState] = useState<SyncRunResult>({
    status: 'idle',
    pending: 0,
    conflicts: 0
  });
  const runningRef = useRef(false);
  const [isRunning, setIsRunning] = useState(false);

  const syncNow = useCallback(async () => {
    if (!enabled) {
      logClientInfo('sync.skipped', 'Sync skipped because user is not authenticated');
      setState((prev) => ({
        ...prev,
        status: 'offline',
        lastError: 'authentication required'
      }));
      return;
    }
    if (runningRef.current) {return;}
    runningRef.current = true;
    setIsRunning(true);
    // log sync start for debugging
    logClientInfo('sync.start', 'Sync cycle started');
    setState((prev) => ({ ...prev, status: navigator.onLine ? 'syncing' : 'offline' }));

    if (!SYNC_ENABLED) {
      logClientInfo('sync.disabled', SYNC_DISABLED_REASON);
      setState((prev) => ({
        ...prev,
        status: 'offline',
        lastError: SYNC_DISABLED_REASON
      }));
      runningRef.current = false;
      setIsRunning(false);
      return;
    }

    try {
      if (!navigator.onLine) {
        setState((prev) => ({ ...prev, status: 'offline' }));
        return;
      }
      const result = await runSyncCycle();
      setState(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status: SyncStatus = !navigator.onLine ? 'offline' : 'error';
      logClientError('sync.cycle_failed', message, { status });
      setState((prev) => ({
        ...prev,
        status,
        lastError: message
      }));
    } finally {
      runningRef.current = false;
      setIsRunning(false);
      logClientInfo('sync.end', 'Sync cycle finished');
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    syncNow();
    const interval = window.setInterval(syncNow, 30_000);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncNow();
      }
    };
    window.addEventListener('online', syncNow);
    window.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('online', syncNow);
      window.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [enabled, syncNow]);

  return { ...state, syncNow, isActive: isRunning };
}
