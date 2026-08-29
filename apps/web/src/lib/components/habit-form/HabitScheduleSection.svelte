<script lang="ts">
  import type { HabitSchedule, WeekOfMonth } from '@habbit-runner/shared';
  import { Calendar, CalendarDays, CalendarRange, ChartColumnIncreasing, type Icon } from 'lucide-svelte';
  import { SCHEDULE_TYPE_OPTIONS } from '$lib/habits/constants';

  const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
  const WEEK_OF_MONTH_OPTIONS: WeekOfMonth[] = [1, 2, 3, 4, 'last'];
  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const CHOICE_ICONS: Record<HabitSchedule['type'], typeof Icon> = {
    daily: Calendar,
    weekly_days: CalendarDays,
    weekly_quota: ChartColumnIncreasing,
    monthly_quota: ChartColumnIncreasing,
    monthly_weeks: CalendarRange
  };

  const TYPE_LABELS: Record<HabitSchedule['type'], string> = {
    daily: 'Daily',
    weekly_days: 'Days of week',
    weekly_quota: 'Weekly quota',
    monthly_quota: 'Monthly quota',
    monthly_weeks: 'Monthly weeks'
  };

  const EFFECT_SUMMARIES: Record<HabitSchedule['type'], string> = {
    daily: 'A scheduled opportunity is created every calendar day.',
    weekly_days: 'Only the selected weekdays count as scheduled days.',
    weekly_quota: 'Completions count toward the weekly target on any allowed day.',
    monthly_quota: 'Completions count toward the monthly target on any allowed day.',
    monthly_weeks: 'Scheduled days repeat only during the selected weeks of each month.'
  };

  function typeLabel(type: HabitSchedule['type']): string {
    return TYPE_LABELS[type];
  }

  function effectSummary(type: HabitSchedule['type']): string {
    return EFFECT_SUMMARIES[type];
  }

  let {
    schedule = $bindable<HabitSchedule>({ type: 'daily' }),
    openSlot = $bindable<HabitSchedule['type'] | null>(null),
    errors = {}
  }: {
    schedule: HabitSchedule;
    openSlot?: HabitSchedule['type'] | null;
    errors: Record<string, string>;
  } = $props();

  function openType(nextType: HabitSchedule['type']) {
    if (openSlot === nextType) {
      return;
    }

    if (schedule.type === nextType) {
      openSlot = nextType;
      return;
    }

    schedule = createScheduleForType(nextType, schedule);
    openSlot = nextType;
  }

  function sortWeekdays(days: number[]): number[] {
    return [...days].sort((left, right) => WEEKDAY_ORDER.indexOf(left) - WEEKDAY_ORDER.indexOf(right));
  }

  function toggleWeekday(day: number) {
    if (schedule.type === 'daily') {
      return;
    }

    const nextWeekdays = sortWeekdays(toggleArray(getWeekdaysFromSchedule(schedule) ?? [], day));

    if (schedule.type === 'weekly_days') {
      schedule = { ...schedule, weekdays: nextWeekdays };
      return;
    }

    if (schedule.type === 'monthly_weeks') {
      schedule = { ...schedule, weekdays: nextWeekdays };
      return;
    }

    if (schedule.type === 'weekly_quota') {
      schedule = nextWeekdays.length > 0
        ? { ...schedule, weekdays: nextWeekdays }
        : { type: 'weekly_quota', timesPerWeek: schedule.timesPerWeek };
      return;
    }

    schedule = nextWeekdays.length > 0
      ? { ...schedule, weekdays: nextWeekdays }
      : { type: 'monthly_quota', timesPerMonth: schedule.timesPerMonth };
  }

  function toggleWeekOfMonth(week: WeekOfMonth) {
    if (schedule.type !== 'monthly_weeks') {
      return;
    }

    schedule = {
      ...schedule,
      weeksOfMonth: toggleArray(schedule.weeksOfMonth, week)
    };
  }

  function setWeeklyQuota(value: number) {
    if (schedule.type !== 'weekly_quota') {
      return;
    }

    schedule = {
      ...schedule,
      timesPerWeek: Math.max(1, Math.min(7, Math.trunc(value)))
    };
  }

  function setMonthlyQuota(value: number) {
    if (schedule.type !== 'monthly_quota') {
      return;
    }

    schedule = {
      ...schedule,
      timesPerMonth: Math.max(1, Math.min(31, Math.trunc(value)))
    };
  }

  function getWeekdaysFromSchedule(current: HabitSchedule): number[] | undefined {
    if (current.type === 'weekly_days' || current.type === 'monthly_weeks') {
      return current.weekdays;
    }

    if (current.type === 'weekly_quota' || current.type === 'monthly_quota') {
      return current.weekdays;
    }

    return undefined;
  }

  function toggleArray<T>(items: T[], value: T): T[] {
    if (items.includes(value)) {
      return items.filter((item) => item !== value);
    }

    return [...items, value];
  }

  function createScheduleForType(nextType: HabitSchedule['type'], current: HabitSchedule): HabitSchedule {
    switch (nextType) {
      case 'daily':
        return { type: 'daily' };
      case 'weekly_days':
        return {
          type: 'weekly_days',
          weekdays: current.type === 'weekly_days' ? current.weekdays : [1, 2, 3, 4, 5]
        };
      case 'weekly_quota': {
        const weekdays = getWeekdaysFromSchedule(current);
        return {
          type: 'weekly_quota',
          timesPerWeek: current.type === 'weekly_quota' ? current.timesPerWeek : 2,
          ...(weekdays && weekdays.length > 0 ? { weekdays } : {})
        };
      }
      case 'monthly_weeks':
        return {
          type: 'monthly_weeks',
          weeksOfMonth: current.type === 'monthly_weeks' ? current.weeksOfMonth : [1],
          weekdays: current.type === 'monthly_weeks'
            ? current.weekdays
            : getWeekdaysFromSchedule(current) ?? [1, 2, 3, 4, 5]
        };
      case 'monthly_quota': {
        const weekdays = getWeekdaysFromSchedule(current);
        return {
          type: 'monthly_quota',
          timesPerMonth: current.type === 'monthly_quota' ? current.timesPerMonth : 3,
          ...(weekdays && weekdays.length > 0 ? { weekdays } : {})
        };
      }
    }
  }
