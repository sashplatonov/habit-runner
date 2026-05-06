<script lang="ts">
  import { describeSchedule } from '@habbit-runner/shared';
  import { ChevronLeft, ChevronRight } from 'lucide-svelte';
  import { SvelteDate, SvelteMap } from 'svelte/reactivity';
  import type { Habit } from '@/types/habit';
  import { completionKeyToCalendarDate } from '$lib/completionKey';
  import { formatDate } from '$lib/habits/habitStats';
  import { isScheduledForDate, resolveHabitSchedule } from '$lib/habits/schedule';
  import type { HabitColorTheme } from '$lib/theme/habit-colors';
  import { DAY_HEADERS, POPOVER_HEIGHT, POPOVER_WIDTH } from '$lib/habits/retroCalendar.constants';

  type Props = {
    habit: Habit;
    accent: HabitColorTheme;
    onUpdate: (dateKey: string, count: number) => Promise<void>;
  };

  type RetroCalendarDay = {
    date: string;
    dayOfMonth: number;
    scheduled: boolean;
    count: number;
    isToday: boolean;
    isFuture: boolean;
    isEmpty: boolean;
    dayOfWeek: number;
    isWeekend: boolean;
    monthIndex?: number;
    isFrozen: boolean;
  };

  type MonthHighlight = 'current' | 'previous' | null;

  type RetroCalendarEditor = {
    date: string;
    pendingValue: number;
    anchorX: number;
    anchorY: number;
  };

  const { habit, accent, onUpdate }: Props = $props();

  let displayDate = new SvelteDate();
  let editor = $state<RetroCalendarEditor | null>(null);

  function clampValue(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, Math.trunc(value)));
  }

  function buildRetroGrid(
    currentHabit: Habit,
    schedule: ReturnType<typeof resolveHabitSchedule>,
    currentDisplayDate: Date = new SvelteDate()
  ) {
    const now = new SvelteDate();
    const todayKey = formatDate(now);
    const startDate = new SvelteDate(currentDisplayDate.getTime());
    startDate.setDate(startDate.getDate() - 29);

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
        dayOfWeek: date.getDay(),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        isFrozen: false
      });
    }

    const monthIndexMap = new SvelteMap<number, number>();
    const registerMonthIndex = (month: number) => {
      if (!monthIndexMap.has(month)) {
        monthIndexMap.set(month, monthIndexMap.size);
      }
      return monthIndexMap.get(month) ?? 0;
    };

    for (let index = 0; index < 30; index += 1) {
      const date = new SvelteDate(startDate.getTime());
      date.setDate(startDate.getDate() + index);
      const dateKey = formatDate(date);
      const freezeKey = completionKeyToCalendarDate(dateKey);
      const dayOfWeek = date.getDay();
      days.push({
        date: dateKey,
        dayOfMonth: date.getDate(),
        scheduled: isScheduledForDate(schedule, date),
        count: currentHabit.completions[dateKey] ?? 0,
        isToday: dateKey === todayKey,
        isFuture: date > now,
        isEmpty: false,
        dayOfWeek,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        monthIndex: registerMonthIndex(date.getMonth()),
        isFrozen: (currentHabit.freezeDays ?? []).includes(freezeKey)
      });
    }

    const weeks: RetroCalendarDay[][] = [];
    for (let index = 0; index < days.length; index += 7) {
      weeks.push(days.slice(index, index + 7));
    }

    return { weeks, monthCount: monthIndexMap.size };
  }

  function buildDayBoxShadow(
    completed: boolean,
    weekendHighlight: boolean,
    monthHighlight: MonthHighlight
  ) {
    const parts: string[] = [];
    if (completed) {
      parts.push(`0 0 10px ${accent.glow}`);
    }
    if (weekendHighlight) {
      parts.push(`0 0 0 1px ${accent.hex}40`);
    }
    if (monthHighlight) {
      parts.push(`0 0 ${monthHighlight === 'current' ? 6 : 4}px ${accent.hex}${monthHighlight === 'current' ? '80' : '50'}`);
    }
    return parts.length > 0 ? parts.join(', ') : undefined;
  }

  function getDayBackground(day: RetroCalendarDay, maxValue: number) {
    if (day.isEmpty || day.isFuture) {
      return 'transparent';
    }
    if (day.count >= maxValue) {
      return accent.heatmapLevels[4];
    }
    if (day.count > 0) {
      return accent.heatmapLevels[3];
    }
    return 'var(--bg-card)';
  }

  function getDayButtonClasses(day: RetroCalendarDay) {
    const classes = [
      'relative aspect-square w-full overflow-hidden rounded-md border flex flex-col items-center justify-center transition-all duration-150'
    ];
    if (day.isFuture) {
      classes.push('cursor-not-allowed opacity-30');
    } else {
      classes.push('hover:brightness-110');
    }
    if (day.isToday) {
      classes.push('ring-1');
    }
    return classes.join(' ');
  }

  function getMonthMeta(day: RetroCalendarDay, monthCount: number) {
    const monthSlot = Math.min(Math.max(day.monthIndex ?? 0, 0), Math.max(monthCount - 1, 0));
    const currentMonthIndex = Math.max(monthCount - 1, 0);
    const previousMonthIndex = monthCount > 1 ? monthCount - 2 : null;
    const isCurrentMonth = !day.isFuture && monthSlot === currentMonthIndex;
    const isPreviousMonth = previousMonthIndex !== null && !day.isFuture && monthSlot === previousMonthIndex;
    const monthHighlight: MonthHighlight = isCurrentMonth ? 'current' : isPreviousMonth ? 'previous' : null;
    const monthOpacity = !day.isFuture
      ? monthHighlight === 'current'
        ? 1
        : monthHighlight === 'previous'
          ? 0.78
          : Math.max(0.5, 0.9 - monthSlot * 0.15)
      : undefined;
    return { monthOpacity, monthHighlight };
  }

  function getDayStyle(day: RetroCalendarDay, maxValue: number, monthCount: number) {
    const background = getDayBackground(day, maxValue);
    const completed = day.count >= maxValue;
    const { monthOpacity, monthHighlight } = getMonthMeta(day, monthCount);
    const baseBorderColor = day.scheduled ? accent.hex : 'var(--border-dashed, var(--border))';
    const borderStyle = day.scheduled ? 'solid' : 'dashed';
    const weekendHighlight = day.isWeekend && !day.isFuture && !day.isEmpty;
    const boxShadow = buildDayBoxShadow(completed, weekendHighlight, monthHighlight);
    const parts = [
      `background-color: ${background}`,
      `border-color: ${weekendHighlight || monthHighlight ? accent.hex : baseBorderColor}`,
      `border-style: ${borderStyle}`
    ];
    if (boxShadow) {
      parts.push(`box-shadow: ${boxShadow}`);
    }
    if (monthOpacity) {
      parts.push(`opacity: ${monthOpacity}`);
    }
    if (weekendHighlight) {
      parts.push(`background-image: linear-gradient(135deg, ${accent.dim}, transparent)`);
      parts.push('filter: saturate(1.08)');
    }
    if (day.isToday) {
      parts.push(`--tw-ring-color: ${accent.hex}`);
    }
    return parts.join('; ');
  }

  function getDayLabelClasses(day: RetroCalendarDay, completed: boolean) {
    const classes = ['text-[9px] font-mono leading-none'];
    if (completed) {
      classes.push('font-bold text-foreground');
    } else if (day.isToday) {
      classes.push('font-semibold');
    } else {
      classes.push('text-muted');
    }
    return classes.join(' ');
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
  const scheduleLabel = $derived(describeSchedule(schedule));
  const grid = $derived(buildRetroGrid(habit, schedule, displayDate));
  const currentDate = $derived(new SvelteDate());
  const weeks = $derived(grid.weeks);
  const monthCount = $derived(grid.monthCount);
  const monthYearLabel = $derived(displayDate.toLocaleString('en-US', { month: 'short', year: 'numeric' }));
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
      anchorY: rect.top
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

<div class="space-y-2 rounded-2xl border border-border bg-bg-secondary p-3">
  <div class="flex items-center justify-between gap-2">
    <div>
      <h2 class="text-[11px] font-mono uppercase tracking-[0.5em] text-muted">Retro calendar</h2>
      <p class="mt-0.5 text-[10px] text-muted">{scheduleLabel}</p>
    </div>
    <span class="text-[11px] font-mono text-muted">30d</span>
  </div>

  <div class="flex items-center justify-between gap-2 pt-1">
    <button
      type="button"
      onclick={handlePrevMonth}
      class="flex h-7 w-7 items-center justify-center rounded border border-border text-muted transition-colors hover:border-border-hover hover:text-foreground"
      title="Previous month"
    >
      <ChevronLeft size={16} />
    </button>

    <div class="flex-1 text-center">
      <button
        type="button"
        onclick={handleToday}
        class={`text-xs font-mono uppercase tracking-wider transition-colors ${isCurrentMonth ? 'font-semibold text-foreground' : 'text-muted hover:text-foreground'}`}
        title="Jump to current month"
      >
        {monthYearLabel}
      </button>
    </div>

    <button
      type="button"
      onclick={handleNextMonth}
      disabled={disableNextMonth}
      class="flex h-7 w-7 items-center justify-center rounded border border-border text-muted transition-colors hover:border-border-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
      title="Next month"
    >
      <ChevronRight size={16} />
    </button>
  </div>

  <div class="mx-auto w-full lg:max-w-[248px]">
    <div class="mb-1.5 grid grid-cols-7 gap-1.5 sm:gap-2">
      {#each DAY_HEADERS as header, headerIndex (`${header}-${headerIndex}`)}
        <div class="py-0.5 text-center text-[9px] font-mono uppercase tracking-wider text-muted">{header}</div>
      {/each}
    </div>

    <div class="space-y-1.5 sm:space-y-2">
      {#each weeks as week, weekIndex (`week-${weekIndex}`)}
        <div class="grid grid-cols-7 gap-1.5 sm:gap-2">
          {#each week as day, dayIndex (`${day.date}-${dayIndex}`)}
            {#if day.isEmpty}
              <div class="aspect-square w-full"></div>
            {:else}
              <button
                type="button"
                onclick={(event) => { handleDayClick(day, event); }}
                disabled={day.isFuture}
                class={getDayButtonClasses(day)}
                style={getDayStyle(day, maxValue, monthCount)}
                aria-label={`${day.date} ${day.scheduled ? 'scheduled' : 'manual'} ${day.count}/${maxValue}${day.isFrozen ? ' frozen' : ''}`}
              >
                <span
                  class={getDayLabelClasses(day, day.count >= maxValue)}
                  style={day.isToday && day.count < maxValue ? `color: ${accent.hex};` : ''}
                >
                  {day.dayOfMonth}
                </span>

                {#if day.count > 0 && maxValue > 1}
                  <span class="text-[7px] leading-none text-foreground/60">{day.count}/{maxValue}</span>
                {/if}

                {#if day.isFrozen}
                  <span class="absolute right-1 top-1 text-[8px] text-accent-secondary" aria-hidden="true">*</span>
                {/if}
              </button>
            {/if}
          {/each}
        </div>
      {/each}
    </div>
  </div>

  {#if editor}
    <button
      type="button"
      class="fixed inset-0 z-40"
      onclick={() => { editor = null; }}
      aria-label="Close retro calendar editor"
    ></button>

    <div
      class="fixed z-50 w-[200px] rounded-2xl border border-border bg-bg-primary p-3 shadow-[0_20px_40px_rgba(0,0,0,0.35)]"
      style:left="{popoverLeft}px"
      style:top="{popoverTop}px"
      role="dialog"
      aria-modal="true"
      aria-label="Edit completion for {editor.date}"
    >
      <div class="flex items-center justify-between">
        <p class="text-[10px] font-mono" style:color={accent.hex}>{editor.date}</p>
        <button type="button" onclick={() => { editor = null; }} class="text-[12px] font-bold text-muted" aria-label="Close editor">×</button>
      </div>

      <div class="mt-3 flex items-center justify-between gap-4">
        <button
          type="button"
          onclick={() => { adjustEditorValue(-1); }}
          disabled={editor.pendingValue <= 0}
          class="h-9 w-9 rounded-full border border-border text-sm leading-none disabled:text-muted"
        >
          –
        </button>

        <span class="text-sm font-semibold text-foreground">{editor.pendingValue}/{maxValue}</span>

        <button
          type="button"
          onclick={() => { adjustEditorValue(1); }}
          disabled={editor.pendingValue >= maxValue}
          class="h-9 w-9 rounded-full border border-border text-sm leading-none disabled:text-muted"
        >
          +
        </button>
      </div>

      <div class="mt-3 flex gap-2">
        <button
          type="button"
          onclick={() => { void applyEditorValue(); }}
          class="flex-1 rounded-lg border border-border bg-accent/10 px-3 py-2 text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-accent transition hover:bg-accent/20"
          style:box-shadow={`0 0 8px ${accent.glow}`}
        >
          Save
        </button>
        <button
          type="button"
          onclick={() => { void handleReset(); }}
          class="flex-1 rounded-lg border border-border px-3 py-2 text-[10px] font-mono uppercase tracking-[0.3em] text-muted transition hover:border-border-hover"
        >
          Reset
        </button>
      </div>
    </div>
  {/if}
</div>
