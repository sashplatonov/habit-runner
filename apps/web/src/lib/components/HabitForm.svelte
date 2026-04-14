<script lang="ts">
  import { scheduleFromLegacy } from '@habbit-runner/shared';
  import { ArrowLeft, Plus, X } from 'lucide-svelte';
  import type { HabitFrequency } from '@habbit-runner/shared';
  import type { Habit } from '@/types/habit';
  import type { HabitUpsertInput } from '$lib/stores/habits';
  import { COLORS, DAILY_TARGET_OPTIONS, DAY_LABELS, FREQUENCIES, ICONS, TARGET_STREAK_OPTIONS } from '@/pages/components/add-edit-habit.constants';

  type Props = {
    mode: 'create' | 'edit';
    habit?: Habit | null;
    onBack: () => void;
    onSubmit: (payload: HabitUpsertInput) => Promise<void>;
  };

  type FormValues = {
    name: string;
    description: string;
    color: Habit['color'];
    icon: string;
    frequency: HabitFrequency;
    customDays: number[];
    targetStreak: number;
    dailyTarget: number;
    type: Habit['type'];
    tags: string[];
    tagInput: string;
    reminderTime: string;
    reminderEnabled: boolean;
  };

  let { mode, habit = null, onBack, onSubmit }: Props = $props();

  let hydratedKey = $state('');
  let isSaving = $state(false);
  let errors = $state<Record<string, string>>({});
  let name = $state('');
  let description = $state('');
  let color = $state<Habit['color']>('blue');
  let icon = $state('⚡');
  let frequency = $state<HabitFrequency>('daily');
  let customDays = $state<number[]>([1, 2, 3, 4, 5]);
  let targetStreak = $state(21);
  let dailyTarget = $state(1);
  let type = $state<Habit['type']>('positive');
  let tags = $state<string[]>([]);
  let tagInput = $state('');
  let reminderTime = $state('');
  let reminderEnabled = $state(true);

  function buildInitialValues(source: Habit | null): FormValues {
    return {
      name: source?.name ?? '',
      description: source?.description ?? '',
      color: source?.color ?? 'blue',
      icon: source?.icon ?? '⚡',
      frequency: source?.frequency ?? 'daily',
      customDays: source?.customDays ?? [1, 2, 3, 4, 5],
      targetStreak: source?.targetStreak ?? 21,
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
    frequency = values.frequency;
    customDays = values.customDays;
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
    const nextKey = habit?.id ?? mode;
    if (hydratedKey === nextKey) {
      return;
    }

    hydratedKey = nextKey;
    hydrateForm(buildInitialValues(habit));
  });

  function toggleCustomDay(day: number) {
    customDays = customDays.includes(day)
      ? customDays.filter((value) => value !== day)
      : [...customDays, day].sort((left, right) => left - right);
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

  function validate() {
    const nextErrors: Record<string, string> = {};

    if (!name.trim()) {
      nextErrors.name = 'Name is required';
    } else if (name.trim().length > 40) {
      nextErrors.name = 'Max 40 characters';
    }

    if (frequency === 'custom' && customDays.length === 0) {
      nextErrors.customDays = 'Select at least one day';
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
    try {
      const normalizedTags = tagInput ? [...tags] : tags;
      if (tagInput) {
        const sanitized = tagInput.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (sanitized && !normalizedTags.includes(sanitized) && normalizedTags.length < 5) {
          normalizedTags.push(sanitized);
        }
      }

      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        color,
        icon,
        tags: normalizedTags,
        frequency,
        customDays: frequency === 'custom' ? customDays : undefined,
        targetStreak,
        dailyTarget: Math.max(1, Math.trunc(dailyTarget)),
        type,
        archived: habit?.archived ?? false,
        schedule: scheduleFromLegacy(frequency, frequency === 'custom' ? customDays : undefined),
        reminderTime: reminderTime || undefined,
        reminderEnabled,
        freezeDays: habit?.freezeDays ?? [],
        sortOrder: habit?.sortOrder ?? 0
      });
    } finally {
      isSaving = false;
    }
  }
</script>

