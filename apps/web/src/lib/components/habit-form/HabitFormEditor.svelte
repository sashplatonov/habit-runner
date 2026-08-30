<script lang="ts">
  import type { Habit, HabitSchedule } from '@/types/habit';
  import HabitEditorDashboard from './HabitEditorDashboard.svelte';
  import HabitIdentitySection from './HabitIdentitySection.svelte';
  import HabitTypeSection from './HabitTypeSection.svelte';
  import HabitScheduleSection from './HabitScheduleSection.svelte';
  import HabitTargetSection from './HabitTargetSection.svelte';
  import HabitTagsSection from './HabitTagsSection.svelte';
  import HabitReminderSection from './HabitReminderSection.svelte';
  import FormActionBar from './FormActionBar.svelte';
  import type { HabitEditorPanel } from './types';

  type SelectedColor = { value: Habit['color']; label: string; hex: string };

  type Props = {
    activePanel: HabitEditorPanel;
    name: string;
    description: string;
    color: Habit['color'];
    icon: string;
    schedule: HabitSchedule;
    targetStreak: number;
    dailyTarget: number;
    habitType: Habit['type'];
    tags: string[];
    tagInput: string;
    reminderTime: string;
    reminderEnabled: boolean;
    openScheduleSlot: HabitSchedule['type'] | null;
    errors: Record<string, string>;
    selectedColor: SelectedColor;
    habitLabel: string;
    typeLabel: string;
    scheduleSummary: string;
    previewTargetSummary: string;
    previewTagsSummary: string;
    reminderSummary: string;
    targetLabel: string;
    tagsSummary: string;
    saveError: string | null;
    isDirty: boolean;
    isSaving: boolean;
    submitLabel: string;
    onSelectPanel: (panel: HabitEditorPanel) => void;
    onBack: () => void;
  };

  let {
    activePanel,
    name = $bindable(),
    description = $bindable(),
    color = $bindable(),
    icon = $bindable(),
    schedule = $bindable(),
    targetStreak = $bindable(),
    dailyTarget = $bindable(),
    habitType = $bindable(),
    tags = $bindable(),
    tagInput = $bindable(),
    reminderTime = $bindable(),
    reminderEnabled = $bindable(),
    openScheduleSlot = $bindable(),
    errors,
    selectedColor,
    habitLabel,
    typeLabel,
    scheduleSummary,
    previewTargetSummary,
    previewTagsSummary,
    reminderSummary,
    targetLabel,
    tagsSummary,
    saveError,
    isDirty,
    isSaving,
    submitLabel,
    onSelectPanel,
    onBack
  }: Props = $props();
</script>

{#if saveError}
  <div class="mx-auto max-w-3xl px-4 pb-2 sm:px-6">
    <p class="rounded-lg border border-accent-secondary/40 bg-accent-secondary/10 px-3 py-2 text-xs font-mono text-accent-secondary" role="alert">{saveError}</p>
  </div>
{/if}

{#if isDirty}
  <div class="mx-auto max-w-3xl px-4 pb-2 sm:px-6">
    <p class="rounded-lg border border-attention/30 bg-attention/10 px-3 py-2 text-xs font-mono text-attention" role="status">You have unsaved changes</p>
  </div>
{/if}

<div class="mx-auto max-w-3xl space-y-4 px-4 pb-28 pt-4 sm:px-6 sm:pb-6">
  {#if activePanel === 'dashboard'}
    <HabitEditorDashboard
      {habitLabel}
      colorHex={selectedColor.hex}
      colorLabel={selectedColor.label}
      {typeLabel}
      {scheduleSummary}
      {previewTargetSummary}
      {previewTagsSummary}
      {reminderSummary}
      {targetLabel}
      {tagsSummary}
      onSelect={onSelectPanel}
    />
  {:else}
    <div class="space-y-4">
      {#if activePanel === 'habit-type'}
        <HabitTypeSection bind:habitType dailyTarget={Math.max(1, Math.trunc(dailyTarget))} />
      {/if}

      {#if Object.keys(errors).length > 0}
        <div class="rounded-[1.5rem] border border-accent-secondary/30 bg-accent-secondary/10 px-4 py-3 text-sm text-accent-secondary" role="alert" aria-live="assertive">
          <p class="font-semibold">Fix the highlighted fields before saving.</p>
          <ul class="mt-2 list-disc space-y-1 pl-5 text-xs">
            {#each Object.values(errors) as errorText, errorIndex (`${errorText}-${errorIndex}`)}
              <li>{errorText}</li>
            {/each}
          </ul>
        </div>
      {/if}

      {#if activePanel === 'identity'}
        <HabitIdentitySection bind:name bind:description bind:color bind:icon {errors} {selectedColor} previewLabel={habitLabel} previewSchedule={scheduleSummary} previewType={typeLabel} {previewTargetSummary} {previewTagsSummary} />
      {/if}

      {#if activePanel === 'schedule'}
        <HabitScheduleSection bind:schedule bind:openSlot={openScheduleSlot} {errors} />
      {/if}

      {#if activePanel === 'goal'}
        <HabitTargetSection bind:targetStreak bind:dailyTarget {selectedColor} />
      {/if}

      {#if activePanel === 'reminder'}
        <HabitReminderSection bind:reminderTime bind:reminderEnabled />
      {/if}

      {#if activePanel === 'organization'}
        <HabitTagsSection bind:tags bind:tagInput {selectedColor} />
      {/if}
    </div>
  {/if}
</div>

<FormActionBar sticky={false} class="fixed inset-x-4 bottom-0 z-30 sm:hidden">
  <button type="button" class="rounded-full border border-border bg-bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted transition hover:text-foreground" onclick={onBack}>Cancel</button>
  <button type="submit" class="rounded-full px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-[0.22em] text-bg-primary transition-[background-color,box-shadow,opacity] duration-200 disabled:cursor-not-allowed disabled:opacity-50" style={`background-color: ${selectedColor.hex}; box-shadow: 0 0 16px ${selectedColor.hex}40;`} disabled={isSaving}>
    {isSaving ? 'Saving…' : submitLabel}
  </button>
</FormActionBar>
