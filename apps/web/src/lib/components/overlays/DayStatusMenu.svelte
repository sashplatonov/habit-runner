<script lang="ts">
  import { CalendarClock, Check, Minus, Snowflake, X } from 'lucide-svelte';
  import Overlay from '$lib/components/overlays/Overlay.svelte';
  import type { DayStatus, EditableDayStatus } from '$lib/habits/habitRhythmStatus';

  type Props = {
    dateLabel: string;
    selectedStatus: DayStatus;
    triggerEl: HTMLButtonElement;
    left: number;
    top: number;
    pending?: boolean;
    onClose: () => void;
    onSelect: (status: EditableDayStatus) => void | Promise<void>;
  };

  const {
    dateLabel,
    selectedStatus,
    triggerEl,
    left,
    top,
    pending = false,
    onClose,
    onSelect
  }: Props = $props();

  const isReadOnly = $derived(selectedStatus === 'future' || selectedStatus === 'not-scheduled');

  function optionClass(status: DayStatus, disabled = false) {
    const selected = selectedStatus === status;
    return `flex min-h-12 w-full items-center gap-3 rounded-[1rem] border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${selected ? 'border-accent/35 bg-accent/12 text-foreground' : 'border-border bg-bg-secondary text-muted hover:border-border-hover hover:text-foreground'} ${disabled ? 'cursor-not-allowed opacity-55' : ''}`;
  }
</script>

<Overlay
  open
  {triggerEl}
  {onClose}
  role="dialog"
  ariaLabel={`Set status for ${dateLabel}`}
  ariaModal={true}
  class="bottom-3 left-3 right-3 rounded-[1.5rem] border border-border bg-bg-card p-4 shadow-[0_24px_64px_rgba(0,0,0,0.38)] sm:bottom-auto sm:left-[var(--day-menu-left)] sm:right-auto sm:top-[var(--day-menu-top)] sm:w-80"
  style={`--day-menu-left: ${left}px; --day-menu-top: ${top}px;`}
>
  <div class="flex items-start justify-between gap-3">
    <div>
      <p class="text-[9px] font-mono uppercase tracking-[0.22em] text-muted">Day status</p>
      <p class="mt-1 text-sm font-semibold text-foreground">{dateLabel}</p>
    </div>
    <button
      type="button"
      onclick={onClose}
      class="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[1rem] border border-border bg-bg-secondary text-muted transition-colors hover:border-border-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
      aria-label="Close day status menu"
    >
      <X size={16} aria-hidden="true" />
    </button>
  </div>

  <div class="mt-4 space-y-2" role="group" aria-label="Available day statuses">
    <button type="button" class={optionClass('completed', isReadOnly || pending)} disabled={isReadOnly || pending} onclick={() => onSelect('completed')}>
      <span class="inline-flex size-8 shrink-0 items-center justify-center rounded-[0.7rem] bg-progress/15 text-progress"><Check size={16} aria-hidden="true" /></span>
      <span class="min-w-0"><span class="block text-sm font-semibold">Done</span><span class="block text-[11px] text-muted">Daily target reached</span></span>
      {#if selectedStatus === 'completed'}<span class="ml-auto text-[9px] font-mono uppercase tracking-wider text-accent">Current</span>{/if}
    </button>

    <button type="button" class={optionClass('missed', isReadOnly || pending)} disabled={isReadOnly || pending} onclick={() => onSelect('missed')}>
      <span class="inline-flex size-8 shrink-0 items-center justify-center rounded-[0.7rem] bg-danger/12 text-danger"><X size={16} aria-hidden="true" /></span>
      <span class="min-w-0"><span class="block text-sm font-semibold">Missed</span><span class="block text-[11px] text-muted">Scheduled step not completed</span></span>
      {#if selectedStatus === 'missed'}<span class="ml-auto text-[9px] font-mono uppercase tracking-wider text-accent">Current</span>{/if}
    </button>

    <button type="button" class={optionClass('frozen', isReadOnly || pending)} disabled={isReadOnly || pending} onclick={() => onSelect('frozen')}>
      <span class="inline-flex size-8 shrink-0 items-center justify-center rounded-[0.7rem] bg-accent-secondary/12 text-accent-secondary"><Snowflake size={16} aria-hidden="true" /></span>
      <span class="min-w-0"><span class="block text-sm font-semibold">Frozen</span><span class="block text-[11px] text-muted">Protected pause that preserves momentum</span></span>
      {#if selectedStatus === 'frozen'}<span class="ml-auto text-[9px] font-mono uppercase tracking-wider text-accent">Current</span>{/if}
    </button>

    <div class={optionClass('future', true)} aria-disabled="true">
      <span class="inline-flex size-8 shrink-0 items-center justify-center rounded-[0.7rem] bg-accent/8 text-muted"><CalendarClock size={16} aria-hidden="true" /></span>
      <span class="min-w-0"><span class="block text-sm font-semibold">Upcoming</span><span class="block text-[11px] text-muted">Set automatically for future dates</span></span>
      {#if selectedStatus === 'future'}<span class="ml-auto text-[9px] font-mono uppercase tracking-wider text-accent">Current</span>{/if}
    </div>

    <div class={optionClass('not-scheduled', true)} aria-disabled="true">
      <span class="inline-flex size-8 shrink-0 items-center justify-center rounded-[0.7rem] bg-bg-primary text-muted"><Minus size={16} aria-hidden="true" /></span>
      <span class="min-w-0"><span class="block text-sm font-semibold">Rest day</span><span class="block text-[11px] text-muted">Set automatically by the habit schedule</span></span>
      {#if selectedStatus === 'not-scheduled'}<span class="ml-auto text-[9px] font-mono uppercase tracking-wider text-accent">Current</span>{/if}
    </div>
  </div>
</Overlay>
