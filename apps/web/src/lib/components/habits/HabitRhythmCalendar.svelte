<script lang="ts">
  import {
    addDaysToCalendarDate,
    calendarDateToDate,
    describeSchedule,
    formatCalendarDateInTimeZone
  } from '@habbit-runner/shared';
  import { Check, Clock3, Minus, Snowflake, X } from 'lucide-svelte';
  import type { Habit } from '@/types/habit';
  import DayStatusMenu from '$lib/components/overlays/DayStatusMenu.svelte';
  import { getScheduleStatusForDate, resolveHabitSchedule } from '$lib/habits/schedule';
  import type { DayStatus, EditableDayStatus } from '$lib/habits/habitRhythmStatus';
  import type { HabitColorTheme } from '$lib/theme/habit-colors';

  type Props = {
    habit: Habit;
    accent: HabitColorTheme;
    referenceDate: Date;
    timeZone: string;
    pending?: boolean;
    onSetStatus: (dateKey: string, status: EditableDayStatus) => void | Promise<void>;
  };

  type RhythmDay = {
    dateKey: string;
    label: string;
    shortLabel: string;
    status: DayStatus;
    count: number;
    isToday: boolean;
  };

  type SelectedDay = RhythmDay & {
    triggerEl: HTMLButtonElement;
    left: number;
    top: number;
  };

  const { habit, accent, referenceDate, timeZone, pending = false, onSetStatus }: Props = $props();

  const todayKey = $derived(formatCalendarDateInTimeZone(referenceDate, timeZone));
  let windowOffset = $state(0);
  let selectedDay = $state<SelectedDay | null>(null);
  let applying = $state(false);

  const anchorDateKey = $derived(addDaysToCalendarDate(todayKey, windowOffset));
  const scheduleLabel = $derived(describeSchedule(resolveHabitSchedule(habit)));
  const target = $derived(Math.max(1, habit.dailyTarget ?? 1));
  const windowStart = $derived(addDaysToCalendarDate(anchorDateKey, -13));
  const windowEnd = $derived(addDaysToCalendarDate(windowStart, 27));

  function formatLabel(dateKey: string, includeYear = false) {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      month: 'short',
      day: 'numeric',
      ...(includeYear ? { year: 'numeric' as const } : {})
    }).format(calendarDateToDate(dateKey));
  }

  function buildDays(): RhythmDay[] {
    return Array.from({ length: 28 }, (_, index) => {
      const dateKey = addDaysToCalendarDate(windowStart, index);
      const scheduleStatus = getScheduleStatusForDate(habit, dateKey, timeZone);
      const count = habit.completions[`${dateKey}T00:00:00Z`] ?? 0;
      let status: DayStatus = 'missed';

      if (dateKey > todayKey) {
        status = 'future';
      } else if (scheduleStatus === 'frozen') {
        status = 'frozen';
      } else if (scheduleStatus === 'unscheduled') {
        status = 'not-scheduled';
      } else if ((habit.type === 'negative' && count === 0) || (habit.type !== 'negative' && count >= target)) {
        status = 'completed';
      }

      return {
        dateKey,
        label: formatLabel(dateKey),
        shortLabel: new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', day: 'numeric' }).format(calendarDateToDate(dateKey)),
        status,
        count,
        isToday: dateKey === todayKey
      };
    });
  }

  const days = $derived(buildDays());
  const windowLabel = $derived(`${formatLabel(windowStart, true)} – ${formatLabel(windowEnd, true)}`);

  const statusClass: Record<DayStatus, string> = {
    completed: 'border-progress/45 bg-progress/20 text-progress',
    missed: 'border-danger/45 bg-danger/12 text-danger',
    frozen: 'border-accent-secondary/40 bg-accent-secondary/12 text-accent-secondary',
    'not-scheduled': 'border-dashed border-border bg-bg-secondary text-muted',
    future: 'border-accent/25 bg-accent/6 text-muted'
  };

  const statusLabel: Record<DayStatus, string> = {
    completed: 'Done',
    missed: 'Missed',
    frozen: 'Frozen',
    'not-scheduled': 'Rest day',
    future: 'Upcoming'
  };

  function showPreviousWindow() {
    windowOffset -= 28;
    selectedDay = null;
  }

  function showNextWindow() {
    windowOffset = Math.min(0, windowOffset + 28);
    selectedDay = null;
  }

  function openStatusMenu(day: RhythmDay, event: MouseEvent) {
    const triggerEl = event.currentTarget as HTMLButtonElement;
    const rect = triggerEl.getBoundingClientRect();
    const menuWidth = 320;
    const viewportPadding = 12;
    const left = typeof window === 'undefined'
      ? rect.left
      : Math.min(Math.max(rect.left + rect.width / 2 - menuWidth / 2, viewportPadding), window.innerWidth - menuWidth - viewportPadding);
    const top = typeof window === 'undefined'
      ? rect.bottom + 8
      : Math.min(rect.bottom + 8, Math.max(viewportPadding, window.innerHeight - 480));

    selectedDay = { ...day, triggerEl, left, top };
  }

  async function applyStatus(status: EditableDayStatus) {
    if (!selectedDay || pending || applying) {
      return;
    }
    applying = true;
    try {
      await onSetStatus(selectedDay.dateKey, status);
      selectedDay = null;
    } finally {
      applying = false;
    }
  }
