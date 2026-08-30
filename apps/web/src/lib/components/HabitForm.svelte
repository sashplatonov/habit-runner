<script lang="ts">
  import { beforeNavigate, goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { describeSchedule } from '@habbit-runner/shared';
  import type { Habit } from '@/types/habit';
  import type { HabitSchedule } from '@habbit-runner/shared';
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
  import HabitFormEditor from './habit-form/HabitFormEditor.svelte';
  import HabitFormHeader from './habit-form/HabitFormHeader.svelte';
  import SoftLimitWarningDialog from './habit-form/SoftLimitWarningDialog.svelte';
  import DiscardChangesDialog from './habit-form/DiscardChangesDialog.svelte';
  import type { HabitEditorPanel } from './habit-form/types';
  import { isApiError } from '$lib/api/ApiError';

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
  let activePanel = $state<HabitEditorPanel>('dashboard');
  let openScheduleSlot = $state<HabitSchedule['type'] | null>(null);

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
  const previewTargetSummary = $derived(`${dailyTarget}×/day · streak ${targetStreak}d`);
  const typeLabel = $derived(type === 'negative' ? 'Avoid habit' : 'Build habit');
  const tagsSummary = $derived(tags.length > 0 ? `${tags.map((tag) => `#${tag}`).join(' · ')} · ${tags.length}/5 tags` : 'No tags · 0/5 tags');
  const previewTagsSummary = $derived(tags.length > 0 ? tags.map((tag) => `#${tag}`).join(' · ') : 'No tags');
  const scheduleDetailLabels: Record<Exclude<HabitSchedule['type'], never>, { title: string; subtitle: string }> = {
    daily: { title: 'Daily schedule', subtitle: 'Schedule · Daily' },
    weekly_days: { title: 'Days of week', subtitle: 'Schedule · Pick weekdays' },
    weekly_quota: { title: 'Weekly quota', subtitle: 'Schedule · Flexible weekly target' },
    monthly_quota: { title: 'Monthly quota', subtitle: 'Schedule · Flexible monthly target' },
    monthly_weeks: { title: 'Monthly weeks', subtitle: 'Schedule · Weeks of month' }
  };
  const panelTitle = $derived(activePanel === 'dashboard' ? (mode === 'edit' ? 'Edit habit' : 'New habit') : activePanel === 'schedule' && openScheduleSlot
    ? scheduleDetailLabels[openScheduleSlot].title
    : {
      identity: 'Identity', 'habit-type': 'Habit type', schedule: 'Schedule', goal: 'Goal', reminder: 'Reminder', organization: 'Organization'
    }[activePanel]);
  const panelSubtitle = $derived(activePanel === 'dashboard'
    ? `${habitLabel} · ${scheduleSummary} · Active`
    : activePanel === 'schedule' && openScheduleSlot
      ? scheduleDetailLabels[openScheduleSlot].subtitle
      : 'Edit this part of your habit.');

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
    activePanel = 'dashboard';
    openScheduleSlot = null;
    hydrateForm(buildInitialValues(habit, DEFAULT_TARGET_STREAK));
  });

  function returnToDashboard() {
    activePanel = 'dashboard';
  }

  function handleEditorBack() {
    if (activePanel !== 'dashboard') {
      if (activePanel === 'schedule' && openScheduleSlot) {
        openScheduleSlot = null;
        return;
      }
      returnToDashboard();
      return;
    }

    onBack();
  }

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
          : nextErrors.description
            ? '#habit-description'
          : nextErrors.scheduleWeeks
            ? '[aria-label^="Toggle week" i]'
          : nextErrors.scheduleWeekdays
            ? '[aria-label*="in the selected weeks" i]'
          : nextErrors.schedule
            ? '[aria-label*="for the schedule" i]'
            : nextErrors.reminderTime
              ? '#habit-reminder'
              : nextErrors.tags
                ? '[aria-label*="tag" i]'
                : '#habit-name';

      const target = formEl?.querySelector<HTMLElement>(selector);
      target?.focus?.();
    });
  }

  function panelForValidationErrors(nextErrors: Record<string, string>): HabitEditorPanel {
    if (nextErrors.name || nextErrors.description) {
      return 'identity';
    }
    if (nextErrors.schedule || nextErrors.scheduleWeeks || nextErrors.scheduleWeekdays) {
      return 'schedule';
    }
    return activePanel;
  }

  async function handleSubmit() {
    const nextErrors = validateHabitForm({ name, description, schedule });
    errors = nextErrors;
    if (Object.keys(nextErrors).length > 0) {
      if (activePanel === 'dashboard') {
        activePanel = panelForValidationErrors(nextErrors);
        if (activePanel === 'schedule') {
          openScheduleSlot = schedule.type;
        }
      }
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
      if (isApiError(err)) {
        errors = { ...errors, ...err.fieldErrors };
        saveError = err.userMessage;
      } else {
        saveError = 'Something went wrong. Please try again.';
      }
    } finally {
      isSaving = false;
    }
  }
</script>

<SoftLimitWarningDialog
  open={showSoftLimitWarning}
  onBack={onBack}
  onContinue={() => {
    hasAcknowledgedSoftLimit = true;
  }}
/>

<DiscardChangesDialog
  open={discardDialogOpen}
  onKeepEditing={keepEditing}
  onDiscard={() => void discardChanges()}
/>

<form
  bind:this={formEl}
  data-editor-panel={activePanel}
  onsubmit={(event) => {
    event.preventDefault();
    void handleSubmit();
  }}
  class="min-h-screen bg-transparent"
>
  <HabitFormHeader
    {activePanel}
    title={panelTitle}
    subtitle={panelSubtitle}
    colorHex={selectedColor.hex}
    submitLabel={mode === 'edit' ? 'Save habit' : 'Create habit'}
    {isSaving}
    onBack={handleEditorBack}
  />

  <HabitFormEditor
    {activePanel}
    bind:name
    bind:description
    bind:color
    bind:icon
    bind:schedule
    bind:targetStreak
    bind:dailyTarget
    bind:habitType={type}
    bind:tags
    bind:tagInput
    bind:reminderTime
    bind:reminderEnabled
    bind:openScheduleSlot
    {errors}
    {selectedColor}
    {habitLabel}
    {typeLabel}
    {scheduleSummary}
    {previewTargetSummary}
    {previewTagsSummary}
    {reminderSummary}
    {targetLabel}
    {tagsSummary}
    {saveError}
    {isDirty}
    {isSaving}
    submitLabel={mode === 'edit' ? 'Save habit' : 'Create habit'}
    onSelectPanel={(panel) => (activePanel = panel)}
    onBack={handleEditorBack}
  />
</form>