<div class="mx-auto max-w-3xl space-y-4 px-4 py-4">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div>
      <p class="text-[10px] font-mono uppercase tracking-[0.25em] text-muted">Wave 6 form</p>
      <h1 class="mt-2 text-2xl font-semibold text-foreground">
        {mode === 'edit' ? 'Edit habit' : 'Create a new habit'}
      </h1>
      <p class="mt-2 max-w-2xl text-sm text-muted">
        {mode === 'edit'
          ? 'Update the core fields on the migrated Svelte route without bouncing through the legacy router.'
          : 'Create habits directly on the migrated Svelte route tree using the shared Dexie-backed store.'}
      </p>
    </div>

    <button
      type="button"
      class="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted transition hover:border-accent hover:text-foreground"
      onclick={onBack}
    >
      <ArrowLeft size={14} />
      Back
    </button>
  </div>

  <section class="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
    <article class="space-y-4 rounded-3xl border border-border bg-bg-card p-5 shadow-glow-blue-sm">
      <div>
        <label class="text-[10px] font-mono uppercase tracking-[0.25em] text-muted" for="habit-name">Name</label>
        <input id="habit-name" class="mt-2 w-full rounded-2xl border border-border bg-bg-secondary px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent" bind:value={name} maxlength="40" placeholder="Morning stretch" />
        {#if errors.name}
          <p class="mt-2 text-xs text-red-400">{errors.name}</p>
        {/if}
      </div>

      <div>
        <label class="text-[10px] font-mono uppercase tracking-[0.25em] text-muted" for="habit-description">Description</label>
        <textarea id="habit-description" class="mt-2 min-h-[110px] w-full rounded-2xl border border-border bg-bg-secondary px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent" bind:value={description} placeholder="Why does this habit matter?" ></textarea>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <p class="text-[10px] font-mono uppercase tracking-[0.25em] text-muted">Frequency</p>
          <div class="mt-2 grid gap-2">
            {#each FREQUENCIES as option (option.value)}
              <button
                type="button"
                class={`rounded-2xl border px-4 py-3 text-left transition ${frequency === option.value ? 'border-accent bg-accent/10 text-foreground' : 'border-border bg-bg-secondary text-muted hover:border-accent/40 hover:text-foreground'}`}
                onclick={() => {
                  frequency = option.value;
                }}
              >
                <span class="block text-sm font-semibold">{option.label}</span>
                <span class="mt-1 block text-xs text-muted">{option.desc}</span>
              </button>
            {/each}
          </div>
          {#if frequency === 'custom'}
            <div class="mt-3 flex flex-wrap gap-2">
              {#each DAY_LABELS as label, index (`day-${label}`)}
                <button
                  type="button"
                  class={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] transition ${customDays.includes(index) ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-bg-primary text-muted hover:border-accent/40 hover:text-foreground'}`}
                  onclick={() => {
                    toggleCustomDay(index);
                  }}
                >
                  {label}
                </button>
              {/each}
            </div>
            {#if errors.customDays}
              <p class="mt-2 text-xs text-red-400">{errors.customDays}</p>
            {/if}
          {/if}
        </div>

        <div class="space-y-4">
          <div>
            <p class="text-[10px] font-mono uppercase tracking-[0.25em] text-muted">Type</p>
            <div class="mt-2 grid grid-cols-2 gap-2">
              {#each (['positive', 'negative'] as const) as option (option)}
                <button
                  type="button"
                  class={`rounded-2xl border px-4 py-3 text-sm font-semibold capitalize transition ${type === option ? 'border-accent bg-accent/10 text-foreground' : 'border-border bg-bg-secondary text-muted hover:border-accent/40 hover:text-foreground'}`}
                  onclick={() => {
                    type = option;
                  }}
                >
                  {option}
                </button>
              {/each}
            </div>
          </div>

          <div>
            <p class="text-[10px] font-mono uppercase tracking-[0.25em] text-muted">Daily target</p>
            <div class="mt-2 flex flex-wrap gap-2">
              {#each DAILY_TARGET_OPTIONS as option (option)}
                <button
                  type="button"
                  class={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${dailyTarget === option ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-bg-secondary text-muted hover:border-accent/40 hover:text-foreground'}`}
                  onclick={() => {
                    dailyTarget = option;
                  }}
                >
                  {option}x
                </button>
              {/each}
            </div>
          </div>

          <div>
            <p class="text-[10px] font-mono uppercase tracking-[0.25em] text-muted">Target streak</p>
            <div class="mt-2 flex flex-wrap gap-2">
              {#each TARGET_STREAK_OPTIONS as option (option)}
                <button
                  type="button"
                  class={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${targetStreak === option ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-bg-secondary text-muted hover:border-accent/40 hover:text-foreground'}`}
                  onclick={() => {
                    targetStreak = option;
                  }}
                >
                  {option}d
                </button>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </article>

    <article class="space-y-4 rounded-3xl border border-border bg-bg-card p-5 shadow-glow-blue-sm">
      <div>
        <p class="text-[10px] font-mono uppercase tracking-[0.25em] text-muted">Icon</p>
        <div class="mt-2 grid grid-cols-5 gap-2">
          {#each ICONS as option (option)}
            <button
              type="button"
              class={`flex h-12 items-center justify-center rounded-2xl border text-xl transition ${icon === option ? 'border-accent bg-accent/10' : 'border-border bg-bg-secondary hover:border-accent/40'}`}
              onclick={() => {
                icon = option;
              }}
            >
              {option}
            </button>
          {/each}
        </div>
      </div>

      <div>
        <p class="text-[10px] font-mono uppercase tracking-[0.25em] text-muted">Color</p>
        <div class="mt-2 grid grid-cols-2 gap-2">
          {#each COLORS as option (option.value)}
            <button
              type="button"
              class={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm font-semibold transition ${color === option.value ? 'border-accent bg-accent/10 text-foreground' : 'border-border bg-bg-secondary text-muted hover:border-accent/40 hover:text-foreground'}`}
              onclick={() => {
                color = option.value;
              }}
            >
              <span class="h-3 w-3 rounded-full" style:background-color={option.hex}></span>
              {option.label}
            </button>
          {/each}
        </div>
      </div>

      <div>
        <p class="text-[10px] font-mono uppercase tracking-[0.25em] text-muted">Tags</p>
        <div class="mt-2 flex gap-2">
          <input class="min-w-0 flex-1 rounded-2xl border border-border bg-bg-secondary px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent" bind:value={tagInput} placeholder="focus" onkeydown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addTag(tagInput);
            }
          }} />
          <button type="button" class="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-semibold text-muted transition hover:border-accent hover:text-foreground" onclick={() => {
            addTag(tagInput);
          }}>
            <Plus size={14} />
            Add
          </button>
        </div>

        {#if tags.length > 0}
          <div class="mt-3 flex flex-wrap gap-2">
            {#each tags as tag (tag)}
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-full border border-border bg-bg-secondary px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-foreground"
                onclick={() => {
                  removeTag(tag);
                }}
              >
                {tag}
                <X size={12} />
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <div>
        <label class="text-[10px] font-mono uppercase tracking-[0.25em] text-muted" for="habit-reminder">Reminder time</label>
        <input id="habit-reminder" class="mt-2 w-full rounded-2xl border border-border bg-bg-secondary px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent" bind:value={reminderTime} type="time" />
        <label class="mt-3 flex items-center gap-2 text-sm text-muted">
          <input bind:checked={reminderEnabled} type="checkbox" />
          Reminder enabled
        </label>
      </div>
    </article>
  </section>

  <div class="flex justify-end">
    <button
      type="button"
      class="inline-flex items-center justify-center rounded-full border border-accent px-5 py-3 text-sm font-semibold text-foreground transition hover:border-accent-secondary/50 disabled:cursor-not-allowed disabled:opacity-40"
      onclick={() => {
        void handleSubmit();
      }}
      disabled={isSaving}
    >
      {#if isSaving}
        Saving...
      {:else}
        {mode === 'edit' ? 'Save changes' : 'Create habit'}
      {/if}
    </button>
  </div>
</div>
