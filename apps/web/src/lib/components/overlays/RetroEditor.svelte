<script lang="ts">
  import { Check, Minus, Plus, RotateCcw, X } from 'lucide-svelte';
  import { openOverlay, closeActiveOverlay } from './overlayManager';
  import type { HabitColorTheme } from '$lib/theme/habit-colors';

  type Props = {
    date: string;
    triggerEl: HTMLButtonElement;
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
    triggerEl,
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
        triggerEl,
        panelEl,
        open: true,
        onClose,
        closeOnEscape: true,
        closeOnOutsideClick: true,
        trapFocus: true,
        restoreFocus: true,
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
  class="fixed z-50 w-[min(18rem,calc(100vw-1.5rem))] rounded-[1.5rem] border border-border bg-bg-card p-4 shadow-[0_24px_64px_rgba(0,0,0,0.38)]"
  style:left="{popoverLeft}px"
  style:top="{popoverTop}px"
  role="dialog"
  aria-modal="true"
  aria-label="Edit completion for {date}"
>
  <div class="flex items-start justify-between gap-3">
    <div>
      <p class="text-[9px] font-mono uppercase tracking-[0.22em] text-muted">Edit history</p>
      <p class="mt-1 text-sm font-semibold text-foreground">{date}</p>
    </div>
    <button
      type="button"
      onclick={onClose}
      class="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[1rem] border border-border bg-bg-secondary text-muted transition-colors hover:border-border-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
      aria-label="Close editor"
    >
      <X size={16} aria-hidden="true" />
    </button>
  </div>

  <div class="mt-4 flex items-center justify-between gap-3 rounded-[1.25rem] border border-border bg-bg-secondary p-2">
    <button
      type="button"
      onclick={() => { onAdjust(-1); }}
      disabled={pendingValue <= 0}
      class="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[1rem] border border-border bg-bg-card text-muted transition-colors hover:border-border-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:cursor-not-allowed disabled:opacity-40"
      aria-label="Remove one completion"
    >
      <Minus size={16} aria-hidden="true" />
    </button>

    <div class="min-w-0 text-center">
      <span class="block text-2xl font-semibold tracking-tight text-foreground" style:color={pendingValue >= maxValue ? accent.hex : undefined}>{pendingValue}/{maxValue}</span>
      <span class="mt-0.5 block text-[9px] font-mono uppercase tracking-[0.16em] text-muted">Recorded</span>
    </div>

    <button
      type="button"
      onclick={() => { onAdjust(1); }}
      disabled={pendingValue >= maxValue}
      class="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[1rem] border border-border bg-bg-card text-muted transition-colors hover:border-border-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:cursor-not-allowed disabled:opacity-40"
      aria-label="Add one completion"
    >
      <Plus size={16} aria-hidden="true" />
    </button>
  </div>

  <div class="mt-4 grid grid-cols-2 gap-2">
    <button
      type="button"
      onclick={() => { onSave(); }}
      class="inline-flex min-h-11 items-center justify-center gap-2 rounded-[1rem] border border-accent/30 bg-accent/12 px-3 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
      style:box-shadow="0 0 8px {accent.glow}"
    >
      <Check size={14} aria-hidden="true" />
      Save
    </button>
    <button
      type="button"
      onclick={() => { onReset(); }}
      class="inline-flex min-h-11 items-center justify-center gap-2 rounded-[1rem] border border-border bg-bg-secondary px-3 py-2 text-sm font-medium text-muted transition-colors hover:border-border-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
    >
      <RotateCcw size={14} aria-hidden="true" />
      Reset
    </button>
  </div>
</div>
