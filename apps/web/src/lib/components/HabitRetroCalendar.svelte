<script lang="ts">
  import { describeSchedule } from '@habbit-runner/shared';
  import { CalendarDays, Check, ChevronLeft, ChevronRight, Snowflake } from 'lucide-svelte';
  import { SvelteDate } from 'svelte/reactivity';
  import type { Habit } from '@/types/habit';
  import { completionKeyToCalendarDate } from '$lib/completionKey';
  import { formatDate } from '$lib/habits/habitStats';
  import { isScheduledForDate, resolveHabitSchedule } from '$lib/habits/schedule';
  import type { HabitColorTheme } from '$lib/theme/habit-colors';
  import { DAY_HEADERS, POPOVER_HEIGHT, POPOVER_WIDTH } from '$lib/habits/retroCalendar.constants';
  import RetroEditor from '$lib/components/overlays/RetroEditor.svelte';
  import IconButton from '$lib/components/ui/IconButton.svelte';
  import StatusPill from '$lib/components/ui/StatusPill.svelte';

  type Props = {
    habit: Habit;
    accent: HabitColorTheme;
    onUpdate: (dateKey: string, count: number) => Promise<void>;
    embedded?: boolean;
  };

  type RetroCalendarDay = {
    date: string;
    dayOfMonth: number;
    scheduled: boolean;
    count: number;
    isToday: boolean;
    isFuture: boolean;
    isEmpty: boolean;
    isFrozen: boolean;
  };

  type RetroCalendarEditor = {
    date: string;
    pendingValue: number;
    anchorX: number;
    anchorY: number;
    triggerEl: HTMLButtonElement;
  };

  const { habit, accent, onUpdate, embedded = false }: Props = $props();

  let displayDate = new SvelteDate();
  let editor = $state<RetroCalendarEditor | null>(null);

  function clampValue(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, Math.trunc(value)));
  }

  function buildRetroGrid(
    currentHabit: Habit,
    schedule: ReturnType<typeof resolveHabitSchedule>,
    windowDays: number,
    currentDisplayDate: Date = new SvelteDate()
  ) {
    const now = new SvelteDate();
    const todayKey = formatDate(now);
    const startDate = new SvelteDate(currentDisplayDate.getTime());
    startDate.setDate(startDate.getDate() - (windowDays - 1));

    const weekStartOffset = (startDate.getDay() + 6) % 7;
    const paddedStart = new SvelteDate(startDate.getTime());
    paddedStart.setDate(paddedStart.getDate() - weekStartOffset);

    const days: RetroCalendarDay[] = [];

    for (let index = 0; index < weekStartOffset; index += 1) {
      const date = new SvelteDate(paddedStart.getTime());
      date.setDate(paddedStart.getDate() + index);
      days.push({
        date: formatDate(date),
        dayOfMonth: date.getDate(),
        scheduled: false,
        count: 0,
        isToday: false,
        isFuture: false,
        isEmpty: true,
        isFrozen: false
      });
    }

    for (let index = 0; index < windowDays; index += 1) {
      const date = new SvelteDate(startDate.getTime());
      date.setDate(startDate.getDate() + index);
      const dateKey = formatDate(date);
      const freezeKey = completionKeyToCalendarDate(dateKey);
      days.push({
        date: dateKey,
        dayOfMonth: date.getDate(),
        scheduled: isScheduledForDate(schedule, date),
        count: currentHabit.completions[dateKey] ?? 0,
        isToday: dateKey === todayKey,
        isFuture: date > now,
        isEmpty: false,
        isFrozen: (currentHabit.freezeDays ?? []).includes(freezeKey)
      });
    }

    const weeks: RetroCalendarDay[][] = [];
    for (let index = 0; index < days.length; index += 7) {
      weeks.push(days.slice(index, index + 7));
    }

    return { weeks };
  }

  function getDayButtonClasses(day: RetroCalendarDay) {
    const classes = [
      'group relative flex min-h-11 w-full flex-col items-center justify-center overflow-hidden rounded-[0.9rem] border px-0.5 py-1 text-sm transition-[border-color,background-color,box-shadow,opacity] duration-150 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card'
    ];
    if (day.isFuture) {
      classes.push('cursor-not-allowed border-border bg-bg-secondary/40 text-muted opacity-45');
    } else if (day.isFrozen) {
      classes.push('border-accent-secondary/35 bg-accent-secondary/10 text-accent-secondary');
    } else if (!day.scheduled) {
      classes.push('border-dashed border-border bg-bg-secondary/70 text-muted hover:border-border-hover');
    } else {
      classes.push('border-border bg-bg-card text-foreground hover:border-border-hover');
    }
    return classes.join(' ');
  }

  function getDayStyle(day: RetroCalendarDay, maxValue: number) {
    if (day.isEmpty || day.isFuture) {
      return undefined;
    }

    const completed = day.count >= maxValue;
    const progress = Math.round((Math.min(day.count, maxValue) / maxValue) * 100);
    const parts: string[] = [];

    if (completed) {
      parts.push(`background: color-mix(in srgb, var(--bg-card) 55%, ${accent.hex} 45%)`);
      parts.push(`border-color: ${accent.hex}`);
      parts.push(`box-shadow: 0 8px 20px ${accent.glow}`);
    } else if (day.count > 0) {
      parts.push(`background: linear-gradient(to top, color-mix(in srgb, var(--bg-card) 45%, ${accent.hex} 55%) ${progress}%, var(--bg-card) ${progress}%)`);
      parts.push(`border-color: ${accent.hex}99`);
    }

    if (day.isToday) {
      const existingShadow = completed ? `0 8px 20px ${accent.glow}, ` : '';
      parts.push(`box-shadow: ${existingShadow}0 0 0 2px var(--bg-card), 0 0 0 4px ${accent.hex}`);
    }

    return parts.join('; ');
  }

  function getDayLabelClasses(day: RetroCalendarDay, completed: boolean) {
    const classes = ['font-mono text-xs font-semibold leading-none tabular-nums'];
    if (completed) {
      classes.push('text-foreground');
    } else if (day.isToday) {
      classes.push('text-foreground');
    } else {
      classes.push('text-muted');
    }
    return classes.join(' ');
  }

  function getDayAriaLabel(day: RetroCalendarDay, maxValue: number) {
    const date = completionKeyToCalendarDate(day.date);
    const parts = [date, day.isToday ? 'today' : '', day.scheduled ? 'scheduled' : 'rest day'];

    if (day.isFuture) {
      parts.push('upcoming');
    } else if (day.isFrozen) {
      parts.push('frozen');
    } else if (day.count >= maxValue) {
      parts.push('completed');
    } else if (day.count > 0) {
      parts.push(`${day.count} of ${maxValue} recorded`);
    } else {
      parts.push('not completed');
    }

    return parts.filter(Boolean).join(', ');
  }

  function clampPopoverX(anchorX: number) {
    if (typeof window === 'undefined') {
      return anchorX;
    }
    const min = 12;
    const max = window.innerWidth - POPOVER_WIDTH - 12;
    return Math.min(Math.max(anchorX - POPOVER_WIDTH / 2, min), Math.max(min, max));
  }

  function clampPopoverY(anchorY: number) {
    if (typeof window === 'undefined') {
      return anchorY;
    }
    const min = 12;
    const max = window.innerHeight - POPOVER_HEIGHT - 12;
    return Math.min(Math.max(anchorY - POPOVER_HEIGHT - 16, min), Math.max(min, max));
  }

  const schedule = $derived(resolveHabitSchedule(habit));
  const dailyTarget = $derived(Math.max(1, habit.dailyTarget ?? 1));
  const maxValue = $derived(Math.max(1, dailyTarget));
  const historyWindowDays = $derived(embedded ? 28 : 30);
  const scheduleLabel = $derived(describeSchedule(schedule));
  const grid = $derived(buildRetroGrid(habit, schedule, historyWindowDays, displayDate));
  const currentDate = $derived(new SvelteDate());
  const weeks = $derived(grid.weeks);
  const windowEndLabel = $derived(displayDate.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
  const isCurrentMonth = $derived(
    displayDate.getMonth() === currentDate.getMonth() && displayDate.getFullYear() === currentDate.getFullYear()
  );
  const disableNextMonth = $derived(
    displayDate.getFullYear() > currentDate.getFullYear()
      || (
        displayDate.getFullYear() === currentDate.getFullYear()
        && displayDate.getMonth() >= currentDate.getMonth()
      )
  );
  const popoverLeft = $derived(editor ? clampPopoverX(editor.anchorX) : 0);
  const popoverTop = $derived(editor ? clampPopoverY(editor.anchorY) : 0);

  function handlePrevMonth() {
    const previous = new SvelteDate(displayDate.getTime());
    previous.setMonth(previous.getMonth() - 1);
    displayDate = previous;
  }

  function handleNextMonth() {
    const next = new SvelteDate(displayDate.getTime());
    next.setMonth(next.getMonth() + 1);
    displayDate = next;
  }

  function handleToday() {
    displayDate = new SvelteDate();
  }

  function openMultiTargetEditor(day: RetroCalendarDay, event: MouseEvent) {
    const rect = (event.currentTarget as HTMLButtonElement).getBoundingClientRect();
    editor = {
      date: day.date,
      pendingValue: clampValue(day.count, 0, maxValue),
      anchorX: rect.left + rect.width / 2,
      anchorY: rect.top,
      triggerEl: event.currentTarget as HTMLButtonElement
    };
  }

  function toggleSingleTargetDay(day: RetroCalendarDay) {
    const nextValue = day.count > 0 ? 0 : 1;
    void onUpdate(day.date, nextValue);
  }

  function handleDayClick(day: RetroCalendarDay, event: MouseEvent) {
    if (day.isFuture || day.isEmpty) {
      return;
    }
    if (maxValue > 1) {
      openMultiTargetEditor(day, event);
      return;
    }
    toggleSingleTargetDay(day);
  }

  function adjustEditorValue(delta: number) {
    if (!editor) {
      return;
    }
    editor = {
      ...editor,
      pendingValue: clampValue(editor.pendingValue + delta, 0, maxValue)
    };
  }

  async function applyEditorValue() {
    if (!editor) {
      return;
    }
    await onUpdate(editor.date, clampValue(editor.pendingValue, 0, maxValue));
    editor = null;
  }

  async function handleReset() {
    if (!editor) {
      return;
    }
    await onUpdate(editor.date, 0);
    editor = null;
  }
</script>

<svelte:element
  this={embedded ? 'div' : 'section'}
  class={embedded ? 'min-w-0' : 'overflow-hidden rounded-surface border border-border bg-bg-card p-3 shadow-surface sm:p-6'}
>
  {#if !embedded}
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0">
        <p class="text-[10px] font-mono uppercase tracking-[0.24em] text-muted">History editor</p>
        <h2 class="mt-1 text-xl font-semibold tracking-tight text-foreground">Retro calendar</h2>
        <p class="mt-2 max-w-xl text-sm leading-6 text-muted">
          Tap a past day to correct its record. Future days stay locked.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <StatusPill tone="neutral">
          <CalendarDays size={12} aria-hidden="true" />
          Last {historyWindowDays} days
        </StatusPill>
        <StatusPill tone="neutral">{scheduleLabel}</StatusPill>
      </div>
    </div>
  {/if}

  <div class={`rounded-[1.5rem] border border-border bg-bg-secondary/75 p-2 sm:p-4 ${embedded ? '' : 'mt-5'}`}>
    {#if embedded}
      <div class="mb-4 flex flex-wrap items-center justify-between gap-2 px-1">
        <p class="text-sm leading-6 text-muted">Tap a past day to correct its record.</p>
        <div class="flex flex-wrap gap-2">
          <StatusPill tone="neutral">
            <CalendarDays size={12} aria-hidden="true" />
            Last {historyWindowDays} days
          </StatusPill>
          <StatusPill tone="neutral">{scheduleLabel}</StatusPill>
        </div>
      </div>
    {/if}
    <div class="flex items-center justify-between gap-3">
      <IconButton ariaLabel="Show previous history window" title="Show previous history window" onClick={handlePrevMonth}>
        <ChevronLeft size={18} aria-hidden="true" />
      </IconButton>

      <button
        type="button"
        onclick={handleToday}
        class={`min-h-11 min-w-0 flex-1 rounded-[1rem] border px-3 py-2 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card ${isCurrentMonth ? 'border-progress/25 bg-progress/10 text-foreground' : 'border-border bg-bg-card text-muted hover:border-border-hover hover:text-foreground'}`}
        aria-label={isCurrentMonth ? `${windowEndLabel}, current ${historyWindowDays}-day window` : `${windowEndLabel}, jump to current ${historyWindowDays}-day window`}
        aria-current={isCurrentMonth ? 'date' : undefined}
      >
        <span class="block text-[9px] font-mono uppercase tracking-[0.2em] text-muted">Window ending</span>
        <span class="mt-0.5 block truncate text-sm font-semibold">{windowEndLabel}</span>
      </button>

      <IconButton ariaLabel="Show next history window" title="Show next history window" disabled={disableNextMonth} onClick={handleNextMonth}>
        <ChevronRight size={18} aria-hidden="true" />
      </IconButton>
    </div>

    <ul class="mt-4 flex flex-wrap gap-x-4 gap-y-2 px-1 text-[11px] text-muted" aria-label="Retro calendar legend">
      <li class="inline-flex items-center gap-1.5">
        <span class="size-2.5 rounded-full border border-progress/40 bg-progress/30" aria-hidden="true"></span>
        Completed
      </li>
      <li class="inline-flex items-center gap-1.5">
        <span class="size-2.5 rounded-full border border-border bg-bg-card" aria-hidden="true"></span>
        Open
      </li>
      <li class="inline-flex items-center gap-1.5">
        <span class="size-2.5 rounded-full border border-dashed border-border bg-bg-secondary" aria-hidden="true"></span>
        Rest day
      </li>
      <li class="inline-flex items-center gap-1.5">
        <Snowflake size={11} class="text-accent-secondary" aria-hidden="true" />
        Frozen
      </li>
      <li class="inline-flex items-center gap-1.5">
        <span class="size-2.5 rounded-full border-2 border-foreground/70" aria-hidden="true"></span>
        Today
      </li>
    </ul>

    <div class="mx-auto mt-4 w-full max-w-2xl">
      <div class="mb-2 grid grid-cols-7 gap-1 sm:gap-2" aria-hidden="true">
        {#each DAY_HEADERS as header, headerIndex (`${header}-${headerIndex}`)}
          <div class="py-1 text-center text-[9px] font-mono uppercase tracking-[0.12em] text-muted sm:text-[10px]">{header}</div>
        {/each}
      </div>

      <div class="space-y-1 sm:space-y-2" role="group" aria-label="Editable completion history">
        {#each weeks as week, weekIndex (`week-${weekIndex}`)}
          <div class="grid grid-cols-7 gap-1 sm:gap-2">
            {#each week as day, dayIndex (`${day.date}-${dayIndex}`)}
              {#if day.isEmpty}
                <div class="min-h-11 w-full"></div>
              {:else}
                <button
                  type="button"
                  onclick={(event) => { handleDayClick(day, event); }}
                  disabled={day.isFuture}
                  class={getDayButtonClasses(day)}
                  style={getDayStyle(day, maxValue)}
                  aria-label={getDayAriaLabel(day, maxValue)}
                  aria-current={day.isToday ? 'date' : undefined}
                >
                  <span
                    class={getDayLabelClasses(day, day.count >= maxValue)}
                    style={day.isToday && day.count < maxValue ? `color: ${accent.hex};` : ''}
                  >
                    {day.dayOfMonth}
                  </span>

                  {#if day.count > 0 && maxValue > 1}
                    <span class="mt-1 text-[8px] font-semibold leading-none text-foreground/70">{day.count}/{maxValue}</span>
                  {/if}

                  {#if day.isFrozen}
                    <Snowflake size={10} class="absolute right-1 top-1 text-accent-secondary" aria-hidden="true" />
                  {:else if day.count >= maxValue}
                    <Check size={10} class="absolute bottom-1 right-1" style={`color: ${accent.hex}`} aria-hidden="true" />
                  {/if}
                </button>
              {/if}
            {/each}
          </div>
        {/each}
      </div>
    </div>
  </div>

  {#if editor}
    <RetroEditor
      date={editor.date}
      triggerEl={editor.triggerEl}
      pendingValue={editor.pendingValue}
      maxValue={maxValue}
      accent={accent}
      popoverLeft={popoverLeft}
      popoverTop={popoverTop}
      onClose={() => { editor = null; }}
      onSave={() => { void applyEditorValue(); }}
      onReset={() => { void handleReset(); }}
      onAdjust={(delta) => { adjustEditorValue(delta); }}
    />
  {/if}
</svelte:element>
