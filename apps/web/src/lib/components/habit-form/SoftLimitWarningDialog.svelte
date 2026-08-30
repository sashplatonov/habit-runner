<script lang="ts">
  import { Plus } from 'lucide-svelte';
  import Overlay from '../overlays/Overlay.svelte';

  type Props = {
    open: boolean;
    onBack: () => void;
    onContinue: () => void;
  };

  let { open, onBack, onContinue }: Props = $props();
</script>

<Overlay
  {open}
  onClose={onBack}
  ariaLabel="Add another habit"
  closeOnEscape={true}
  closeOnOutsideClick={false}
  trapFocus={true}
  restoreFocus={false}
  lockScroll={true}
  class="inset-0 z-[100] flex items-center justify-center bg-bg-primary/80 p-4 backdrop-blur-sm"
>
  <div class="w-full max-w-sm rounded-3xl border border-border bg-bg-secondary p-6 shadow-2xl">
    <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10">
      <Plus class="text-accent" size={24} aria-hidden="true" />
    </div>
    <h3 class="mb-2 text-xl font-bold text-foreground">Focus is key</h3>
    <p class="mb-6 text-sm leading-relaxed text-muted">
      Consider getting the current habits into a steadier rhythm before adding another one.
      <br /><br />
      A short run of consistency usually gives the new habit more room to stick.
    </p>
    <div class="flex flex-col gap-2">
      <button type="button" class="w-full rounded-2xl border border-border bg-bg-primary py-3 text-sm font-semibold transition hover:bg-bg-card" onclick={onBack}>Go back</button>
      <button type="button" class="w-full rounded-2xl py-3 text-[10px] font-mono uppercase tracking-widest text-muted transition hover:text-foreground" onclick={onContinue}>Add anyway</button>
    </div>
  </div>
</Overlay>
