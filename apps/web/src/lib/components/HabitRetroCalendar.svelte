<script lang="ts">
  import { ChevronLeft, ChevronRight, Minus, Plus, Snowflake, X } from 'lucide-svelte';
  import type { Habit } from '@/types/habit';
  import type { HabitColorTheme } from '$lib/theme/habit-colors';

  type Props = {
    habit: Habit;
    accent: HabitColorTheme;
    onUpdate: (dateKey: string, count: number) => Promise<void>;
  };

  const { habit, accent, onUpdate }: Props = $props();

  const DAY_HEADERS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  const POPOVER_WIDTH = 200;
  const POPOVER_HEIGHT = 142;

  interface DayInfo {
    date: string; // YYYY-MM-DD
    dayOfMonth: number;
    isEmpty: boolean;
    isToday: boolean;
    isFuture: boolean;
    isWeekend: boolean;
    isFrozen: boolean;
    count: number;
  }

  type EditorState = {
    date: string;
    count: number;
    savedCount: number;
    anchorX: number;
    anchorY: number;
  } | null;

  let displayOffset = $state(0); // number of days offset backwards from today
  let editor = $state<EditorState>(null);

  // Today at midnight as a stable key (string, no mutable Date in $state)
  const todayKey = new Date().toISOString().slice(0, 10);
  const dailyTarget = $derived(Math.max(1, habit.dailyTarget ?? 1));

  function formatKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }

  // Non-mutating: constructs a new Date at midnight
  function startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  // Non-mutating: constructs a new Date n days away
  function addDays(d: Date, n: number): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  }

  /** Returns ISO 8601 day index (1=Mon … 7=Sun) for a Date */
  function isoDay(d: Date): number {
    const day = d.getDay(); // 0=Sun
    return day === 0 ? 7 : day;
  }

  const weeks = $derived.by((): DayInfo[][] => {
    const todayDate = startOfDay(new Date());
    const windowEnd = addDays(todayDate, -displayOffset);
    const windowStart = addDays(windowEnd, -29);

    // Pad left to Monday
    const firstMondayOffset = (isoDay(windowStart) - 1 + 7) % 7;
    const gridStart = addDays(windowStart, -firstMondayOffset);

    // Collect cells until we've covered the full window and end on a Sunday
    const cells: DayInfo[] = [];
    let curDate = gridStart;
    while (curDate <= windowEnd || isoDay(curDate) !== 7) {
      const key = formatKey(curDate);
      const isEmpty = curDate < windowStart;
      const isFuture = curDate > todayDate;
      const dayOfWeek = isoDay(curDate); // 1=Mon … 7=Sun
      cells.push({
        date: key,
        dayOfMonth: curDate.getDate(),
        isEmpty,
        isToday: key === todayKey,
        isFuture,
        isWeekend: dayOfWeek === 6 || dayOfWeek === 7,
        isFrozen: habit.freezeDays.includes(key),
        count: habit.completions[key] ?? 0
      });
      curDate = addDays(curDate, 1);
    }

    // Group into weeks of 7
    const result: DayInfo[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      result.push(cells.slice(i, i + 7));
    }
    return result;
  });

  const canGoNext = $derived(displayOffset > 0);

  function goPrev() {
    displayOffset += 30;
  }

  function goNext() {
    if (!canGoNext) return;
    displayOffset = Math.max(0, displayOffset - 30);
  }

  function dayCellBg(day: DayInfo): string {
    if (day.isEmpty || day.isFuture) return 'transparent';
    if (day.count >= dailyTarget) return accent.heatmapLevels[4];
    if (day.count > 0) return accent.heatmapLevels[3];
    return 'var(--bg-card)';
  }

  function openEditor(day: DayInfo, el: HTMLButtonElement) {
    if (day.isEmpty || day.isFuture) return;
    const r = el.getBoundingClientRect();
    const anchorX = r.left + r.width / 2;
    const anchorY = r.top;
    editor = { date: day.date, count: day.count, savedCount: day.count, anchorX, anchorY };
  }

  const popoverLeft = $derived.by(() => {
    if (!editor) return 0;
    const margin = 12;
    const raw = editor.anchorX - POPOVER_WIDTH / 2;
    const maxL = (typeof window !== 'undefined' ? window.innerWidth : 1024) - POPOVER_WIDTH - margin;
    return Math.max(margin, Math.min(raw, maxL));
  });

  const popoverTop = $derived.by(() => {
    if (!editor) return 0;
    const margin = 8;
    const above = editor.anchorY - POPOVER_HEIGHT - margin;
    if (above >= margin) return above;
    // place below instead
    return editor.anchorY + margin + 28;
  });

  async function saveEdit() {
    if (!editor) return;
    await onUpdate(editor.date, editor.count);
    editor = null;
  }

  async function resetEdit() {
    if (!editor) return;
    await onUpdate(editor.date, 0);
    editor = null;
  }
</script>

