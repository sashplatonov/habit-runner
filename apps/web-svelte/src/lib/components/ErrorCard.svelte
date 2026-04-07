<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    title = 'Something went wrong',
    message,
    onRetry,
    retryLabel = 'Try again'
  }: {
    title?: string;
    message?: string;
    onRetry?: () => void;
    retryLabel?: string;
  } = $props();
</script>

<div class="rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4 space-y-2" role="alert">
  <p class="text-sm font-semibold text-foreground">{title}</p>
  {#if message}
    <p class="text-xs font-mono text-muted break-words">{message}</p>
  {/if}
  {#if onRetry}
    <button
      type="button"
      onclick={onRetry}
      class="mt-1 text-xs font-semibold text-accent hover:underline"
    >
      {retryLabel}
    </button>
  {/if}
</div>
