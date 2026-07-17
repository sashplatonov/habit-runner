<script lang="ts">
  import { beforeNavigate, goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { describeSchedule } from '@habbit-runner/shared';
  import { ArrowLeft, Plus } from 'lucide-svelte';
  import type { Habit } from '@/types/habit';
  import type { HabitUpsertInput } from '$lib/stores/habits';
  import { COLORS } from '$lib/habits/constants';
  import {
    areFormValuesEqual,
    buildInitialValues,
    buildLegacyScheduleFields,
    calculateSoftLimitWarning,
    DEFAULT_TARGET_STREAK,
    normalizeTags,
    validateHabitForm,
    type HabitFormValues
  } from '$lib/habits/habitFormModel';
  import { formatHabitLabel } from '$lib/habits/formatHabitLabel';
  import HabitIdentitySection from './habit-form/HabitIdentitySection.svelte';
  import HabitScheduleSection from './habit-form/HabitScheduleSection.svelte';
  import HabitTargetSection from './habit-form/HabitTargetSection.svelte';
  import HabitTagsSection from './habit-form/HabitTagsSection.svelte';
  import HabitReminderSection from './habit-form/HabitReminderSection.svelte';
  import HabitPreview from './habits/HabitPreview.svelte';
  import FormActionBar from './habit-form/FormActionBar.svelte';
  import Overlay from './overlays/Overlay.svelte';

  type Props = {
    mode: 'create' | 'edit';
    habit?: Habit | null;
    allHabits?: Habit[];
    onBack: () => void;
    onSubmit: (payload: HabitUpsertInput) => Promise<void>;
  };

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
  let schedule = $state(buildInitialValues(null).schedule);
  let targetStreak = $state(DEFAULT_TARGET_STREAK);
  let dailyTarget = $state(1);
  let type = $state<Habit['type']>('positive');
  let tags = $state<string[]>([]);
  let tagInput = $state('');
  let reminderTime = $state('');
  let reminderEnabled = $state(true);
  let initialFormValues = $state<HabitFormValues | null>(null);
  let formEl = $state<HTMLFormElement | null>(null);
  let discardDialogOpen = $state(false);
  let pendingNavigationUrl = $state<string | null>(null);
  let pendingNavigationReplace = false;
  let allowNavigation = false;

  const selectedColor = $derived(COLORS.find((option) => option.value === color) ?? COLORS[0]);
  const currentValues = $derived({
    name,
    description,
    color,
    icon,
    schedule,
    targetStreak,
    dailyTarget,
    type,
    tags,
    tagInput,
    reminderTime,
    reminderEnabled
  });
  const showSoftLimitWarning = $derived(
    mode === 'create' && !hasAcknowledgedSoftLimit && calculateSoftLimitWarning(allHabits)
  );
  const isDirty = $derived(initialFormValues ? !areFormValuesEqual(currentValues, initialFormValues) : false);
  const habitLabel = $derived(name.trim() ? formatHabitLabel({ name: name.trim(), icon }) : `${icon} New habit`);
  const scheduleSummary = $derived(describeSchedule(schedule));
  const reminderSummary = $derived(
    reminderEnabled ? (reminderTime ? `Daily at ${reminderTime}` : 'Reminders enabled') : 'Reminders disabled'
  );
  const targetLabel = $derived(`Target ${dailyTarget}x/day, streak ${targetStreak} days`);
  const typeLabel = $derived(type === 'negative' ? 'Avoid habit' : 'Build habit');

  function hydrateForm(values: HabitFormValues) {
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
    hydrateForm(buildInitialValues(habit, DEFAULT_TARGET_STREAK));
  });

  beforeNavigate(({ cancel, to, type: navigationType }) => {
    if (!allowNavigation && isDirty && !isSaving) {
      cancel();
      pendingNavigationUrl = to?.url.href ?? null;
      pendingNavigationReplace = navigationType === 'popstate';
      discardDialogOpen = true;
    }
  });

  function keepEditing() {
    discardDialogOpen = false;
    pendingNavigationUrl = null;
    pendingNavigationReplace = false;
  }

  async function discardChanges() {
    const target = pendingNavigationUrl;
    const replaceState = pendingNavigationReplace;
    if (!target) {
      keepEditing();
      return;
    }
    allowNavigation = true;
    discardDialogOpen = false;
    pendingNavigationUrl = null;
    pendingNavigationReplace = false;
    try {
      if (new URL(target).origin !== window.location.origin) {
        window.location.assign(target);
        return;
      }
      await goto(resolve(target, {}), { replaceState });
    } finally {
      allowNavigation = false;
    }
  }

  function handleBeforeUnload(event: BeforeUnloadEvent) {
    if (!allowNavigation && isDirty && !isSaving) {
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

  function focusFirstInvalidField(nextErrors: Record<string, string>) {
    requestAnimationFrame(() => {
      const selector =
        nextErrors.name
          ? '#habit-name'
          : nextErrors.schedule || nextErrors.scheduleWeeks || nextErrors.scheduleWeekdays
            ? '[aria-label*="schedule" i]'
            : nextErrors.reminderTime
              ? '#habit-reminder'
              : nextErrors.tags
                ? '[aria-label*="tag" i]'
                : '#habit-name';

      const target = formEl?.querySelector<HTMLElement>(selector);
      target?.focus?.();
    });
  }

  async function handleSubmit() {
    const nextErrors = validateHabitForm({ name, schedule });
    errors = nextErrors;
    if (Object.keys(nextErrors).length > 0) {
      focusFirstInvalidField(nextErrors);
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
          customDays: legacyScheduleFields.customDays ?? [],
          targetStreak,
          dailyTarget: Math.max(1, Math.trunc(dailyTarget)),
          type,
          archived: habit?.archived ?? false,
          schedule,
          reminderTime: reminderTime || null,
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
  <Overlay
    open={showSoftLimitWarning}
    onClose={onBack}
    ariaLabel="Add another habit"
    closeOnEscape={true}
    closeOnOutsideClick={false}
    trapFocus={true}
    restoreFocus={false}
    lockScroll={true}
    class="inset-0 z-[100] flex items-center justify-center bg-bg-primary/80 p-4 backdrop-blur-sm"
  >
    <div class="w-full max-w-sm rounded-3xl border border-border bg-bg-secondary p-6 shadow-2xl">
      <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10">
        <Plus class="text-accent" size={24} aria-hidden="true" />
      </div>
      <h3 class="mb-2 text-xl font-bold text-foreground">Focus is key</h3>
      <p class="mb-6 text-sm leading-relaxed text-muted">
        Consider getting the current habits into a steadier rhythm before adding another one.
        <br /><br />
        A short run of consistency usually gives the new habit more room to stick.
      </p>
      <div class="flex flex-col gap-2">
        <button
          type="button"
          class="w-full rounded-2xl border border-border bg-bg-primary py-3 text-sm font-semibold transition hover:bg-bg-card"
          onclick={onBack}
        >
          Go back
        </button>
        <button
          type="button"
          class="w-full rounded-2xl py-3 text-[10px] font-mono uppercase tracking-widest text-muted transition hover:text-foreground"
          onclick={() => {
            hasAcknowledgedSoftLimit = true;
          }}
        >
          Add anyway
        </button>
      </div>
    </div>
  </Overlay>
{/if}

{#if discardDialogOpen}
  <Overlay
    open={discardDialogOpen}
    onClose={keepEditing}
    ariaLabel="Discard unsaved changes"
    closeOnEscape={true}
    closeOnOutsideClick={false}
    trapFocus={true}
    restoreFocus={true}
    lockScroll={true}
    class="inset-0 z-[110] flex items-center justify-center bg-bg-primary/80 p-4 backdrop-blur-sm"
  >
    <div class="w-full max-w-sm rounded-3xl border border-border bg-bg-secondary p-6 shadow-2xl">
      <h2 class="text-xl font-bold text-foreground">Discard unsaved changes?</h2>
      <p class="mt-2 text-sm leading-6 text-muted">Your latest edits will be lost.</p>
      <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" class="min-h-11 rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted transition-colors hover:text-foreground" onclick={keepEditing}>
          Keep editing
        </button>
        <button type="button" class="min-h-11 rounded-full border border-danger/40 bg-danger/10 px-4 py-2 text-sm font-semibold text-danger transition-colors hover:bg-danger/20" onclick={() => void discardChanges()}>
          Discard changes
        </button>
      </div>
    </div>
  </Overlay>
{/if}

<form
  bind:this={formEl}
  onsubmit={(event) => {
    event.preventDefault();
    void handleSubmit();
  }}
  class="min-h-screen bg-transparent"
>
  <div
    class="sticky top-0 z-10 bg-transparent px-4 pt-4 sm:px-6"
    style="padding-bottom: 1rem;"
  >
    <div class="mx-auto flex max-w-3xl flex-col items-stretch gap-3 rounded-[1.75rem] border border-border bg-bg-secondary/90 px-4 py-4 shadow-[0_24px_60px_rgba(15,23,42,0.1)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="inline-flex h-11 w-11 items-center justify-center rounded-[1rem] border border-border text-muted transition-colors hover:border-border-hover hover:text-foreground"
          onclick={onBack}
          aria-label="Back"
        >
          <ArrowLeft size={16} aria-hidden="true" />
        </button>
        <div>
          <h1 class="text-base font-semibold text-foreground">{mode === 'edit' ? 'Edit habit' : 'New habit'}</h1>
          <p class="text-xs text-muted">Keep the geometry and save state consistent across mobile and desktop.</p>
        </div>
      </div>

      <button
        type="submit"
        class="hidden w-full rounded-full px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-[0.22em] text-bg-primary transition-[background-color,box-shadow,opacity] duration-200 disabled:cursor-not-allowed disabled:opacity-50 sm:inline-flex sm:w-auto"
        style={`background-color: ${selectedColor.hex}; box-shadow: 0 0 16px ${selectedColor.hex}40;`}
        disabled={isSaving}
      >
        {isSaving ? 'Saving…' : mode === 'edit' ? 'Save habit' : 'Create habit'}
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
      <p class="rounded-lg border border-attention/30 bg-attention/10 px-3 py-2 text-xs font-mono text-attention" role="status">
        You have unsaved changes
      </p>
    </div>
  {/if}

  <div class="mx-auto max-w-3xl space-y-5 px-4 pb-28 pt-6 sm:px-6 sm:pb-6">
    <HabitPreview
      habitLabel={habitLabel}
      colorHex={selectedColor.hex}
      colorLabel={selectedColor.label}
      typeLabel={typeLabel}
      scheduleSummary={scheduleSummary}
      reminderSummary={reminderSummary}
      targetLabel={targetLabel}
    />

    <div class="rounded-[1.5rem] border border-border bg-bg-card/92 p-5 shadow-[0_20px_54px_rgba(15,23,42,0.08)]">
      <p class="mb-2 block text-[10px] font-mono uppercase tracking-wider text-muted">Habit type</p>
      <div class="flex flex-col gap-2 rounded-xl border border-border bg-bg-secondary p-1 sm:flex-row">
        <button
          type="button"
          class={`flex-1 rounded-lg py-2.5 text-xs font-semibold transition-[background-color,color,box-shadow] duration-200 ${type === 'positive' ? 'bg-bg-primary text-foreground shadow-sm' : 'text-muted hover:text-foreground'}`}
          style={type === 'positive' ? `border-left: 2px solid ${selectedColor.hex};` : ''}
          aria-pressed={type === 'positive'}
          onclick={() => {
            type = 'positive';
          }}
        >
          Build habit
        </button>
        <button
          type="button"
          class={`flex-1 rounded-lg py-2.5 text-xs font-semibold transition-[background-color,color,box-shadow] duration-200 ${type === 'negative' ? 'bg-bg-primary text-foreground shadow-sm' : 'text-muted hover:text-foreground'}`}
          style={type === 'negative' ? `border-left: 2px solid ${selectedColor.hex};` : ''}
          aria-pressed={type === 'negative'}
          onclick={() => {
            type = 'negative';
          }}
        >
          Avoid habit
        </button>
      </div>
    </div>

    {#if Object.keys(errors).length > 0}
      <div class="rounded-[1.5rem] border border-accent-secondary/30 bg-accent-secondary/10 px-4 py-3 text-sm text-accent-secondary">
        <p class="font-semibold">Fix the highlighted fields before saving.</p>
        <ul class="mt-2 list-disc space-y-1 pl-5 text-xs">
          {#each Object.values(errors) as errorText, errorIndex (`${errorText}-${errorIndex}`)}
            <li>{errorText}</li>
          {/each}
        </ul>
      </div>
    {/if}

    <HabitIdentitySection
      bind:name
      bind:description
      bind:color
      bind:icon
      {errors}
      {selectedColor}
    />

    <HabitScheduleSection
      bind:schedule
      {errors}
    />

    <HabitTargetSection
      bind:targetStreak
      bind:dailyTarget
      {selectedColor}
    />

    <HabitReminderSection
      bind:reminderTime
      bind:reminderEnabled
    />

    <HabitTagsSection
      bind:tags
      bind:tagInput
      {selectedColor}
    />
  </div>

  <FormActionBar sticky={false} class="fixed inset-x-4 bottom-0 z-30 sm:hidden">
    <button
      type="button"
      class="rounded-full border border-border bg-bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted transition hover:text-foreground"
      onclick={onBack}
    >
      Cancel
    </button>
    <button
      type="submit"
      class="rounded-full px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-[0.22em] text-bg-primary transition-[background-color,box-shadow,opacity] duration-200 disabled:cursor-not-allowed disabled:opacity-50"
      style={`background-color: ${selectedColor.hex}; box-shadow: 0 0 16px ${selectedColor.hex}40;`}
      disabled={isSaving}
    >
      {isSaving ? 'Saving…' : mode === 'edit' ? 'Save habit' : 'Create habit'}
    </button>
  </FormActionBar>
</form>
