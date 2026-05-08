<script lang="ts">
  import { openOverlay, closeActiveOverlay } from './overlayManager';
  import type { HabitColorTheme } from '$lib/theme/habit-colors';

  type Props = {
    date: string;
    pendingValue: number;
    maxValue: number;
    accent: HabitColorTheme;
    onClose: () => void;
    onSave: () => void;
    onReset: () => void;
    onAdjust: (delta: number) => void;
    popoverLeft: number;
    popoverTop: number;
  };

  const {
    date,
    pendingValue,
    maxValue,
    accent,
    onClose,
    onSave,
    onReset,
    onAdjust,
    popoverLeft,
    popoverTop,
  }: Props = $props();

  let panelEl = $state<HTMLDivElement | null>(null);

  $effect(() => {
    if (panelEl) {
      openOverlay({
        triggerEl: null,
        panelEl,
        open: true,
        onClose,
        closeOnEscape: true,
        closeOnOutsideClick: true,
        trapFocus: true,
        restoreFocus: false,
        lockScroll: false,
      });
    }

    return () => {
      closeActiveOverlay();
    };
  });
</script>

<div
  bind:this={panelEl}
  class="fixed z-50 w-[200px] rounded-2xl border border-border bg-bg-primary p-3 shadow-[0_20px_40px_rgba(0,0,0,0.35)]"
  style:left="{popoverLeft}px"
  style:top="{popoverTop}px"
  role="dialog"
  aria-modal="true"
  aria-label="Edit completion for {date}"
>
  <div class="flex items-center justify-between">
    <p class="text-[10px] font-mono" style:color={accent.hex}>{date}</p>
    <button type="button" onclick={onClose} class="text-[12px] font-bold text-muted" aria-label="Close editor">×</button>
  </div>

  <div class="mt-3 flex items-center justify-between gap-4">
    <button
      type="button"
      onclick={() => { onAdjust(-1); }}
      disabled={pendingValue <= 0}
      class="h-9 w-9 rounded-full border border-border text-sm leading-none disabled:text-muted"
    >
      –
    </button>

    <span class="text-sm font-semibold text-foreground">{pendingValue}/{maxValue}</span>

    <button
      type="button"
      onclick={() => { onAdjust(1); }}
      disabled={pendingValue >= maxValue}
      class="h-9 w-9 rounded-full border border-border text-sm leading-none disabled:text-muted"
    >
      +
    </button>
  </div>

  <div class="mt-3 flex gap-2">
    <button
      type="button"
      onclick={() => { onSave(); }}
      class="flex-1 rounded-lg border border-border bg-accent/10 px-3 py-2 text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-accent transition hover:bg-accent/20"
      style:box-shadow="0 0 8px {accent.glow}"
    >
      Save
    </button>
    <button
      type="button"
      onclick={() => { onReset(); }}
      class="flex-1 rounded-lg border border-border px-3 py-2 text-[10px] font-mono uppercase tracking-[0.3em] text-muted transition hover:border-border-hover"
    >
      Reset
    </button>
  </div>
</div>
