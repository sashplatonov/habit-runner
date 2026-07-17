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

<header class="rounded-[1.75rem] border border-border bg-bg-card/94 px-4 py-4 shadow-[0_24px_60px_rgba(15,23,42,0.1)] backdrop-blur-xl">
  <div class="flex items-start gap-3">
    <IconButton ariaLabel="Back to dashboard" title="Back to dashboard" class="shrink-0" onClick={onBack}>
      <ArrowLeft size={16} aria-hidden="true" />
    </IconButton>

    <div class="flex min-w-0 flex-1 flex-col gap-2">
      <div class="flex min-w-0 flex-wrap items-center gap-2">
        <div class="min-w-0">
          <h1 class="truncate text-lg font-semibold text-foreground">{habitLabel}</h1>
          <p class="text-xs text-muted">{todayLabel}</p>
        </div>
        {#if habit.description}
          <DescriptionTooltip description={habit.description} triggerClassName="h-11 w-11" triggerLabel={descriptionLabel} />
        {/if}
      </div>

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
</header>
