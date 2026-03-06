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

  const badgeColor = isOffline ? 'bg-amber-600/30 border-amber-400/60' : 'bg-rose-600/30 border-rose-400/60';

  return (
    <div
      className={`fixed top-14 left-0 right-0 z-40 border px-4 py-2 text-xs text-white ${badgeColor} backdrop-blur-sm flex items-center justify-between gap-4`}
      role="status"
    >
      <span>{message}</span>
      <div className="flex gap-2">
        <button
          onClick={syncState.syncNow}
          className="rounded-full border px-3 py-1 text-[10px] uppercase tracking-wide transition hover:bg-white/10"
        >
          Retry now
        </button>
        {syncState.pending > 0 && (
          <span className="text-white/80">Outbox: {syncState.pending}</span>
        )}
      </div>
    </div>
  );
}
