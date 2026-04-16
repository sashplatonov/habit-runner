<script lang="ts">
  type Props = {
    title?: string;
    message?: string;
    onRetry?: () => void | Promise<void>;
    retryLabel?: string;
  };

  let {
    title = 'Something went wrong',
    message,
    onRetry,
    retryLabel = 'Try again'
  }: Props = $props();
</script>

<div class="space-y-2 rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4" role="alert">
  <p class="text-sm font-semibold text-foreground">{title}</p>
  {#if message}
    <p class="break-words text-xs font-mono text-muted">{message}</p>
  {/if}
  {#if onRetry}
    <button
      type="button"
      class="mt-1 text-xs font-semibold text-accent hover:underline"
      onclick={() => {
        void onRetry();
      }}
    >
      {retryLabel}
    </button>
  {/if}
</div>
