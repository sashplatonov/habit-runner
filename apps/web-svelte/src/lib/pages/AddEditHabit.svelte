<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { ArrowLeft, Plus, X } from 'lucide-svelte';
  import { habitsStore, addHabit, updateHabit } from '$lib/stores/habitsStore';
  import type { HabitUpsertInput } from '$lib/stores/habitsStore';
  import { COLORS, ICONS, DAY_LABELS, DAILY_TARGET_OPTIONS, SUGGESTED_TAGS } from '$lib/constants/addEditHabit';
  import { calculateScheduledStreak } from '$lib/habits/schedule';
  import { normalizeSchedule, scheduleFromLegacy, describeSchedule } from '@habbit-runner/shared';
  import type { HabitColor, HabitFrequency, HabitSchedule, WeekOfMonth } from '@habbit-runner/shared';
  import type { Habit } from '$lib/types/habit';

  // Route
  const habitId = $derived($page.params.id);
  const isEdit = $derived(Boolean(habitId));
  const allHabits = $derived($habitsStore);
  const existing = $derived(habitId ? allHabits.find((h) => h.id === habitId) : undefined);

  // Soft limit check
  let hasAcknowledgedLimit = $state(false);
  const isOverLimit = $derived(!isEdit && allHabits.length >= 3 && !allHabits.some(h => calculateScheduledStreak(h, h.completions).current >= 14));
  const showSoftLimitWarning = $derived(isOverLimit && !hasAcknowledgedLimit);

  // Loading state for edit mode
  const shouldShowLoading = $derived(isEdit && !existing);

  // -- Form state --
  const TARGET_STREAK_OPTIONS = [7, 14, 21, 30, 60, 90, 180, 365];
  const DEFAULT_WEEKDAYS = [1, 2, 3, 4, 5];
  const SCHEDULE_TYPE_OPTIONS: { value: HabitSchedule['type']; label: string; desc: string }[] = [
    { value: 'daily', label: 'Daily', desc: 'Every day' },
    { value: 'weekly_days', label: 'Days of week', desc: 'Pick weekdays' },
    { value: 'weekly_quota', label: 'Times per week', desc: 'Hit a weekly quota' },
    { value: 'monthly_weeks', label: 'Monthly weeks', desc: 'Weeks + weekdays' },
    { value: 'monthly_quota', label: 'Times per month', desc: 'Monthly quota' }
  ];
  const WEEK_OF_MONTH_OPTIONS: WeekOfMonth[] = [1, 2, 3, 4, 'last'];

  let name = $state('');
  let description = $state('');
  let color = $state<HabitColor>('blue');
  let icon = $state('⚡');
  let frequency = $state<HabitFrequency>('daily');
  let customDays = $state<number[]>([1, 2, 3, 4, 5]);
  let schedule = $state<HabitSchedule>({ type: 'daily' });
  let targetStreak = $state(21);
  let dailyTarget = $state(1);
  let type = $state<'positive' | 'negative'>('positive');
  let tags = $state<string[]>([]);
  let tagInput = $state('');
  let reminderTime = $state('');
  let reminderEnabled = $state(true);
  let errors = $state<Record<string, string>>({});

  // Initialize form from existing habit when editing
  let lastExistingId = $state<string | undefined>(undefined);
  $effect(() => {
    if (isEdit && existing && existing.id !== lastExistingId) {
      lastExistingId = existing.id;
      name = existing.name;
      description = existing.description ?? '';
      color = existing.color;
      icon = existing.icon;
      frequency = existing.frequency;
      customDays = existing.customDays ?? [1, 2, 3, 4, 5];
      schedule = normalizeSchedule(existing.schedule) ?? scheduleFromLegacy(existing.frequency, existing.customDays);
      targetStreak = getClosestStreakTick(existing.targetStreak);
      dailyTarget = existing.dailyTarget ?? 1;
      type = existing.type || 'positive';
      tags = existing.tags ?? [];
      tagInput = '';
      reminderTime = existing.reminderTime ?? '';
      reminderEnabled = existing.reminderEnabled ?? true;
    }
  });

  const selectedColor = $derived(COLORS.find((c) => c.value === color) ?? COLORS[0]);

  // Schedule helpers
  const activeWeekdays = $derived(
    schedule.type === 'weekly_days' || schedule.type === 'monthly_weeks'
      ? schedule.weekdays
      : schedule.type === 'weekly_quota' || schedule.type === 'monthly_quota'
        ? schedule.weekdays ?? []
        : []
  );

  function toggleArray<T>(array: T[], value: T): T[] {
    return array.includes(value) ? array.filter((i) => i !== value) : [...array, value];
  }

  function createScheduleForType(target: HabitSchedule['type'], current: HabitSchedule): HabitSchedule {
    const weeksFromCurrent = (): number[] | undefined => {
      if (current.type === 'weekly_quota' || current.type === 'weekly_days' || current.type === 'monthly_weeks' || current.type === 'monthly_quota') {
        return current.weekdays;
      }
      return undefined;
    };
    const builders: Record<HabitSchedule['type'], () => HabitSchedule> = {
      daily: () => ({ type: 'daily' }),
      weekly_days: () => ({ type: 'weekly_days', weekdays: current.type === 'weekly_days' ? current.weekdays : DEFAULT_WEEKDAYS }),
      weekly_quota: () => ({ type: 'weekly_quota', timesPerWeek: current.type === 'weekly_quota' ? current.timesPerWeek : 2, weekdays: weeksFromCurrent() }),
      monthly_weeks: () => ({ type: 'monthly_weeks', weeksOfMonth: current.type === 'monthly_weeks' ? current.weeksOfMonth : [1], weekdays: current.type === 'monthly_weeks' ? current.weekdays : DEFAULT_WEEKDAYS }),
      monthly_quota: () => ({ type: 'monthly_quota', timesPerMonth: current.type === 'monthly_quota' ? current.timesPerMonth : 3, weekdays: weeksFromCurrent() })
    };
    return builders[target]();
  }

  function toggleWeekday(day: number) {
    if (schedule.type === 'weekly_days' || schedule.type === 'monthly_weeks') {
      schedule = { ...schedule, weekdays: toggleArray(schedule.weekdays, day) };
    } else if (schedule.type === 'weekly_quota' || schedule.type === 'monthly_quota') {
      schedule = { ...schedule, weekdays: toggleArray(schedule.weekdays ?? [], day) };
    }
  }

  function toggleWeekOfMonth(week: WeekOfMonth) {
    if (schedule.type === 'monthly_weeks') {
      schedule = { ...schedule, weeksOfMonth: toggleArray(schedule.weeksOfMonth, week) };
    }
  }

  function setWeekQuota(value: number) {
    if (schedule.type === 'weekly_quota') {
      schedule = { ...schedule, timesPerWeek: Math.max(1, Math.min(7, Math.trunc(value))) };
    }
  }

  function setMonthQuota(value: number) {
    if (schedule.type === 'monthly_quota') {
      schedule = { ...schedule, timesPerMonth: Math.max(1, Math.min(31, Math.trunc(value))) };
    }
  }

  // Tag handlers
  function handleAddTag(tag: string) {
    const sanitized = tag.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (sanitized && !tags.includes(sanitized) && tags.length < 5) {
      tags = [...tags, sanitized];
    }
    tagInput = '';
  }

  function handleRemoveTag(tag: string) {
    tags = tags.filter((t) => t !== tag);
  }

  // Validation
  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (name.length > 40) e.name = 'Max 40 characters';
    if (frequency === 'custom' && customDays.length === 0) e.customDays = 'Select at least one day';
    return e;
  }

  // Submit
  async function handleSubmit() {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      errors = validationErrors;
      return;
    }
    // Absorb pending tag input
    const normalizedTagInput = tagInput.toLowerCase().replace(/[^a-z0-9]/g, '');
    const finalTags = normalizedTagInput && !tags.includes(normalizedTagInput) && tags.length < 5
      ? [...tags, normalizedTagInput] : tags;

    const payload: HabitUpsertInput = {
      name: name.trim(),
      description: description.trim(),
      color,
      icon,
      tags: finalTags,
      frequency,
      customDays: frequency === 'custom' ? customDays : undefined,
      targetStreak,
      dailyTarget: Math.max(1, Math.trunc(dailyTarget)),
      type,
      archived: existing?.archived ?? false,
      schedule: schedule ?? scheduleFromLegacy(frequency, customDays),
      reminderTime: reminderTime || undefined,
      reminderEnabled,
      freezeDays: existing?.freezeDays ?? [],
      sortOrder: existing?.sortOrder ?? 0
    };

    if (isEdit && habitId) {
      await updateHabit(habitId, payload);
      void goto(`/habit/${habitId}`);
    } else {
      const newId = await addHabit(payload);
      void goto(`/habit/${newId}`);
    }
  }

  function handleBack() {
    const destination = isEdit && habitId ? `/habit/${habitId}` : '/';
    void goto(destination);
  }

  function getClosestStreakTick(value: number): number {
    return TARGET_STREAK_OPTIONS.reduce((closest, option) =>
      Math.abs(option - value) < Math.abs(closest - value) ? option : closest
    , TARGET_STREAK_OPTIONS[0]);
  }
