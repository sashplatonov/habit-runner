<script lang="ts">
  import { onMount } from 'svelte';
  import {
    readStoredClientLogs,
    type ClientLogEntry
  } from '$lib/logging/clientLogger';
  import type { SyncEngineSnapshot } from '$lib/stores/syncEngine';

  type Props = {
    syncState?: SyncEngineSnapshot;
    onRetry?: () => void | Promise<void>;
    openLogs?: boolean;
  };

  const MAX_VISIBLE_SYNC_LOGS = 8;

  let { syncState, onRetry, openLogs = false }: Props = $props();
  let showLogs = $state(false);
  let logs = $state<ClientLogEntry[]>([]);

  const status = $derived(syncState?.status ?? 'idle');
  const label = $derived(getStatusLabel(status));
  const visibleLogs = $derived(logs.filter(isSyncLog));

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

  function statusColor(currentStatus?: string) {
    switch (currentStatus) {
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

  function getStatusLabel(currentStatus?: string) {
    switch (currentStatus) {
      case 'syncing':
        return 'Syncing...';
      case 'offline':
        return 'Offline - changes queued';
      case 'error':
        return 'Sync error';
      default:
        return 'Synced';
    }
  }

  onMount(() => {
    // allow parent to request logs be visible when embedding in a modal
    if (openLogs) {
      showLogs = true;
    }
    logs = readSyncLogs();

    const onClientLog = () => {
      logs = readSyncLogs();
    };

    window.addEventListener('app-client-log', onClientLog);
    return () => {
      window.removeEventListener('app-client-log', onClientLog);
    };
  });
</script>

<div class="mb-3 px-2">
  <div class="flex min-w-0 items-center gap-2">
    <span
      aria-hidden="true"
      class={`inline-block h-2.5 w-2.5 rounded-full ${statusColor(status)}`}
      style:box-shadow={status === 'syncing' ? '0 0 8px var(--glow)' : undefined}
    ></span>

    <div class="flex min-w-0 items-center gap-2">
      <div class="truncate text-xs font-mono text-muted">{label}</div>
    </div>

    <div class="ml-auto flex items-center gap-2">
      <button
        type="button"
        class="whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-mono text-muted hover:text-foreground"
        aria-expanded={showLogs}
        aria-label={showLogs ? 'Hide sync logs' : 'Show sync logs'}
        onclick={() => {
          showLogs = !showLogs;
        }}
      >
        {showLogs ? 'Hide logs' : 'Show logs'}
      </button>
      <button
        type="button"
        class="whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-mono text-muted hover:text-foreground"
        aria-label="Retry sync now"
        onclick={() => {
          void onRetry?.();
        }}
      >
        Retry
      </button>
    </div>
  </div>

  {#if syncState?.lastError}
    <div class="mt-1 text-[11px] font-mono text-red-400">{syncState.lastError}</div>
  {/if}

  {#if showLogs}
    <div class="mt-2 rounded-xl border border-border bg-bg-secondary p-2">
      <div class="mb-2 text-[10px] font-mono uppercase tracking-[0.18em] text-muted">
        Recent sync logs
      </div>
      {#if visibleLogs.length === 0}
        <div class="text-[11px] font-mono text-muted">No sync logs yet</div>
      {:else}
        <div class="max-h-36 sm:max-h-48 space-y-2 overflow-y-auto">
          {#each visibleLogs as entry (`${entry.timestamp}:${entry.event}`)}
            <div class="rounded-lg bg-bg-card px-2 py-1.5">
              <div class="flex items-center gap-2 text-[11px] font-mono">
                <span class="text-foreground">{entry.event}</span>
                <span class="text-muted/80">{new Date(entry.timestamp).toLocaleTimeString()}</span>
              </div>
              <div class="mt-1 text-[11px] font-mono text-muted">
                {formatContext(entry) || entry.message}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <div class="sr-only" aria-live="polite">{label}</div>
</div>