</script>

<div
  class="rounded-[1.75rem] border border-border bg-bg-card/92 p-5 shadow-[0_20px_54px_rgba(15,23,42,0.08)]"
  data-editor-schedule
>
  <div class="mb-2 flex items-start justify-between gap-3">
    <div>
      <p class="block text-[10px] font-mono uppercase tracking-wider text-muted">Schedule</p>
      <p class="mt-1 text-[13px] leading-5 text-muted">Choose when scheduled opportunities are created.</p>
    </div>
    <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
      <CalendarDays size={18} strokeWidth={1.8} aria-hidden="true" />
    </span>
  </div>
  <div class="mt-2 grid gap-2" role="group" aria-label="Schedule type">
    {#each SCHEDULE_TYPE_OPTIONS as option (`${option.value}`)}
      <button
        type="button"
        class={`flex min-h-[64px] w-full items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-left transition-[background-color,border-color] ${schedule.type === option.value ? 'border-accent bg-accent/10' : 'border-border bg-bg-primary hover:border-border-hover'}`}
        aria-pressed={schedule.type === option.value}
        data-editor-schedule-option={option.value}
        onclick={() => {
          openType(option.value);
        }}
      >
        <span
          class={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] ${schedule.type === option.value ? 'bg-bg-card text-accent' : 'bg-bg-secondary text-muted'}`}
        >
          <svelte:component this={CHOICE_ICONS[option.value]} size={18} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <span class="min-w-0">
          <span class="block text-[13px] font-semibold text-foreground">{option.label}</span>
          <span class="mt-0.5 block text-[11px] leading-4 text-muted">{option.desc}</span>
        </span>
      </button>
    {/each}
  </div>

  <div class="mt-3 space-y-3">
    {#if openSlot === 'weekly_days'}
      <div class="space-y-2">
        <div class="flex gap-1">
          {#each DAY_LABELS as day, index (`${day}-${index}`)}
            <button
              type="button"
              class={`flex min-h-11 flex-1 items-center justify-center rounded-lg border px-2 py-1 text-xs font-mono transition ${schedule.weekdays.includes(index) ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:border-border-hover'}`}
              aria-label={`Toggle ${day} for the schedule`}
              aria-pressed={schedule.weekdays.includes(index)}
              onclick={() => {
                toggleWeekday(index);
              }}
            >
              {day[0]}
            </button>
          {/each}
        </div>
        {#if errors.schedule}
          <p class="text-[10px] font-mono text-accent-secondary">{errors.schedule}</p>
        {/if}
      </div>
    {/if}

    {#if openSlot === 'weekly_quota'}
      <div class="space-y-3">
        <div class="flex items-center gap-3">
          <input
            type="number"
            min="1"
            max="7"
            name="weekly-quota"
            aria-label="Times per week"
            inputmode="numeric"
            value={schedule.timesPerWeek}
            class="w-16 rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm font-mono focus:border-accent/60"
            oninput={(event) => {
              setWeeklyQuota(Number((event.currentTarget as HTMLInputElement).value));
            }}
          />
          <span class="text-sm font-semibold text-foreground">{`${schedule.timesPerWeek} times per week`}</span>
        </div>

        <div class="space-y-2">
          <p class="text-[11px] font-mono uppercase tracking-[0.3em] text-muted">Optional weekdays</p>
          <div class="flex gap-1">
            {#each DAY_LABELS as day, index (`${day}-${index}`)}
              <button
                type="button"
                class={`flex min-h-11 flex-1 items-center justify-center rounded-lg border px-2 py-1 text-xs font-mono transition ${(schedule.weekdays ?? []).includes(index) ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:border-border-hover'}`}
                aria-label={`Toggle ${day} for the weekly quota schedule`}
                aria-pressed={(schedule.weekdays ?? []).includes(index)}
                onclick={() => {
                  toggleWeekday(index);
                }}
              >
                {day[0]}
              </button>
            {/each}
          </div>
          <p class="text-[9px] font-mono text-muted">Leave all days unselected to allow any day.</p>
        </div>
      </div>
    {/if}

    {#if openSlot === 'monthly_weeks'}
      <div class="space-y-3">
        <div class="space-y-2">
          <p class="text-[11px] font-mono uppercase tracking-[0.3em] text-muted">Weeks</p>
          <div class="flex flex-wrap gap-1">
            {#each WEEK_OF_MONTH_OPTIONS as week, weekIndex (`${week}-${weekIndex}`)}
              <button
                type="button"
                class={`rounded-full border px-3 py-2 text-[10px] font-mono transition ${schedule.weeksOfMonth.includes(week) ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:border-border-hover'}`}
                aria-pressed={schedule.weeksOfMonth.includes(week)}
                onclick={() => {
                  toggleWeekOfMonth(week);
                }}
              >
                {week === 'last' ? 'Last' : `${week}th`}
              </button>
            {/each}
          </div>
          {#if errors.scheduleWeeks}
            <p class="text-[10px] font-mono text-accent-secondary">{errors.scheduleWeeks}</p>
          {/if}
        </div>

        <div class="space-y-2">
          <p class="text-[11px] font-mono uppercase tracking-[0.3em] text-muted">Weekdays</p>
          <div class="flex gap-1">
            {#each DAY_LABELS as day, index (`${day}-${index}`)}
              <button
                type="button"
                class={`flex min-h-11 flex-1 items-center justify-center rounded-lg border px-2 py-1 text-xs font-mono transition ${schedule.weekdays.includes(index) ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:border-border-hover'}`}
                aria-label={`Toggle ${day} for the monthly week schedule`}
                aria-pressed={schedule.weekdays.includes(index)}
                onclick={() => {
                  toggleWeekday(index);
                }}
              >
                {day[0]}
              </button>
            {/each}
          </div>
          {#if errors.scheduleWeekdays}
            <p class="text-[10px] font-mono text-accent-secondary">{errors.scheduleWeekdays}</p>
          {/if}
        </div>
      </div>
    {/if}

    {#if openSlot === 'monthly_quota'}
      <div class="space-y-3">
        <div class="flex items-center gap-3">
          <input
            type="number"
            min="1"
            max="31"
            name="monthly-quota"
            aria-label="Times per month"
            inputmode="numeric"
            value={schedule.timesPerMonth}
            class="w-20 rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm font-mono focus:border-accent/60"
            oninput={(event) => {
              setMonthlyQuota(Number((event.currentTarget as HTMLInputElement).value));
            }}
          />
          <span class="text-sm font-semibold text-foreground">{`${schedule.timesPerMonth} times per month`}</span>
        </div>

        <div class="space-y-2">
          <p class="text-[11px] font-mono uppercase tracking-[0.3em] text-muted">Optional weekdays</p>
          <div class="flex gap-1">
            {#each DAY_LABELS as day, index (`${day}-${index}`)}
              <button
                type="button"
                class={`flex min-h-11 flex-1 items-center justify-center rounded-lg border px-2 py-1 text-xs font-mono transition ${(schedule.weekdays ?? []).includes(index) ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:border-border-hover'}`}
                aria-label={`Toggle ${day} for the monthly quota schedule`}
                aria-pressed={(schedule.weekdays ?? []).includes(index)}
                onclick={() => {
                  toggleWeekday(index);
                }}
              >
                {day[0]}
              </button>
            {/each}
          </div>
          <p class="text-[9px] font-mono text-muted">Leave all days unselected to allow any day.</p>
        </div>
      </div>
    {/if}
  </div>
</div>

<div
  class="rounded-[1.75rem] border border-border bg-bg-card/92 p-5 shadow-[0_20px_54px_rgba(15,23,42,0.08)]"
  data-editor-schedule-effect
>
  <p class="block text-[10px] font-mono uppercase tracking-wider text-muted">Effect</p>
  <div class="mt-2 rounded-2xl border border-border bg-bg-primary p-3">
    <p class="text-[13px] font-bold text-foreground" data-editor-schedule-effect-title>
      {typeLabel(schedule.type)}
    </p>
    <p class="mt-0.5 text-[11px] leading-4 text-muted" data-editor-schedule-effect-summary>
      {effectSummary(schedule.type)}
    </p>
  </div>
  <p class="mt-2.5 rounded-xl border border-border bg-bg-secondary px-3 py-2.5 text-[11px] leading-4 text-muted">
    Changing the schedule affects future opportunities only. Existing history stays unchanged.
  </p>
</div>
