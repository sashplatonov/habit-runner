<script lang="ts">
  import type { SyncRunResult } from '$lib/sync/syncEngine';

  let { syncState }: { syncState?: SyncRunResult } = $props();

  const status = $derived(syncState?.status ?? 'idle');

  function statusColor(s: string) {
    switch (s) {
      case 'syncing': return 'bg-accent';
      case 'error': return 'bg-red-500';
      case 'offline': return 'bg-amber-500';
      default: return 'bg-green-500';
    }
  }

  function getStatusLabel(s: string) {
    switch (s) {
      case 'syncing': return 'Syncing…';
      case 'offline': return 'Offline — changes queued';
      case 'error': return 'Sync error';
      default: return 'Synced';
    }
  }

  const label = $derived(getStatusLabel(status));
</script>

<div class="px-2 mb-3">
  <div class="flex items-center gap-2 min-w-0">
    <span
      aria-hidden="true"
      class="inline-block h-2.5 w-2.5 rounded-full {statusColor(status)}"
      style={status === 'syncing' ? 'box-shadow: 0 0 8px var(--glow)' : ''}
    ></span>
    <div class="flex items-center gap-2 min-w-0">
      <div class="text-xs font-mono text-muted truncate">{label}</div>
    </div>
    <div class="ml-auto flex items-center gap-2">
      <button
        type="button"
        onclick={() => syncState?.syncNow?.()}
        class="text-[11px] font-mono text-muted hover:text-foreground px-2 py-1 rounded-md whitespace-nowrap"
        aria-label="Retry sync now"
      >
        Retry
      </button>
    </div>
  </div>

  {#if syncState?.lastError}
    <div class="mt-1 text-[11px] font-mono text-red-400">{syncState.lastError}</div>
  {/if}

  <div class="sr-only" aria-live="polite">{label}</div>
</div>
