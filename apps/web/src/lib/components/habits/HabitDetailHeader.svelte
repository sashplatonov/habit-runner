<script lang="ts">
  import { Archive, ArchiveRestore, ArrowLeft, Pencil } from 'lucide-svelte';
  import DescriptionTooltip from '$lib/components/DescriptionTooltip.svelte';
  import IconButton from '$lib/components/ui/IconButton.svelte';
  import StatusPill from '$lib/components/ui/StatusPill.svelte';
  import type { Habit } from '@/types/habit';
  import { formatHabitLabel } from '$lib/habits/formatHabitLabel';

  type Props = {
    habit: Habit;
    todayLabel: string;
    descriptionLabel: string;
    pending?: boolean;
    onBack: () => void;
    onEdit: () => void;
    onToggleArchive: () => void;
  };

  const { habit, todayLabel, descriptionLabel, pending = false, onBack, onEdit, onToggleArchive }: Props = $props();
  const habitLabel = $derived(formatHabitLabel(habit));
</script>

<header class="rounded-[1.9rem] border border-border bg-bg-card/94 px-4 py-4 shadow-surface backdrop-blur-xl sm:px-5">
  <div class="flex items-start gap-3">
    <IconButton ariaLabel="Back to dashboard" title="Back to dashboard" class="shrink-0" onClick={onBack}>
      <ArrowLeft size={16} aria-hidden="true" />
    </IconButton>

    <div class="min-w-0 flex-1 pt-0.5">
      <h1 class="truncate text-[1.05rem] font-semibold tracking-[-0.025em] text-foreground">{habitLabel}</h1>
      <p class="mt-0.5 text-xs text-muted">{todayLabel}</p>
    </div>

    <div class="flex flex-none items-center gap-2">
      <IconButton ariaLabel={habit.archived ? 'Restore habit' : 'Archive habit'} title={habit.archived ? 'Restore habit' : 'Archive habit'} onClick={onToggleArchive} active={habit.archived} toggle={true} loading={pending}>
        {#if habit.archived}
          <ArchiveRestore size={16} aria-hidden="true" />
        {:else}
          <Archive size={16} aria-hidden="true" />
        {/if}
      </IconButton>
      <IconButton ariaLabel="Edit habit" title="Edit habit" onClick={onEdit} disabled={pending}>
        <Pencil size={16} aria-hidden="true" />
      </IconButton>
    </div>
  </div>

  <div class="ml-14 mt-2 flex flex-col items-start gap-2">
    {#if habit.description}
      <DescriptionTooltip description={habit.description} triggerClassName="h-11 w-11" triggerLabel={descriptionLabel} />
    {/if}

    <div class="flex flex-wrap items-center gap-2">
      <StatusPill tone={habit.archived ? 'attention' : 'progress'}>
        {habit.archived ? 'Archived' : 'Active'}
      </StatusPill>
      {#if habit.type === 'negative'}
        <StatusPill tone="neutral">Avoid habit</StatusPill>
      {:else}
        <StatusPill tone="neutral">Build habit</StatusPill>
      {/if}
    </div>
  </div>
</header>
