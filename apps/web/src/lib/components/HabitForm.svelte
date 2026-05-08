<script lang="ts">
  import { describeSchedule, normalizeSchedule, scheduleFromLegacy } from '@habbit-runner/shared';
  import type { HabitFrequency, HabitSchedule, WeekOfMonth } from '@habbit-runner/shared';
  import { ArrowLeft, Plus, X } from 'lucide-svelte';
  import { calculateScheduledStreak } from '$lib/habits/schedule';
  import type { Habit } from '@/types/habit';
  import type { HabitUpsertInput } from '$lib/stores/habits';
  import { COLORS, DAILY_TARGET_MIN, DAILY_TARGET_MAX, DAY_LABELS, ICONS, SUGGESTED_TAGS } from '$lib/habits/constants';

  type Props = {
    mode: 'create' | 'edit';
    habit?: Habit | null;
    allHabits?: Habit[];
    onBack: () => void;
    onSubmit: (payload: HabitUpsertInput) => Promise<void>;
  };

  type FormValues = {
    name: string;
    description: string;
    color: Habit['color'];
    icon: string;
    schedule: HabitSchedule;
    targetStreak: number;
    dailyTarget: number;
    type: Habit['type'];
    tags: string[];
    tagInput: string;
    reminderTime: string;
    reminderEnabled: boolean;
  };

  type LegacyScheduleFields = {
    frequency: HabitFrequency;
    customDays?: number[];
  };

  const DEFAULT_WEEKDAYS = [1, 2, 3, 4, 5];
  const WEEKEND_DAYS = [0, 6];
  const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
  const WEEK_OF_MONTH_OPTIONS: WeekOfMonth[] = [1, 2, 3, 4, 'last'];
  const DEFAULT_TARGET_STREAK = 21;
  const SCHEDULE_TYPE_OPTIONS: { value: HabitSchedule['type']; label: string; desc: string }[] = [
    { value: 'daily', label: 'Daily', desc: 'Every day' },
    { value: 'weekly_days', label: 'Days of week', desc: 'Pick weekdays' },
    { value: 'weekly_quota', label: 'Times per week', desc: 'Hit a weekly quota' },
    { value: 'monthly_weeks', label: 'Monthly weeks', desc: 'Weeks + weekdays' },
    { value: 'monthly_quota', label: 'Times per month', desc: 'Monthly quota' }
  ];

  let { mode, habit = null, allHabits = [], onBack, onSubmit }: Props = $props();

  let hydratedKey = $state('');
  let isSaving = $state(false);
  let saveError = $state<string | null>(null);
  let hasAcknowledgedSoftLimit = $state(false);
  let errors = $state<Record<string, string>>({});
  let name = $state('');
  let description = $state('');
  let color = $state<Habit['color']>('blue');
  let icon = $state('⚡');
  let schedule = $state<HabitSchedule>({ type: 'daily' });
  let targetStreak = $state(DEFAULT_TARGET_STREAK);
  let dailyTarget = $state(1);
  let type = $state<Habit['type']>('positive');
  let tags = $state<string[]>([]);
  let tagInput = $state('');
  let reminderTime = $state('');
  let reminderEnabled = $state(true);

  const selectedColor = $derived(COLORS.find((option) => option.value === color) ?? COLORS[0]);
  const showSoftLimitWarning = $derived(
    mode === 'create'
      && !hasAcknowledgedSoftLimit
      && allHabits.length >= 3
      && !allHabits.some((entry) => calculateScheduledStreak(entry, entry.completions).current >= 14)
  );

  function sortWeekdays(days: number[]): number[] {
    return [...days].sort((left, right) => WEEKDAY_ORDER.indexOf(left) - WEEKDAY_ORDER.indexOf(right));
  }

  function arraysEqual(left: number[], right: number[]): boolean {
    if (left.length !== right.length) {
      return false;
    }

    return left.every((value, index) => value === right[index]);
  }

  function toggleArray<T>(items: T[], value: T): T[] {
    if (items.includes(value)) {
      return items.filter((item) => item !== value);
    }

    return [...items, value];
  }

  function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, Math.trunc(value)));
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

  function createScheduleForType(nextType: HabitSchedule['type'], current: HabitSchedule): HabitSchedule {
    switch (nextType) {
      case 'daily':
        return { type: 'daily' };
      case 'weekly_days':
        return {
          type: 'weekly_days',
          weekdays: current.type === 'weekly_days' ? current.weekdays : DEFAULT_WEEKDAYS
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
            : getWeekdaysFromSchedule(current) ?? DEFAULT_WEEKDAYS
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

  function buildInitialValues(source: Habit | null): FormValues {
    return {
      name: source?.name ?? '',
      description: source?.description ?? '',
      color: source?.color ?? 'blue',
      icon: source?.icon ?? '⚡',
      schedule: normalizeSchedule(source?.schedule) ?? scheduleFromLegacy(source?.frequency ?? 'daily', source?.customDays),
      targetStreak: source?.targetStreak ?? DEFAULT_TARGET_STREAK,
      dailyTarget: source?.dailyTarget ?? 1,
      type: source?.type ?? 'positive',
      tags: source?.tags ?? [],
      tagInput: '',
      reminderTime: source?.reminderTime ?? '',
      reminderEnabled: source?.reminderEnabled ?? true
    };
  }

  function hydrateForm(values: FormValues) {
    name = values.name;
    description = values.description;
    color = values.color;
    icon = values.icon;
    schedule = values.schedule;
    targetStreak = values.targetStreak;
    dailyTarget = values.dailyTarget;
    type = values.type;
    tags = values.tags;
    tagInput = values.tagInput;
    reminderTime = values.reminderTime;
    reminderEnabled = values.reminderEnabled;
    errors = {};
  }

  $effect(() => {
    const nextKey = `${mode}:${habit?.id ?? 'new'}`;
    if (hydratedKey === nextKey) {
      return;
    }

    hydratedKey = nextKey;
    hasAcknowledgedSoftLimit = false;
    hydrateForm(buildInitialValues(habit));
  });

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
      timesPerWeek: clamp(value, 1, 7)
    };
  }

  function setMonthlyQuota(value: number) {
    if (schedule.type !== 'monthly_quota') {
      return;
    }

    schedule = {
      ...schedule,
      timesPerMonth: clamp(value, 1, 31)
    };
  }

  function handleCustomIconInput(event: Event) {
    const value = (event.currentTarget as HTMLInputElement).value;
    // Use the entire input value as the custom icon.
    // The input is meant for a single emoji, so we take the whole value.
    // Modern browsers insert the full emoji (including variation selectors)
    // when using the OS emoji picker, so this handles multi-code-point
    // emojis like ✍️ (U+270D + U+FE0F) correctly.
    icon = value;
  }

  function addTag(rawTag: string) {
    const sanitized = rawTag.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!sanitized || tags.includes(sanitized) || tags.length >= 5) {
      tagInput = '';
      return;
    }

    tags = [...tags, sanitized];
    tagInput = '';
  }

  function removeTag(tag: string) {
    tags = tags.filter((item) => item !== tag);
  }

  function normalizeTags(rawTagInput: string, currentTags: string[]): string[] {
    const sanitized = rawTagInput.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!sanitized || currentTags.includes(sanitized) || currentTags.length >= 5) {
      return currentTags;
    }

    return [...currentTags, sanitized];
  }

  function buildLegacyScheduleFields(current: HabitSchedule): LegacyScheduleFields {
    if (current.type === 'daily') {
      return { frequency: 'daily' };
    }

    const weekdays = sortWeekdays(getWeekdaysFromSchedule(current) ?? []);

    if (current.type === 'weekly_days') {
      if (arraysEqual(weekdays, DEFAULT_WEEKDAYS)) {
        return { frequency: 'weekdays' };
      }

      if (arraysEqual(weekdays, WEEKEND_DAYS)) {
        return { frequency: 'weekends' };
      }

      return {
        frequency: 'custom',
        ...(weekdays.length > 0 ? { customDays: weekdays } : {})
      };
    }

    return {
      frequency: 'custom',
      ...(weekdays.length > 0 ? { customDays: weekdays } : {})
    };
  }

  function validate(): Record<string, string> {
    const nextErrors: Record<string, string> = {};

    if (!name.trim()) {
      nextErrors.name = 'Name is required';
    } else if (name.trim().length > 40) {
      nextErrors.name = 'Max 40 characters';
    }

    if (schedule.type === 'weekly_days' && schedule.weekdays.length === 0) {
      nextErrors.schedule = 'Select at least one weekday';
    }

    if (schedule.type === 'monthly_weeks' && schedule.weeksOfMonth.length === 0) {
      nextErrors.scheduleWeeks = 'Select at least one week';
    }

    if (schedule.type === 'monthly_weeks' && schedule.weekdays.length === 0) {
      nextErrors.scheduleWeekdays = 'Select at least one weekday';
    }

    return nextErrors;
  }

  async function handleSubmit() {
    const nextErrors = validate();
    errors = nextErrors;
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    isSaving = true;
    saveError = null;
    try {
      const normalizedTags = normalizeTags(tagInput, tags);
      const legacyScheduleFields = buildLegacyScheduleFields(schedule);

      await onSubmit(
        $state.snapshot({
          name: name.trim(),
          description: description.trim(),
          color,
          icon,
          tags: normalizedTags,
          frequency: legacyScheduleFields.frequency,
          ...(legacyScheduleFields.customDays ? { customDays: legacyScheduleFields.customDays } : {}),
          targetStreak,
          dailyTarget: Math.max(1, Math.trunc(dailyTarget)),
          type,
          archived: habit?.archived ?? false,
          schedule,
          ...(reminderTime ? { reminderTime } : {}),
          reminderEnabled,
          freezeDays: habit?.freezeDays ?? [],
          sortOrder: habit?.sortOrder ?? 0
        }) as HabitUpsertInput
      );
    } catch (err) {
      saveError = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
    } finally {
      isSaving = false;
    }
  }
