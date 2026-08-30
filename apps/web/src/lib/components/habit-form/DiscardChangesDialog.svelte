<script lang="ts">
  import Overlay from '../overlays/Overlay.svelte';

  type Props = {
    open: boolean;
    onKeepEditing: () => void;
    onDiscard: () => void;
  };

  let { open, onKeepEditing, onDiscard }: Props = $props();
</script>

<Overlay
  {open}
  onClose={onKeepEditing}
  ariaLabel="Discard unsaved changes"
  closeOnEscape={true}
  closeOnOutsideClick={false}
  trapFocus={true}
  restoreFocus={true}
  lockScroll={true}
  class="inset-0 z-[110] flex items-center justify-center bg-bg-primary/80 p-4 backdrop-blur-sm"
>
  <div class="w-full max-w-sm rounded-3xl border border-border bg-bg-secondary p-6 shadow-2xl">
    <h2 class="text-xl font-bold text-foreground">Discard unsaved changes?</h2>
    <p class="mt-2 text-sm leading-6 text-muted">Your latest edits will be lost.</p>
    <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <button type="button" class="min-h-11 rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted transition-colors hover:text-foreground" onclick={onKeepEditing}>Keep editing</button>
      <button type="button" class="min-h-11 rounded-full border border-danger/40 bg-danger/10 px-4 py-2 text-sm font-semibold text-danger transition-colors hover:bg-danger/20" onclick={onDiscard}>Discard changes</button>
    </div>
  </div>
</Overlay>
