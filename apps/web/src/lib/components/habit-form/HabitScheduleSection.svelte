<script lang="ts">
  import type { HabitSchedule, WeekOfMonth } from '@habbit-runner/shared';
  import { Calendar, CalendarDays, CalendarRange, ChartColumnIncreasing, Check, type Icon } from 'lucide-svelte';
  import { SCHEDULE_TYPE_OPTIONS } from '$lib/habits/constants';

  const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
  const WEEK_OF_MONTH_OPTIONS: WeekOfMonth[] = [1, 2, 3, 4, 'last'];
  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DAY_FULL_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const selectedWeekdays = $derived(
    schedule.type === 'weekly_days' || schedule.type === 'monthly_weeks'
      ? WEEKDAY_ORDER.filter((day) => schedule.weekdays.includes(day))
      : []
  );
  const weekdayPattern = $derived(
    selectedWeekdays.length > 0 ? selectedWeekdays.map((day) => DAY_LABELS[day]).join(' · ') : 'None selected'
  );
  const weekdaysRule = $derived.by(() => {
    const names = selectedWeekdays.map((day) => DAY_FULL_NAMES[day]);
    if (names.length === 0) {
      return 'Select at least one weekday to schedule opportunities.';
    }
    if (names.length === 1) {
      return `Only ${names[0]} counts as a scheduled day.`;
    }
    return `Only ${names.slice(0, -1).join(', ')} and ${names[names.length - 1]} count as scheduled days.`;
  });

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
    {#if openSlot === 'daily'}
      <div class="space-y-3" data-editor-schedule-daily data-testid="daily-summary">
        <div class="flex items-center gap-2.5 rounded-2xl border border-border bg-bg-primary p-3" data-editor-schedule-daily-summary>
          <span class="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] bg-emerald-50 text-emerald-600">
            <Check size={16} strokeWidth={2} aria-hidden="true" />
          </span>
          <span class="min-w-0">
            <span class="block text-[13px] font-semibold text-foreground">Every day</span>
            <span class="block text-[11px] leading-4 text-muted">Monday through Sunday</span>
          </span>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div class="rounded-2xl border border-border bg-bg-primary p-2.5">
            <p class="text-[13px] font-bold text-foreground">7</p>
            <p class="mt-0.5 text-[10px] leading-[14px] text-muted">scheduled days / week</p>
          </div>
          <div class="rounded-2xl border border-border bg-bg-primary p-2.5">
            <p class="text-[13px] font-bold text-foreground">1/day</p>
            <p class="mt-0.5 text-[10px] leading-[14px] text-muted">opportunity frequency</p>
          </div>
        </div>
        <div class="rounded-2xl border border-border bg-bg-primary p-3" data-editor-schedule-daily-rule>
          <p class="text-[12px] font-semibold leading-5 text-foreground">A scheduled opportunity is created every calendar day.</p>
          <p class="mt-0.5 text-[11px] leading-4 text-muted">Existing history remains unchanged.</p>
        </div>
      </div>
    {/if}

    {#if openSlot === 'weekly_days'}
      <div class="space-y-3" data-editor-schedule-weekdays data-testid="schedule-weekdays-view">
        <div class="space-y-2">
          <p class="text-[10px] font-mono uppercase tracking-[0.18em] text-muted">Weekdays</p>
          <div class="grid grid-cols-7 gap-1.5">
            {#each WEEKDAY_ORDER as day (`${day}`)}
              <button
                type="button"
                class={`flex min-h-11 items-center justify-center rounded-xl border px-1 py-1 text-[11px] font-bold transition ${schedule.weekdays.includes(day) ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-bg-primary text-muted hover:border-border-hover'}`}
                aria-label={`Toggle ${DAY_FULL_NAMES[day]} for the schedule`}
                aria-pressed={schedule.weekdays.includes(day)}
                data-editor-schedule-weekday={day}
                onclick={() => {
                  toggleWeekday(day);
                }}
              >
                {DAY_LABELS[day]}
              </button>
            {/each}
          </div>
          {#if errors.schedule}
            <p class="text-[10px] font-mono text-accent-secondary" role="alert">{errors.schedule}</p>
          {/if}
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div class="rounded-2xl border border-border bg-bg-primary p-2.5">
            <p class="text-[13px] font-bold text-foreground" data-editor-schedule-weekdays-count>{schedule.weekdays.length}</p>
            <p class="mt-0.5 text-[10px] leading-[14px] text-muted">days selected</p>
          </div>
          <div class="rounded-2xl border border-border bg-bg-primary p-2.5">
            <p class="text-[11px] font-bold leading-4 text-foreground" data-editor-schedule-weekdays-pattern>{weekdayPattern}</p>
            <p class="mt-0.5 text-[10px] leading-[14px] text-muted">current pattern</p>
          </div>
        </div>
        <div class="rounded-2xl border border-border bg-bg-primary p-3" data-editor-schedule-weekdays-rule>
          <p class="text-[12px] font-semibold leading-5 text-foreground">{weekdaysRule}</p>
          <p class="mt-0.5 text-[11px] leading-4 text-muted">Other weekdays are not treated as missed opportunities.</p>
        </div>
      </div>
    {/if}

    {#if openSlot === 'weekly_quota'}
      <div class="space-y-3" data-testid="weekly-quota-view" data-editor-schedule-weekly-quota>
        <div class="space-y-2">
          <p class="text-[10px] font-mono uppercase tracking-[0.18em] text-muted">Completions per week</p>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-bg-primary text-lg text-muted transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Decrease weekly quota"
              disabled={schedule.timesPerWeek <= 1}
              data-editor-quota-decrement="weekly"
              onclick={() => {
                setWeeklyQuota(schedule.timesPerWeek - 1);
              }}
            >
              −
            </button>
            <p
              class="flex h-11 min-w-14 items-center justify-center rounded-xl border border-border bg-bg-primary text-lg font-bold text-foreground"
              aria-live="polite"
              aria-label={`Weekly quota: ${schedule.timesPerWeek} completions per week`}
              data-editor-quota-value="weekly"
            >
              {schedule.timesPerWeek}
            </p>
            <button
              type="button"
              class="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-bg-primary text-lg text-muted transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Increase weekly quota"
              disabled={schedule.timesPerWeek >= 7}
              data-editor-quota-increment="weekly"
              onclick={() => {
                setWeeklyQuota(schedule.timesPerWeek + 1);
              }}
            >
              +
            </button>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div class="rounded-2xl border border-border bg-bg-primary p-2.5">
            <p class="whitespace-nowrap text-[13px] font-bold text-foreground" data-editor-quota-weekly-metric>{schedule.timesPerWeek} / week</p>
            <p class="mt-0.5 text-[10px] leading-[14px] text-muted">required completions</p>
          </div>
          <div class="rounded-2xl border border-border bg-bg-primary p-2.5">
            <p class="text-[11px] font-bold leading-4 text-foreground" data-editor-quota-weekly-flex>{(schedule.weekdays ?? []).length > 0 ? 'Restricted days' : 'Flexible days'}</p>
            <p class="mt-0.5 text-[10px] leading-[14px] text-muted">{(schedule.weekdays ?? []).length > 0 ? 'only the selected weekdays count' : 'do them anytime in the week'}</p>
          </div>
        </div>
        <div class="rounded-2xl border border-border bg-bg-primary p-3" data-editor-quota-weekly-rule>
          <p class="text-[12px] font-semibold leading-5 text-foreground">The week is on target after {schedule.timesPerWeek} completion{schedule.timesPerWeek === 1 ? '' : 's'}.</p>
          <p class="mt-0.5 text-[11px] leading-4 text-muted">
            {(schedule.weekdays ?? []).length > 0
              ? 'Only the selected weekdays count toward the weekly target.'
              : 'No individual weekday is automatically considered missed.'}
          </p>
        </div>
        <p class="rounded-xl border border-border bg-bg-secondary px-3 py-2 text-[11px] leading-4 text-muted">Useful when consistency matters more than exact timing.</p>
        <div class="space-y-2">
          <p class="text-[10px] font-mono uppercase tracking-[0.18em] text-muted">Optional weekdays</p>
          <div class="grid grid-cols-7 gap-1.5">
            {#each WEEKDAY_ORDER as day (`${day}`)}
              <button
                type="button"
                class={`flex min-h-11 items-center justify-center rounded-xl border px-1 py-1 text-[11px] font-bold transition ${(schedule.weekdays ?? []).includes(day) ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-bg-primary text-muted hover:border-border-hover'}`}
                aria-label={`Toggle ${DAY_FULL_NAMES[day]} for the weekly quota schedule`}
                aria-pressed={(schedule.weekdays ?? []).includes(day)}
                onclick={() => {
                  toggleWeekday(day);
                }}
              >
                {DAY_LABELS[day]}
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
      <div class="space-y-3" data-testid="monthly-quota-view" data-editor-schedule-monthly-quota>
        <div class="space-y-2">
          <p class="text-[10px] font-mono uppercase tracking-[0.18em] text-muted">Completions per month</p>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-bg-primary text-lg text-muted transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Decrease monthly quota"
              disabled={schedule.timesPerMonth <= 1}
              data-editor-quota-decrement="monthly"
              onclick={() => {
                setMonthlyQuota(schedule.timesPerMonth - 1);
              }}
            >
              −
            </button>
            <p
              class="flex h-11 min-w-14 items-center justify-center rounded-xl border border-border bg-bg-primary text-lg font-bold text-foreground"
              aria-live="polite"
              aria-label={`Monthly quota: ${schedule.timesPerMonth} completions per month`}
              data-editor-quota-value="monthly"
            >
              {schedule.timesPerMonth}
            </p>
            <button
              type="button"
              class="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-bg-primary text-lg text-muted transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Increase monthly quota"
              disabled={schedule.timesPerMonth >= 31}
              data-editor-quota-increment="monthly"
              onclick={() => {
                setMonthlyQuota(schedule.timesPerMonth + 1);
              }}
            >
              +
            </button>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div class="rounded-2xl border border-border bg-bg-primary p-2.5">
            <p class="whitespace-nowrap text-[13px] font-bold text-foreground" data-editor-quota-monthly-metric>{schedule.timesPerMonth} / month</p>
            <p class="mt-0.5 text-[10px] leading-[14px] text-muted">monthly target</p>
          </div>
          <div class="rounded-2xl border border-border bg-bg-primary p-2.5">
            <p class="text-[11px] font-bold leading-4 text-foreground" data-editor-quota-monthly-flex>{(schedule.weekdays ?? []).length > 0 ? 'Restricted days' : 'Flexible timing'}</p>
            <p class="mt-0.5 text-[10px] leading-[14px] text-muted">{(schedule.weekdays ?? []).length > 0 ? 'only the selected weekdays count' : 'no fixed days'}</p>
          </div>
        </div>
        <div class="rounded-2xl border border-border bg-bg-primary p-3" data-editor-quota-monthly-rule>
          <p class="text-[12px] font-semibold leading-5 text-foreground">The month is on target after {schedule.timesPerMonth} completion{schedule.timesPerMonth === 1 ? '' : 's'}.</p>
          <p class="mt-0.5 text-[11px] leading-4 text-muted">
            {(schedule.weekdays ?? []).length > 0
              ? 'Only the selected weekdays count toward the monthly target.'
              : 'Progress is measured against the monthly quota rather than calendar-day attendance.'}
          </p>
        </div>
        <div class="space-y-2">
          <p class="text-[10px] font-mono uppercase tracking-[0.18em] text-muted">Optional weekdays</p>
          <div class="grid grid-cols-7 gap-1.5">
            {#each WEEKDAY_ORDER as day (`${day}`)}
              <button
                type="button"
                class={`flex min-h-11 items-center justify-center rounded-xl border px-1 py-1 text-[11px] font-bold transition ${(schedule.weekdays ?? []).includes(day) ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-bg-primary text-muted hover:border-border-hover'}`}
                aria-label={`Toggle ${DAY_FULL_NAMES[day]} for the monthly quota schedule`}
                aria-pressed={(schedule.weekdays ?? []).includes(day)}
                onclick={() => {
                  toggleWeekday(day);
                }}
              >
                {DAY_LABELS[day]}
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
