import React from 'react';
import type { SyncEngineState } from '@/hooks/useSyncEngine';

type Props = {
  syncState?: SyncEngineState;
};

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

  const label = getStatusLabel(status);

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

      <div className="sr-only" aria-live="polite">{label}</div>
    </div>
  );
}

export default SyncStatus;






