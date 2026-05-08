<script lang="ts">
  import { describeSchedule, normalizeSchedule, scheduleFromLegacy } from '@habbit-runner/shared';
  import type { HabitFrequency, HabitSchedule, WeekOfMonth } from '@habbit-runner/shared';
  import { ArrowLeft, Plus } from 'lucide-svelte';
  import { calculateScheduledStreak } from '$lib/habits/schedule';
  import type { Habit } from '@/types/habit';
  import type { HabitUpsertInput } from '$lib/stores/habits';
  import { COLORS, DAILY_TARGET_MIN, DAILY_TARGET_MAX, DAY_LABELS, ICONS, SUGGESTED_TAGS } from '$lib/habits/constants';
  import HabitIdentitySection from './habit-form/HabitIdentitySection.svelte';
  import HabitScheduleSection from './habit-form/HabitScheduleSection.svelte';
  import HabitTargetSection from './habit-form/HabitTargetSection.svelte';
  import HabitTagsSection from './habit-form/HabitTagsSection.svelte';
  import HabitReminderSection from './habit-form/HabitReminderSection.svelte';

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
  let initialFormValues = $state<FormValues | null>(null);

  const selectedColor = $derived(COLORS.find((option) => option.value === color) ?? COLORS[0]);
  const showSoftLimitWarning = $derived(
    mode === 'create'
      && !hasAcknowledgedSoftLimit
      && allHabits.length >= 3
      && !allHabits.some((entry) => calculateScheduledStreak(entry, entry.completions).current >= 14)
  );

  const isDirty = $derived(
    initialFormValues
      ? name !== initialFormValues.name
        || description !== initialFormValues.description
        || color !== initialFormValues.color
        || icon !== initialFormValues.icon
        || JSON.stringify(schedule) !== JSON.stringify(initialFormValues.schedule)
        || targetStreak !== initialFormValues.targetStreak
        || dailyTarget !== initialFormValues.dailyTarget
        || type !== initialFormValues.type
        || JSON.stringify(tags) !== JSON.stringify(initialFormValues.tags)
        || reminderTime !== initialFormValues.reminderTime
        || reminderEnabled !== initialFormValues.reminderEnabled
      : false
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
    initialFormValues = { ...values };
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

  function handleBeforeUnload(event: BeforeUnloadEvent) {
    if (isDirty && !isSaving) {
      event.preventDefault();
      return 'You have unsaved changes. Leave anyway?';
    }
  }

  $effect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  });





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

  function normalizeTags(rawTagInput: string, currentTags: string[]): string[] {
    const sanitized = rawTagInput.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!sanitized || currentTags.includes(sanitized) || currentTags.length >= 5) {
      return currentTags;
    }
    return [...currentTags, sanitized];
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

  <form
    onsubmit={(event) => {
      event.preventDefault();
      void handleSubmit();
    }}
    class="min-h-screen bg-transparent"
  >
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
          type="submit"
          class="w-full rounded-full px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-[0.22em] text-bg-primary transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          style={`background-color: ${selectedColor.hex}; box-shadow: 0 0 16px ${selectedColor.hex}40;`}
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

  {#if isDirty}
    <div class="mx-auto max-w-3xl px-4 pb-2 sm:px-6">
      <p class="rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-xs font-mono text-yellow-600" role="status">
        You have unsaved changes
      </p>
    </div>
  {/if}

  <div class="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6">
    <HabitIdentitySection
      bind:name
      bind:description
      bind:color
      bind:icon
      {errors}
      {selectedColor}
      {mode}
    />

    <HabitScheduleSection
      bind:schedule
      bind:dailyTarget
      {selectedColor}
      {errors}
    />

    <HabitTargetSection
      bind:targetStreak
      bind:dailyTarget
      {selectedColor}
    />

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

    <HabitTagsSection
      bind:tags
      bind:tagInput
      {selectedColor}
    />

    <HabitReminderSection
      bind:reminderTime
      bind:reminderEnabled
    />
  </div>
</form>

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
