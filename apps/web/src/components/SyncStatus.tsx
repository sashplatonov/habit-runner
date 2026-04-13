import React, { useEffect, useMemo, useState } from 'react';
import type { SyncEngineState } from '@/hooks/useSyncEngine';
import {
  readStoredClientLogs,
  type ClientLogEntry
} from '@/lib/logging/clientLogger';

type Props = {
  syncState?: SyncEngineState;
};

const MAX_VISIBLE_SYNC_LOGS = 8;

function isSyncLog(entry: ClientLogEntry) {
  return entry.event.startsWith('sync.');
}

function readSyncLogs(): ClientLogEntry[] {
  return readStoredClientLogs()
    .filter(isSyncLog)
    .slice(-MAX_VISIBLE_SYNC_LOGS)
    .reverse();
}

function pushMetric(parts: string[], value: unknown, formatter: (value: number | string) => string) {
  if (typeof value === 'number' || typeof value === 'string') {
    parts.push(formatter(value));
  }
}

function formatContext(entry: ClientLogEntry): string {
  const context = entry.context ?? {};
  const parts: string[] = [];

  pushMetric(parts, context.method, (value) => String(value));
  pushMetric(parts, context.status, (value) => `status ${value}`);
  pushMetric(parts, context.mode, (value) => String(value));
  pushMetric(parts, context.durationMs, (value) => `${value}ms total`);
  pushMetric(parts, context.serverDurationMs, (value) => `${value}ms backend`);
  pushMetric(parts, context.firstPullApplyDurationMs, (value) => `${value}ms first apply`);
  pushMetric(parts, context.pushApplyDurationMs, (value) => `${value}ms push apply`);
  if (typeof context.totalDurationMs === 'number' && typeof context.durationMs !== 'number') {
    parts.push(`${context.totalDurationMs}ms total`);
  }
  if (typeof context.conflicts === 'number' && context.conflicts > 0) {
    parts.push(`${context.conflicts} conflicts`);
  }
  if (typeof context.pendingAfter === 'number') {
    parts.push(`${context.pendingAfter} pending`);
  }

  return parts.join(' • ');
}

function statusColor(status?: string) {
  switch (status) {
    case 'syncing':
      return 'bg-accent';
    case 'error':
      return 'bg-red-500';
    case 'offline':
      return 'bg-amber-500';
    default:
      return 'bg-green-500';
  }
}

function getStatusLabel(status?: string) {
  switch (status) {
    case 'syncing':
      return 'Syncing…';
    case 'offline':
      return 'Offline — changes queued';
    case 'error':
      return 'Sync error';
    default:
      return 'Synced';
  }
}

export function SyncStatus({ syncState }: Props) {
  const status = syncState?.status ?? 'idle';
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<ClientLogEntry[]>(() => readSyncLogs());
  const label = getStatusLabel(status);
  const visibleLogs = useMemo(() => logs.filter(isSyncLog), [logs]);

  useEffect(() => {
    setLogs(readSyncLogs());
    if (typeof window === 'undefined') {
      return;
    }

    const onClientLog = () => {
      setLogs(readSyncLogs());
    };
    window.addEventListener('app-client-log', onClientLog);
    return () => {
      window.removeEventListener('app-client-log', onClientLog);
    };
  }, []);

  return (
    <div className="px-2 mb-3">
      <div className="flex items-center gap-2 min-w-0">
        <span
          aria-hidden
          className={`inline-block h-2.5 w-2.5 rounded-full ${statusColor(status)}`}
          style={{ boxShadow: status === 'syncing' ? '0 0 8px var(--glow)' : undefined }}
        />

        <div className="flex items-center gap-2 min-w-0">
          <div className="text-xs font-mono text-muted truncate">{label}</div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowLogs((current) => !current)}
            className="text-[11px] font-mono text-muted hover:text-foreground px-2 py-1 rounded-md whitespace-nowrap"
            aria-expanded={showLogs}
            aria-label={showLogs ? 'Hide sync logs' : 'Show sync logs'}
          >
            {showLogs ? 'Hide logs' : 'Show logs'}
          </button>
          <button
            type="button"
            onClick={() => syncState?.syncNow()}
            className="text-[11px] font-mono text-muted hover:text-foreground px-2 py-1 rounded-md whitespace-nowrap"
            aria-label="Retry sync now"
          >
            Retry
          </button>
          {/* Pending outbox details intentionally hidden (internal implementation) */}
        </div>
      </div>

      {syncState?.lastError && (
        <div className="mt-1 text-[11px] font-mono text-red-400">{syncState.lastError}</div>
      )}

      {showLogs && (
        <div className="mt-2 rounded-xl border border-white/10 bg-black/20 p-2">
          <div className="mb-2 text-[10px] font-mono uppercase tracking-[0.18em] text-muted">
            Recent sync logs
          </div>
          {visibleLogs.length === 0 ? (
            <div className="text-[11px] font-mono text-muted">No sync logs yet</div>
          ) : (
            <div className="space-y-2">
              {visibleLogs.map((entry) => (
                <div key={`${entry.timestamp}:${entry.event}`} className="rounded-lg bg-white/5 px-2 py-1.5">
                  <div className="flex items-center gap-2 text-[11px] font-mono">
                    <span className="text-foreground">{entry.event}</span>
                    <span className="text-muted/80">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="mt-1 text-[11px] font-mono text-muted">
                    {formatContext(entry) || entry.message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="sr-only" aria-live="polite">{label}</div>
    </div>
  );
}

export default SyncStatus;