</script>

{#if shouldShowLoading}
  <div class="min-h-screen bg-bg-primary">
    <div class="max-w-lg mx-auto px-4 py-12 text-center text-sm font-mono text-muted" role="status" aria-live="polite">
      Loading habit...
    </div>
  </div>
{:else if showSoftLimitWarning}
  <!-- Soft limit warning modal -->
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-bg-primary/80 backdrop-blur-sm">
    <div class="w-full max-w-sm bg-bg-secondary border border-border rounded-3xl p-6 shadow-2xl">
      <div class="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
        <Plus class="text-accent" size={24} />
      </div>
      <h3 class="text-xl font-bold text-foreground mb-2">Focus is key</h3>
      <p class="text-sm text-muted mb-6 leading-relaxed">
        Research shows that starting with more than 3 habits simultaneously reduces the success rate by 80%.
        <br /><br />
        We recommend reaching a <span class="text-accent font-bold">14-day streak</span> with your current habits before adding more.
      </p>
      <div class="flex flex-col gap-2">
        <button type="button" onclick={handleBack}
          class="w-full py-3 rounded-2xl bg-bg-primary border border-border text-sm font-semibold hover:bg-bg-card transition">
          Go back & focus
        </button>
        <button type="button" onclick={() => hasAcknowledgedLimit = true}
          class="w-full py-3 rounded-2xl text-[10px] font-mono uppercase tracking-widest text-muted hover:text-foreground transition">
          I understand, add anyway
        </button>
      </div>
    </div>
  </div>
{:else}
  <div class="min-h-screen bg-bg-primary">
    <!-- Header -->
    <div
      class="border-b border-border bg-bg-primary px-4 sticky top-0 z-10"
      style="top: var(--safe-area-inset-top, 0px); padding-top: calc(var(--safe-area-inset-top, 0px) + 1rem); padding-bottom: 1rem"
    >
      <div class="max-w-lg mx-auto flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button type="button" onclick={handleBack} class="text-muted hover:text-foreground transition-colors">
            <ArrowLeft size={16} />
          </button>
          <h1 class="text-base font-semibold text-foreground">{isEdit ? 'Edit Habit' : 'New Habit'}</h1>
        </div>
        <button
          type="button"
          onclick={() => void handleSubmit()}
          class="px-4 py-1.5 rounded text-xs font-mono font-bold text-bg-primary transition-all duration-200"
          style="background-color: {selectedColor.hex}; box-shadow: 0 0 16px {selectedColor.hex}40"
        >
          {isEdit ? 'Save' : 'Create'}
        </button>
      </div>
    </div>

    <div class="max-w-lg mx-auto px-4 py-6 space-y-5">
      <!-- Icon + Name + Description -->
      <div class="flex gap-3">
        <div class="flex-shrink-0">
          <label class="block text-[10px] font-mono text-muted uppercase tracking-wider mb-2">Icon</label>
          <div class="grid grid-cols-5 gap-1 bg-bg-secondary border border-border rounded-lg p-2">
            {#each ICONS as option}
              <button type="button" onclick={() => icon = option}
                class="w-8 h-8 rounded flex items-center justify-center text-base transition-all {icon === option ? 'bg-border ring-1' : 'hover:bg-border'}"
                style={icon === option ? `box-shadow: 0 0 0 1px ${selectedColor.hex}` : ''}>
                {option}
              </button>
            {/each}
          </div>
          <div class="mt-2">
            <input
              type="text"
              value={ICONS.includes(icon) ? '' : icon}
              oninput={(e) => { const val = e.currentTarget.value; icon = Array.from(val).pop() || ''; }}
              placeholder="Own..."
              class="w-full bg-bg-secondary border border-border rounded-lg px-2 py-1.5 text-xs text-center placeholder:text-[10px] focus:outline-none focus:border-accent/50 transition-all font-mono"
              style={!ICONS.includes(icon) && icon ? `border-color: ${selectedColor.hex}; box-shadow: 0 0 8px ${selectedColor.hex}40` : ''}
            />
          </div>
        </div>
        <div class="flex-1 space-y-3">
          <div>
            <label class="block text-[10px] font-mono text-muted uppercase tracking-wider mb-2">Name *</label>
            <input
              type="text"
              bind:value={name}
              placeholder="e.g. Deep Work"
              maxlength={40}
              class="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder-border-hover font-medium focus:outline-none focus:border-accent/50 focus:shadow-[0_0_12px_var(--glow)] transition-all"
              style={errors.name ? 'border-color: var(--accent-secondary)' : ''}
            />
            {#if errors.name}
              <p class="text-[10px] font-mono text-accent-secondary mt-1">{errors.name}</p>
            {/if}
          </div>
          <div>
            <label class="block text-[10px] font-mono text-muted uppercase tracking-wider mb-2">Description</label>
            <textarea
              bind:value={description}
              placeholder="Brief description..."
              maxlength={400}
              rows={6}
              class="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder-border-hover focus:outline-none focus:border-accent/50 focus:shadow-[0_0_12px_var(--glow)] transition-all resize-none overflow-y-auto"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Color -->
      <div>
        <label class="block text-[10px] font-mono text-muted uppercase tracking-wider mb-2">Color</label>
        <div class="flex gap-2">
          {#each COLORS as option}
            <button type="button" onclick={() => color = option.value}
              class="w-8 h-8 rounded-full border-2 transition-all duration-200 flex items-center justify-center"
              style="background-color: {option.hex}20; border-color: {color === option.value ? option.hex : 'transparent'}; box-shadow: {color === option.value ? `0 0 12px ${option.hex}60` : 'none'}"
              title={option.label}>
              <div class="w-3 h-3 rounded-full" style="background-color: {option.hex}"></div>
            </button>
          {/each}
        </div>
      </div>

      <!-- Schedule -->
      <div>
        <label class="block text-[10px] font-mono text-muted uppercase tracking-wider mb-2">Schedule</label>
        <div class="grid grid-cols-2 gap-2">
          {#each SCHEDULE_TYPE_OPTIONS as option}
            <button type="button" onclick={() => schedule = createScheduleForType(option.value, schedule)}
              class="rounded-lg border px-3 py-2 text-xs font-mono text-left transition {schedule.type === option.value ? 'border-accent text-accent bg-accent/10' : 'border-border text-muted hover:border-border-hover'}">
              <div class="font-semibold uppercase tracking-[0.2em]">{option.label}</div>
              <div class="text-[9px] text-muted">{option.desc}</div>
            </button>
          {/each}
        </div>
        <div class="mt-3 space-y-3">
          {#if schedule.type === 'weekly_days'}
            <div class="flex gap-1">
              {#each DAY_LABELS as day, index}
                <button type="button" onclick={() => toggleWeekday(index)}
                  class="flex-1 rounded-lg border px-2 py-1 text-xs font-mono transition {activeWeekdays.includes(index) ? 'border-accent text-accent bg-accent/10' : 'border-border text-muted hover:border-border-hover'}">
                  {day[0]}
                </button>
              {/each}
            </div>
          {/if}
          {#if schedule.type === 'weekly_quota'}
            <div class="flex items-center gap-3">
              <input type="number" min={1} max={7} value={schedule.timesPerWeek}
                onchange={(e) => setWeekQuota(Number(e.currentTarget.value))}
                class="w-16 rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm font-mono focus:border-accent/60 focus:outline-none" />
              <span class="text-sm font-semibold text-foreground">{schedule.timesPerWeek} times per week</span>
            </div>
          {/if}
          {#if schedule.type === 'monthly_weeks'}
            <div class="space-y-2">
              <p class="text-[11px] font-mono text-muted uppercase tracking-[0.3em]">Weeks</p>
              <div class="flex flex-wrap gap-1">
                {#each WEEK_OF_MONTH_OPTIONS as week}
                  <button type="button" onclick={() => toggleWeekOfMonth(week)}
                    class="rounded-full border px-3 py-1 text-[10px] font-mono transition {schedule.weeksOfMonth.includes(week) ? 'border-accent text-accent bg-accent/10' : 'border-border text-muted hover:border-border-hover'}">
                    {week === 'last' ? 'Last' : `${week}th`}
                  </button>
                {/each}
              </div>
            </div>
            <div class="flex gap-1">
              {#each DAY_LABELS as day, index}
                <button type="button" onclick={() => toggleWeekday(index)}
                  class="flex-1 rounded-lg border px-2 py-1 text-xs font-mono transition {activeWeekdays.includes(index) ? 'border-accent text-accent bg-accent/10' : 'border-border text-muted hover:border-border-hover'}">
                  {day[0]}
                </button>
              {/each}
            </div>
          {/if}
          {#if schedule.type === 'monthly_quota'}
            <div class="flex items-center gap-3">
              <input type="number" min={1} max={31} value={schedule.timesPerMonth}
                onchange={(e) => setMonthQuota(Number(e.currentTarget.value))}
                class="w-20 rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm font-mono focus:border-accent/60 focus:outline-none" />
              <span class="text-sm font-semibold text-foreground">{schedule.timesPerMonth} times per month</span>
            </div>
          {/if}
        </div>
        <p class="text-[11px] font-mono text-muted mt-2">{describeSchedule(schedule)}</p>
      </div>

      <!-- Daily target -->
      <div>
        <label class="block text-[10px] font-mono text-muted uppercase tracking-wider mb-2">Daily target</label>
        <div class="flex items-center gap-2">
          {#each DAILY_TARGET_OPTIONS as value}
            <button type="button" onclick={() => dailyTarget = value}
              class="px-3 py-1.5 rounded-lg border text-[11px] font-mono transition {dailyTarget === value ? 'border-accent/50 bg-accent/10 text-accent' : 'border-border bg-bg-secondary text-muted hover:border-border-hover'}">
              {value}x/day
            </button>
          {/each}
        </div>
        <p class="text-[9px] font-mono text-muted mt-1">
          Habit counts as done only when today's completions reach this target.
        </p>
      </div>

      <!-- Habit type -->
      <div>
        <label class="block text-[10px] font-mono text-muted uppercase tracking-wider mb-2">Habit Type</label>
        <div class="flex gap-2 p-1 bg-bg-secondary rounded-xl border border-border">
          <button type="button" onclick={() => type = 'positive'}
            class="flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 {type === 'positive' ? 'bg-bg-primary shadow-sm text-foreground' : 'text-muted hover:text-foreground'}"
            style={type === 'positive' ? `border-left: 2px solid ${selectedColor.hex}` : ''}>
            I want to <span style="color: {selectedColor.hex}">DO</span> this
          </button>
          <button type="button" onclick={() => type = 'negative'}
            class="flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 {type === 'negative' ? 'bg-bg-primary shadow-sm text-foreground' : 'text-muted hover:text-foreground'}"
            style={type === 'negative' ? `border-left: 2px solid ${selectedColor.hex}` : ''}>
            I want to <span class="text-red-500">STOP</span> this
          </button>
        </div>
      </div>

      <!-- Tags -->
      <div>
        <label class="block text-[10px] font-mono text-muted uppercase tracking-wider mb-2">
          Tags <span class="text-border-hover">({tags.length}/5)</span>
        </label>
        <div class="flex flex-wrap gap-1.5 mb-2">
          {#each tags as tag}
            <span class="flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded border"
              style="color: {selectedColor.hex}; border-color: {selectedColor.hex}40; background-color: {selectedColor.hex}10">
              #{tag}
              <button type="button" onclick={() => handleRemoveTag(tag)} class="opacity-60 hover:opacity-100">
                <X size={9} />
              </button>
            </span>
          {/each}
        </div>
        <div class="flex gap-2">
          <input type="text" bind:value={tagInput}
            onkeydown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); handleAddTag(tagInput); } }}
            placeholder="Add tag..." maxlength={20} disabled={tags.length >= 5}
            class="flex-1 bg-bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder-border-hover font-mono focus:outline-none focus:border-accent/50 transition-all disabled:opacity-40" />
          <button type="button" onclick={() => handleAddTag(tagInput)} disabled={!tagInput.trim() || tags.length >= 5}
            class="px-3 py-2 rounded-lg border border-border text-muted hover:text-foreground hover:border-border-hover transition-colors disabled:opacity-40">
            <Plus size={13} />
          </button>
        </div>
        <div class="flex flex-wrap gap-1.5 mt-2">
          {#each SUGGESTED_TAGS.filter((t) => !tags.includes(t)).slice(0, 6) as tag}
            <button type="button" onclick={() => handleAddTag(tag)} disabled={tags.length >= 5}
              class="text-[9px] font-mono text-muted border border-border px-2 py-0.5 rounded hover:text-foreground hover:border-border-hover transition-colors disabled:opacity-40">
              +{tag}
            </button>
          {/each}
        </div>
      </div>

      <!-- Reminder -->
      <div>
        <label class="block text-[10px] font-mono text-muted uppercase tracking-wider mb-2">Reminder</label>
        <div class="flex flex-wrap items-center gap-3">
          <input type="time" bind:value={reminderTime}
            class="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm font-mono focus:border-accent/60 focus:outline-none focus:shadow-[0_0_12px_var(--glow)] transition" />
          <button type="button" onclick={() => reminderEnabled = !reminderEnabled}
            class="px-3 py-1.5 rounded-lg border text-[9px] font-mono uppercase tracking-wider transition {reminderEnabled ? 'border-accent/40 bg-accent/10 text-accent' : 'border-border bg-bg-secondary text-muted hover:border-border-hover'}">
            {reminderEnabled ? 'Reminders enabled' : 'Reminders disabled'}
          </button>
          <span class="text-[11px] font-mono text-muted">{reminderTime ? `Daily at ${reminderTime}` : 'No reminder yet'}</span>
        </div>
        <p class="text-[9px] font-mono text-muted mt-1">
          {reminderEnabled
            ? 'Reminder calls appear on the dashboard when the app is open.'
            : 'Notifications are disabled. Enable them to receive reminders.'}
        </p>
      </div>
    </div>
  </div>
{/if}
