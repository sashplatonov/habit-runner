<script lang="ts">
  import type { HabitSchedule, WeekOfMonth } from '@habbit-runner/shared';
  import { DAY_LABELS, SCHEDULE_TYPE_OPTIONS, DAILY_TARGET_MIN, DAILY_TARGET_MAX } from '$lib/habits/constants';
  import type { FormValues } from '../HabitForm.svelte';

  const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
  const WEEK_OF_MONTH_OPTIONS: WeekOfMonth[] = [1, 2, 3, 4, 'last'];

  let {
    schedule = $bindable<HabitSchedule>({ type: 'daily' }),
    dailyTarget = $bindable(1),
    selectedColor,
    errors = {}
  }: {
    schedule: HabitSchedule;
    dailyTarget: number;
    selectedColor: { hex: string };
    errors: Record<string, string>;
  } = $props();

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

  function describeSchedule(schedule: HabitSchedule): string {
    switch (schedule.type) {
      case 'daily':
        return 'Every day';
      case 'weekly_days':
        return `On ${schedule.weekdays.map(d => DAY_LABELS[d]).join(', ')}`;
      case 'weekly_quota':
        return `${schedule.timesPerWeek} times per week${schedule.weekdays?.length ? ' on ' + schedule.weekdays.map(d => DAY_LABELS[d]).join(', ') : ''}`;
      case 'monthly_weeks':
        return `Weeks ${schedule.weeksOfMonth.join(', ')} on ${schedule.weekdays.map(d => DAY_LABELS[d]).join(', ')}`;
      case 'monthly_quota':
        return `${schedule.timesPerMonth} times per month${schedule.weekdays?.length ? ' on ' + schedule.weekdays.map(d => DAY_LABELS[d]).join(', ') : ''}`;
      default:
        return '';
    }
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

<div class="rounded-[1.75rem] border border-border bg-bg-card/92 p-5 shadow-[0_20px_54px_rgba(15,23,42,0.08)]">
  <p class="mb-2 block text-[10px] font-mono uppercase tracking-wider text-muted">Schedule</p>
  <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
    {#each SCHEDULE_TYPE_OPTIONS as option, scheduleIndex (`${option.value}-${scheduleIndex}`)}
      <button
        type="button"
        class={`rounded-lg border px-3 py-3 text-left text-xs font-mono transition ${schedule.type === option.value ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:border-border-hover'}`}
        onclick={() => {
          schedule = createScheduleForType(option.value, schedule);
        }}
      >
        <div class="font-semibold uppercase tracking-[0.2em]">{option.label}</div>
        <div class="text-[9px] text-muted">{option.desc}</div>
      </button>
    {/each}
  </div>

  <div class="mt-3 space-y-3">
    {#if schedule.type === 'weekly_days'}
      <div class="space-y-2">
        <div class="flex gap-1">
          {#each DAY_LABELS as day, index (`${day}-${index}`)}
            <button
              type="button"
              class={`flex min-h-11 flex-1 items-center justify-center rounded-lg border px-2 py-1 text-xs font-mono transition ${schedule.weekdays.includes(index) ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:border-border-hover'}`}
              aria-label={`Toggle ${day} for the schedule`}
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

    {#if schedule.type === 'weekly_quota'}
      <div class="space-y-3">
        <div class="flex items-center gap-3">
          <input
            type="number"
            min="1"
            max="7"
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

    {#if schedule.type === 'monthly_weeks'}
      <div class="space-y-3">
        <div class="space-y-2">
          <p class="text-[11px] font-mono uppercase tracking-[0.3em] text-muted">Weeks</p>
          <div class="flex flex-wrap gap-1">
            {#each WEEK_OF_MONTH_OPTIONS as week, weekIndex (`${week}-${weekIndex}`)}
              <button
                type="button"
                class={`rounded-full border px-3 py-2 text-[10px] font-mono transition ${schedule.weeksOfMonth.includes(week) ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:border-border-hover'}`}
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

    {#if schedule.type === 'monthly_quota'}
      <div class="space-y-3">
        <div class="flex items-center gap-3">
          <input
            type="number"
            min="1"
            max="31"
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

  <p class="mt-2 text-[11px] font-mono text-muted">{describeSchedule(schedule)}</p>
</div>

{#if schedule.type === 'daily'}
<div class="rounded-[1.75rem] border border-border bg-bg-card/92 p-4 shadow-[0_20px_54px_rgba(15,23,42,0.08)]">
  <p class="mb-1 block text-[10px] font-mono uppercase tracking-wider text-muted">Daily target</p>
  <div class="flex items-center gap-3">
    <div class="relative flex-1 py-1">
      <div
        class="slider-track absolute left-0 right-0 top-1/2 h-3 -translate-y-1/2 rounded-full opacity-40 transition-all duration-300"
        style="background: {selectedColor.hex};"
      ></div>
      <div
        class="slider-progress absolute left-0 top-1/2 h-3 -translate-y-1/2 rounded-full shadow-lg transition-all duration-300"
        style="background: linear-gradient(90deg, {selectedColor.hex}80, {selectedColor.hex}); width: {((dailyTarget - DAILY_TARGET_MIN) / (DAILY_TARGET_MAX - DAILY_TARGET_MIN)) * 100}%; box-shadow: 0 0 12px {selectedColor.hex}60;"
      ></div>
      <input
        type="range"
        min={DAILY_TARGET_MIN}
        max={DAILY_TARGET_MAX}
        bind:value={dailyTarget}
        class="slider-input relative z-10 w-full cursor-pointer appearance-none bg-transparent"
      />
      <div class="mt-2 flex justify-between px-0.5">
        {#each Array(DAILY_TARGET_MAX - DAILY_TARGET_MIN + 1) as _, i (DAILY_TARGET_MIN + i)}
          <div class="relative flex flex-col items-center">
            <div
              class="mb-0.5 h-1 w-1 rounded-full transition-all duration-300"
              style="background: {dailyTarget >= DAILY_TARGET_MIN + i ? selectedColor.hex : 'var(--border)'}; box-shadow: {dailyTarget >= DAILY_TARGET_MIN + i ? '0 0 4px ' + selectedColor.hex + '80' : 'none'};"
            ></div>
            <span
              class="text-[8px] font-mono transition-all duration-300"
              style="color: {dailyTarget === DAILY_TARGET_MIN + i ? selectedColor.hex : 'var(--text-muted)'}; font-weight: {dailyTarget === DAILY_TARGET_MIN + i ? 'bold' : 'normal'}; transform: {dailyTarget === DAILY_TARGET_MIN + i ? 'scale(1.2)' : 'scale(1)'};"
            >
              {DAILY_TARGET_MIN + i}
            </span>
          </div>
        {/each}
      </div>
    </div>
    <div
      class="flex min-w-[60px] flex-col items-center rounded-lg border-2 px-2 py-1 transition-all duration-300"
      style="border-color: {selectedColor.hex}80; background: {selectedColor.hex}10;"
    >
      <span class="text-[8px] font-mono uppercase tracking-wider" style="color: {selectedColor.hex};">target</span>
      <span class="text-base font-bold font-mono" style="color: {selectedColor.hex};">{dailyTarget}x</span>
    </div>
  </div>
</div>
{/if}

<style>
  .slider-input {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 32px;
    background: transparent;
    outline: none;
    cursor: pointer;
    margin: 0;
  }

  .slider-track {
    pointer-events: none;
    opacity: 0.4;
  }

  .slider-progress {
    pointer-events: none;
  }

  .slider-input::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--bg-card, #0f172a);
    cursor: pointer;
    border: 3px solid var(--accent, #00d4ff);
    box-shadow: 0 0 0 4px rgba(0, 212, 255, 0.3), 0 4px 12px rgba(0, 0, 0, 0.4);
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.3s ease;
    margin-top: -4px;
  }

  .slider-input::-webkit-slider-thumb:hover {
    transform: scale(1.25);
    box-shadow: 0 0 0 6px rgba(0, 212, 255, 0.4), 0 6px 16px rgba(0, 0, 0, 0.5);
  }

  .slider-input::-moz-range-thumb {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--bg-card, #0f172a);
    cursor: pointer;
    border: 3px solid var(--accent, #00d4ff);
    box-shadow: 0 0 0 4px rgba(0, 212, 255, 0.3), 0 4px 12px rgba(0, 0, 0, 0.4);
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.3s ease;
  }

  .slider-input::-moz-range-thumb:hover {
    transform: scale(1.25);
    box-shadow: 0 0 0 6px rgba(0, 212, 255, 0.4), 0 6px 16px rgba(0, 0, 0, 0.5);
  }

  .slider-input::-moz-range-track {
    background: transparent;
    border: none;
  }
</style>