<div class="w-full select-none">
  <!-- Navigation -->
  <div class="mb-3 flex items-center gap-2">
    <button
      type="button"
      onclick={goPrev}
      class="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-muted transition hover:border-border-hover hover:text-foreground"
    >
      <ChevronLeft size={12} />
      Prev
    </button>
    <span class="flex-1 text-center text-[10px] font-mono uppercase tracking-[0.2em] text-muted">
      Last 30 days
    </span>
    <button
      type="button"
      onclick={goNext}
      disabled={!canGoNext}
      class="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-muted transition hover:border-border-hover hover:text-foreground disabled:opacity-30"
    >
      Next
      <ChevronRight size={12} />
    </button>
  </div>

  <!-- Day-of-week headers -->
  <div class="mb-1 grid grid-cols-7 gap-1">
    {#each DAY_HEADERS as h, hi (h + '-' + hi)}
      <div class="text-center text-[9px] font-mono uppercase tracking-widest text-muted/60">{h}</div>
    {/each}
  </div>

  <!-- Calendar grid -->
  <div class="grid grid-cols-7 gap-1">
    {#each weeks.flat() as day (day.date + day.isEmpty)}
      {#if day.isEmpty}
        <div class="aspect-square w-full rounded-md"></div>
      {:else}
        <button
          type="button"
          onclick={(e) => { openEditor(day, e.currentTarget); }}
          disabled={day.isFuture}
          class="group relative aspect-square w-full rounded-md border transition-all"
          style:background-color={dayCellBg(day)}
          style:border-color={day.isToday ? accent.hex : day.isWeekend && !day.isFuture ? (accent.hex + '44') : 'var(--border)'}
          style:box-shadow={day.count >= dailyTarget ? `0 0 8px ${accent.glow}` : 'none'}
          title="{day.date}{day.isFrozen ? ' · frozen' : ''}{day.count > 0 ? ` · ${day.count}/${dailyTarget}` : ''}"
          aria-label="{day.date}{day.isFrozen ? ' frozen' : ''} — {day.count} of {dailyTarget} completions"
        >
          <span class="pointer-events-none absolute left-0.5 top-0.5 text-[8px] font-mono leading-none text-muted/60 transition group-hover:text-muted">
            {day.dayOfMonth}
          </span>
          {#if day.isFrozen}
            <span class="absolute inset-0 flex items-center justify-center">
              <Snowflake size={10} class="text-[var(--accent-secondary)] opacity-60" />
            </span>
          {:else if day.count > 1}
            <span class="absolute inset-0 flex items-center justify-center">
              <span class="text-[8px] font-mono font-bold" style:color={accent.hex}>{day.count}</span>
            </span>
          {/if}
        </button>
      {/if}
    {/each}
  </div>

  <!-- Heat legend -->
  <div class="mt-3 flex items-center justify-end gap-1.5">
    <span class="text-[9px] font-mono text-muted/60">less</span>
    {#each accent.heatmapLevels as bg, ai (bg + '-' + ai)}
      <div class="h-3 w-3 rounded-sm border border-border/40" style:background-color={bg}></div>
    {/each}
    <span class="text-[9px] font-mono text-muted/60">more</span>
  </div>
</div>

<!-- Editor popover -->
{#if editor}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-[238]"
    role="presentation"
    onclick={() => { editor = null; }}
    onkeydown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') editor = null; }}
  ></div>

  <div
    class="fixed z-[239] rounded-2xl border border-border bg-bg-card px-4 py-3 shadow-[0_16px_48px_rgba(0,0,0,0.32)]"
    style:width="{POPOVER_WIDTH}px"
    style:left="{popoverLeft}px"
    style:top="{popoverTop}px"
    role="dialog"
    aria-modal="true"
    aria-label="Edit completion for {editor.date}"
  >
    <div class="mb-2 flex items-center justify-between gap-2">
      <span class="text-[10px] font-mono uppercase tracking-wider text-muted">{editor.date}</span>
      <button
        type="button"
        onclick={() => { editor = null; }}
        class="text-muted hover:text-foreground"
        aria-label="Close editor"
      >
        <X size={12} />
      </button>
    </div>

    <div class="mb-3 flex items-center justify-center gap-3">
      <button
        type="button"
        onclick={() => { if (editor && editor.count > 0) editor.count -= 1; }}
        disabled={!editor || editor.count <= 0}
        class="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted transition hover:border-accent hover:text-accent disabled:opacity-30"
        aria-label="Decrease"
      >
        <Minus size={14} />
      </button>

      <div class="text-center">
        <span class="text-2xl font-mono font-bold text-foreground">{editor.count}</span>
        <span class="text-xs text-muted">/{dailyTarget}</span>
      </div>

      <button
        type="button"
        onclick={() => { if (editor && editor.count < dailyTarget) editor.count += 1; }}
        disabled={!editor || editor.count >= dailyTarget}
        class="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted transition hover:border-accent hover:text-accent disabled:opacity-30"
        aria-label="Increase"
      >
        <Plus size={14} />
      </button>
    </div>

    <div class="flex gap-2">
      <button
        type="button"
        onclick={() => { void saveEdit(); }}
        class="flex-1 rounded-full border border-accent px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.3em] text-accent transition hover:bg-accent/10"
      >
        Save
      </button>
      <button
        type="button"
        onclick={() => { void resetEdit(); }}
        class="rounded-full border border-border px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.3em] text-muted transition hover:border-border-hover hover:text-foreground"
      >
        Reset
      </button>
    </div>
  </div>
{/if}
