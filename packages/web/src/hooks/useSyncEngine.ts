import { useCallback, useEffect, useRef, useState } from 'react';
import type { SyncRunResult, SyncStatus } from '@/lib/sync/syncEngine';
import { runSyncCycle } from '@/lib/sync/syncEngine';
import { SYNC_ENABLED, SYNC_DISABLED_REASON } from '@/lib/core/config';
import { logClientError, logClientInfo } from '@/lib/logging/clientLogger';

export interface SyncEngineState extends SyncRunResult {
  syncNow: () => Promise<void>;
}

export function useSyncEngine(enabled = true): SyncEngineState {
  const [state, setState] = useState<SyncRunResult>({
    status: 'idle',
    pending: 0,
    conflicts: 0
  });
  const runningRef = useRef(false);

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
    setState((prev) => ({ ...prev, status: navigator.onLine ? 'syncing' : 'offline' }));

    if (!SYNC_ENABLED) {
      logClientInfo('sync.disabled', SYNC_DISABLED_REASON);
      setState((prev) => ({
        ...prev,
        status: 'offline',
        lastError: SYNC_DISABLED_REASON
      }));
      runningRef.current = false;
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
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    syncNow();
    const interval = window.setInterval(syncNow, 30_000);
    window.addEventListener('online', syncNow);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('online', syncNow);
    };
  }, [enabled, syncNow]);

  return { ...state, syncNow };
}
