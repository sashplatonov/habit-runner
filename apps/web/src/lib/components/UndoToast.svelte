<script lang="ts">
  type Props = {
    message: string;
    actionLabel?: string;
    onAction?: () => void | Promise<void>;
    onClose: () => void;
  };

  let { message, actionLabel, onAction, onClose }: Props = $props();

  const hasAction = $derived(Boolean(actionLabel && onAction));
</script>

<div class="fixed bottom-6 left-1/2 z-50 flex w-full max-w-lg -translate-x-1/2 items-center justify-between gap-4 rounded-2xl border border-border bg-bg-secondary/90 px-4 py-3 text-sm text-foreground shadow-xl backdrop-blur-xl">
  <div>
    <p class="text-[11px] font-mono uppercase tracking-[0.3em] text-muted">{hasAction ? 'undo' : 'notice'}</p>
    <p class="mt-1 text-base font-semibold">{message}</p>
  </div>

  <div class="flex items-center gap-2">
    {#if hasAction}
      <button
        type="button"
        class="rounded-full border border-accent px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-accent transition hover:border-accent-secondary/60"
        onclick={onAction}
      >
        {actionLabel}
      </button>
    {/if}

    <button
      type="button"
      class="text-xs font-mono uppercase tracking-[0.3em] text-muted"
      onclick={onClose}
    >
      x
    </button>
  </div>
</div>
