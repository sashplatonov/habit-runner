import React from 'react';
import type { SyncEngineState } from '@/hooks/useSyncEngine';

interface OfflineBannerProps {
  syncState: SyncEngineState;
}

export function OfflineBanner({ syncState }: OfflineBannerProps) {
  if (syncState.status === 'idle' || syncState.status === 'syncing') {return null;}

  const isOffline = syncState.status === 'offline';
  const message = isOffline
    ? 'You are offline. Changes are stored locally and will sync when the network returns.'
    : `Sync interrupted: ${syncState.lastError ?? 'unknown error'}.`;

  const badgeColor = isOffline
    ? 'bg-accent-secondary/20 border-accent-secondary/60'
    : 'bg-accent/20 border-accent/60';

  return (
    <div
      className={`fixed top-14 left-0 right-0 z-40 border px-4 py-2 text-xs text-foreground ${badgeColor} backdrop-blur-sm flex items-center justify-between gap-4`}
      role="status"
    >
      <span>{message}</span>
      <div className="flex gap-2">
        <button
          onClick={syncState.syncNow}
          className="rounded-full border border-border px-3 py-1 text-[10px] uppercase tracking-wide transition hover:bg-bg-card"
        >
          Retry now
        </button>
        {syncState.pending > 0 && (
          <span className="text-muted">Outbox: {syncState.pending}</span>
        )}
      </div>
    </div>
  );
}
