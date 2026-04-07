<script lang="ts">
  let {
    message,
    onUndo,
    onDismiss
  }: {
    message: string;
    onUndo: () => void;
    onDismiss: () => void;
  } = $props();
</script>

<div
  class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl border border-border bg-bg-card/95 backdrop-blur-lg px-4 py-3 shadow-2xl min-w-[240px] max-w-[90vw] animate-slide-up"
>
  <span class="text-sm text-foreground flex-1 min-w-0 truncate">{message}</span>
  <button
    type="button"
    onclick={onUndo}
    class="text-xs font-bold text-accent hover:underline whitespace-nowrap"
  >
    Undo
  </button>
  <button
    type="button"
    onclick={onDismiss}
    class="text-muted hover:text-foreground text-sm leading-none ml-1"
    aria-label="Dismiss"
  >
    ×
  </button>
</div>