</script>

<div>
  <div class="sr-only" aria-live="polite">
    <span>{windowLabel}</span>
    <button type="button" onclick={showPreviousWindow}>Show previous 28 days</button>
    <button type="button" onclick={showNextWindow} disabled={windowOffset === 0}>Show next 28 days</button>
  </div>
  <div class="flex items-center justify-between gap-3"><p class="text-xs leading-4 text-muted">{scheduleLabel}</p><span class="rounded-full border border-[#31425d] bg-[#16243a] px-2.5 py-1 text-[11px] text-muted">28 days · Daily</span></div>
  <ul class="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] text-muted" aria-label="Day status legend">
    <li class="inline-flex items-center gap-1.5"><Check size={12} class="text-progress" aria-hidden="true" />Done</li>
    <li class="inline-flex items-center gap-1.5"><X size={12} class="text-danger" aria-hidden="true" />Missed</li>
    <li class="inline-flex items-center gap-1.5"><Clock3 size={12} aria-hidden="true" />Upcoming</li>
    <li class="inline-flex items-center gap-1.5"><Snowflake size={12} class="text-accent-secondary" aria-hidden="true" />Frozen</li>
    <li class="inline-flex items-center gap-1.5"><Minus size={12} aria-hidden="true" />Rest day</li>
  </ul>

  <div class="mt-3 grid grid-cols-7 gap-1.5" role="group" aria-label="Habit rhythm by day">
    {#each days as day, dayIndex (`${day.dateKey}-${dayIndex}`)}
      <button
        type="button"
        onclick={(event) => openStatusMenu(day, event)}
        class={`relative flex min-h-10 min-w-0 items-center justify-center rounded-lg border p-1 text-center transition-[border-color,background-color,box-shadow] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${statusClass[day.status]} ${day.isToday ? 'ring-2 ring-foreground/70 ring-offset-2 ring-offset-bg-card' : ''}`}
        style={day.status === 'completed' ? `box-shadow: 0 8px 20px ${accent.glow};` : undefined}
        aria-label={`${day.label}: ${statusLabel[day.status]}${day.isToday ? ', today' : ''}. Open status menu`}
        aria-haspopup="dialog"
        aria-expanded={selectedDay?.dateKey === day.dateKey}
      >
        <span class="absolute left-1 top-1 font-mono text-[8px] font-semibold tabular-nums">{day.shortLabel}</span>
        <span class="inline-flex size-5 items-center justify-center rounded-full bg-current/10" aria-hidden="true">
          {#if day.status === 'completed'}<Check size={14} strokeWidth={2.75} />
          {:else if day.status === 'missed'}<X size={14} strokeWidth={2.75} />
          {:else if day.status === 'future'}<Clock3 size={13} />
          {:else if day.status === 'frozen'}<Snowflake size={13} />
          {:else}<Minus size={13} />{/if}
        </span>
        {#if day.count > 0 && target > 1 && day.status !== 'frozen'}
          <span class="absolute bottom-0.5 right-1 text-[7px] font-semibold text-current/70">{day.count}/{target}</span>
        {/if}
        {#if day.isToday}
          <span class="absolute -bottom-1.5 rounded-full bg-foreground px-1 py-0.5 text-[7px] font-bold uppercase tracking-wide text-bg-card">Today</span>
        {/if}
      </button>
    {/each}
  </div>
</div>

{#if selectedDay}
  <DayStatusMenu
    dateLabel={selectedDay.label}
    selectedStatus={selectedDay.status}
    triggerEl={selectedDay.triggerEl}
    left={selectedDay.left}
    top={selectedDay.top}
    pending={pending || applying}
    onClose={() => { selectedDay = null; }}
    onSelect={applyStatus}
  />
{/if}