</script>

<div class="min-h-screen bg-transparent">
  {#if showSoftLimitWarning}
    <div class="fixed inset-0 z-[100] flex items-center justify-center bg-bg-primary/80 p-4 backdrop-blur-sm">
      <div class="w-full max-w-sm rounded-3xl border border-border bg-bg-secondary p-6 shadow-2xl">
        <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10">
          <Plus class="text-accent" size={24} />
        </div>
        <h3 class="mb-2 text-xl font-bold text-foreground">Focus is key</h3>
        <p class="mb-6 text-sm leading-relaxed text-muted">
          Research shows that starting with more than 3 habits simultaneously reduces the success rate by 80%.
          <br /><br />
          We recommend reaching a <span class="font-bold text-accent">14-day streak</span> with your current habits before adding more.
        </p>
        <div class="flex flex-col gap-2">
          <button
            type="button"
            class="w-full rounded-2xl border border-border bg-bg-primary py-3 text-sm font-semibold transition hover:bg-bg-card"
            onclick={onBack}
          >
            Go back & focus
          </button>
          <button
            type="button"
            class="w-full rounded-2xl py-3 text-[10px] font-mono uppercase tracking-widest text-muted transition hover:text-foreground"
            onclick={() => {
              hasAcknowledgedSoftLimit = true;
            }}
          >
            I understand, add anyway
          </button>
        </div>
      </div>
    </div>
  {/if}

  <div
    class="sticky top-0 z-10 bg-transparent px-4 pt-4 sm:px-6"
    style="top: var(--safe-area-inset-top, 0px); padding-top: calc(var(--safe-area-inset-top, 0px) + 1rem); padding-bottom: 1rem;"
  >
    <div class="mx-auto flex max-w-3xl flex-col items-stretch gap-3 rounded-[1.75rem] border border-border bg-bg-secondary/90 px-4 py-4 shadow-[0_24px_60px_rgba(15,23,42,0.1)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="text-muted transition-colors hover:text-foreground"
          onclick={onBack}
          aria-label="Back"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 class="text-base font-semibold text-foreground">{mode === 'edit' ? 'Edit Habit' : 'New Habit'}</h1>
      </div>

      <button
        type="button"
        class="w-full rounded-full px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-[0.22em] text-bg-primary transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        style={`background-color: ${selectedColor.hex}; box-shadow: 0 0 16px ${selectedColor.hex}40;`}
        onclick={() => {
          void handleSubmit();
        }}
        disabled={isSaving}
      >
        {isSaving ? 'Saving…' : mode === 'edit' ? 'Save' : 'Create'}
      </button>
    </div>
  </div>

  {#if saveError}
    <div class="mx-auto max-w-3xl px-4 pb-2 sm:px-6">
      <p class="rounded-lg border border-accent-secondary/40 bg-accent-secondary/10 px-3 py-2 text-xs font-mono text-accent-secondary" role="alert">
        {saveError}
      </p>
    </div>
  {/if}

  <div class="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6">
    <div class="grid gap-5 rounded-[1.75rem] border border-border bg-bg-card/92 p-5 shadow-[0_20px_54px_rgba(15,23,42,0.08)] lg:grid-cols-[0.72fr,1.28fr]">
      <div class="flex-shrink-0">
        <p class="mb-2 block text-[10px] font-mono uppercase tracking-wider text-muted">Icon</p>
        <div class="grid grid-cols-5 gap-1 rounded-lg border border-border bg-bg-secondary p-2">
          {#each ICONS as option, iconIndex (`${option}-${iconIndex}`)}
            <button
              type="button"
              class={`flex h-11 w-11 items-center justify-center rounded-xl text-base transition-all ${icon === option ? 'bg-border ring-1' : 'hover:bg-border'}`}
              style={icon === option ? `box-shadow: 0 0 0 1px ${selectedColor.hex};` : ''}
              aria-label={`Use ${option} as habit icon`}
              title={`Use ${option} as habit icon`}
              onclick={() => {
                icon = option;
              }}
            >
              {option}
            </button>
          {/each}
        </div>
        <div class="mt-2">
          <input
            type="text"
            value={ICONS.includes(icon) ? '' : icon}
            placeholder="Own..."
            class="w-full rounded-lg border border-border bg-bg-secondary px-2 py-2.5 text-center text-xs font-mono placeholder:text-[10px] focus:border-accent/50 focus:outline-none"
            style={!ICONS.includes(icon) && icon ? `border-color: ${selectedColor.hex}; box-shadow: 0 0 8px ${selectedColor.hex}40;` : ''}
            oninput={handleCustomIconInput}
          />
        </div>
      </div>

      <div class="flex-1 space-y-3">
        <div>
          <label class="mb-2 block text-[10px] font-mono uppercase tracking-wider text-muted" for="habit-name">Name *</label>
          <input
            id="habit-name"
            type="text"
            bind:value={name}
            maxlength="40"
            placeholder="e.g. Deep Work"
            class="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-sm font-medium text-foreground placeholder-border-hover transition-all focus:border-accent/50 focus:outline-none focus:shadow-[0_0_12px_var(--glow)]"
            style={errors.name ? 'border-color: var(--accent-secondary);' : ''}
          />
          {#if errors.name}
            <p class="mt-1 text-[10px] font-mono text-accent-secondary">{errors.name}</p>
          {/if}
        </div>

        <div>
          <label class="mb-2 block text-[10px] font-mono uppercase tracking-wider text-muted" for="habit-description">Description <span class="text-border-hover">(supports Markdown)</span></label>
          <textarea
            id="habit-description"
            bind:value={description}
            maxlength="400"
            rows="6"
            placeholder="Brief description... (supports **bold**, *italic*, lists, etc.)"
            class="w-full resize-none overflow-y-auto rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-sm text-foreground placeholder-border-hover transition-all focus:border-accent/50 focus:outline-none focus:shadow-[0_0_12px_var(--glow)]"
          ></textarea>
        </div>
      </div>
    </div>

    <div class="rounded-[1.75rem] border border-border bg-bg-card/92 p-5 shadow-[0_20px_54px_rgba(15,23,42,0.08)]">
      <p class="mb-2 block text-[10px] font-mono uppercase tracking-wider text-muted">Color</p>
      <div class="flex gap-2">
        {#each COLORS as option, colorIndex (`${option.value}-${colorIndex}`)}
          <button
            type="button"
            class="flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all duration-200"
            style={`background-color: ${option.hex}20; border-color: ${color === option.value ? option.hex : 'transparent'}; box-shadow: ${color === option.value ? `0 0 12px ${option.hex}60` : 'none'};`}
            title={option.label}
            aria-label={`Select ${option.label} color`}
            onclick={() => {
              color = option.value;
            }}
          >
            <div class="h-3 w-3 rounded-full" style={`background-color: ${option.hex};`}></div>
          </button>
        {/each}
      </div>
    </div>

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
                class="w-16 rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm font-mono focus:border-accent/60 focus:outline-none"
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
                class="w-20 rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm font-mono focus:border-accent/60 focus:outline-none"
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

    <div class="rounded-[1.75rem] border border-border bg-bg-card/92 p-5 shadow-[0_20px_54px_rgba(15,23,42,0.08)]">
      <p class="mb-2 block text-[10px] font-mono uppercase tracking-wider text-muted">Habit Type</p>
      <div class="flex flex-col gap-2 rounded-xl border border-border bg-bg-secondary p-1 sm:flex-row">
        <button
          type="button"
          class={`flex-1 rounded-lg py-2.5 text-xs font-semibold transition-all duration-200 ${type === 'positive' ? 'bg-bg-primary text-foreground shadow-sm' : 'text-muted hover:text-foreground'}`}
          style={type === 'positive' ? `border-left: 2px solid ${selectedColor.hex};` : ''}
          onclick={() => {
            type = 'positive';
          }}
        >
          I want to <span class="text-accent" style={`color: ${selectedColor.hex};`}>DO</span> this
        </button>
        <button
          type="button"
          class={`flex-1 rounded-lg py-2.5 text-xs font-semibold transition-all duration-200 ${type === 'negative' ? 'bg-bg-primary text-foreground shadow-sm' : 'text-muted hover:text-foreground'}`}
          style={type === 'negative' ? `border-left: 2px solid ${selectedColor.hex};` : ''}
          onclick={() => {
            type = 'negative';
          }}
        >
          I want to <span class="text-red-500">STOP</span> this
        </button>
      </div>
    </div>

    <div class="rounded-[1.75rem] border border-border bg-bg-card/92 p-5 shadow-[0_20px_54px_rgba(15,23,42,0.08)]">
      <p class="mb-2 block text-[10px] font-mono uppercase tracking-wider text-muted">
        Tags <span class="text-border-hover">({tags.length}/5)</span>
      </p>

      <div class="mb-2 flex flex-wrap gap-1.5">
        {#each tags as tag, tagIndex (`${tag}-${tagIndex}`)}
          <span
            class="flex items-center gap-1 rounded border px-2 py-1 text-[10px] font-mono"
            style={`color: ${selectedColor.hex}; border-color: ${selectedColor.hex}40; background-color: ${selectedColor.hex}10;`}
          >
            #{tag}
            <button
              type="button"
              class="opacity-60 transition-opacity hover:opacity-100"
              onclick={() => {
                removeTag(tag);
              }}
              aria-label={`Remove ${tag}`}
            >
              <X size={9} />
            </button>
          </span>
        {/each}
      </div>

      <div class="flex gap-2">
        <input
          type="text"
          bind:value={tagInput}
          placeholder="Add tag..."
          maxlength="20"
          disabled={tags.length >= 5}
          class="flex-1 rounded-lg border border-border bg-bg-secondary px-3 py-2 text-xs font-mono text-foreground placeholder-border-hover transition-all focus:border-accent/50 focus:outline-none disabled:opacity-40"
          onkeydown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault();
              addTag(tagInput);
            }
          }}
        />
        <button
          type="button"
          class="min-h-11 min-w-11 rounded-lg border border-border px-3 py-2 text-muted transition-colors hover:border-border-hover hover:text-foreground disabled:opacity-40"
          onclick={() => {
            addTag(tagInput);
          }}
          disabled={!tagInput.trim() || tags.length >= 5}
        >
          <Plus size={13} />
        </button>
      </div>

      <div class="mt-2 flex flex-wrap gap-1.5">
        {#each SUGGESTED_TAGS.filter((tag) => !tags.includes(tag)).slice(0, 6) as tag, suggestedTagIndex (`${tag}-${suggestedTagIndex}`)}
          <button
            type="button"
            class="rounded border border-border px-2 py-0.5 text-[9px] font-mono text-muted transition-colors hover:border-border-hover hover:text-foreground disabled:opacity-40"
            onclick={() => {
              addTag(tag);
            }}
            disabled={tags.length >= 5}
          >
            +{tag}
          </button>
        {/each}
      </div>
    </div>

    <div class="rounded-[1.75rem] border border-border bg-bg-card/92 p-5 shadow-[0_20px_54px_rgba(15,23,42,0.08)]">
      <label class="mb-2 block text-[10px] font-mono uppercase tracking-wider text-muted" for="habit-reminder">Reminder</label>
      <div class="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          id="habit-reminder"
          type="time"
          bind:value={reminderTime}
          class="min-h-11 rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm font-mono transition focus:border-accent/60 focus:outline-none focus:shadow-[0_0_12px_var(--glow)]"
        />
        <button
          type="button"
          class={`min-h-11 rounded-lg border px-3 py-2 text-[9px] font-mono uppercase tracking-wider transition ${reminderEnabled ? 'border-accent/40 bg-accent/10 text-accent' : 'border-border bg-bg-secondary text-muted hover:border-border-hover'}`}
          onclick={() => {
            reminderEnabled = !reminderEnabled;
          }}
        >
          {reminderEnabled ? 'Reminders enabled' : 'Reminders disabled'}
        </button>
        <span class="text-[11px] font-mono text-muted">{reminderTime ? `Daily at ${reminderTime}` : 'No reminder yet'}</span>
      </div>
      <p class="mt-1 text-[9px] font-mono text-muted">
        {reminderEnabled
          ? 'Reminder calls appear on the dashboard when the app is open.'
          : 'Notifications are disabled. Enable them to receive reminders.'}
      </p>
    </div>
  </div>
</div>

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
