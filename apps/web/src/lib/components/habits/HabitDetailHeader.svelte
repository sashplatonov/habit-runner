<script lang="ts">
  import { ArrowLeft, Ellipsis, Pencil } from 'lucide-svelte';
  import IconButton from '$lib/components/ui/IconButton.svelte';
  import type { Habit } from '@/types/habit';
  import { formatHabitLabel } from '$lib/habits/formatHabitLabel';

  type Props = {
    habit: Habit;
    pending?: boolean;
    onBack: () => void;
    onEdit: () => void;
  };

  const { habit, pending = false, onBack, onEdit }: Props = $props();
  const habitLabel = $derived(formatHabitLabel(habit));
  const stateLabel = $derived(habit.archived ? 'Archived' : 'Active');
</script>

<header class="flex min-w-0 items-center gap-2 py-0.5">
  <IconButton ariaLabel="Back to dashboard" title="Back to dashboard" class="!size-10 !min-h-10 !min-w-10 !rounded-xl !border-[#263752] !bg-[#101b2b] !text-[#aab9d0]" onClick={onBack}>
    <ArrowLeft size={18} aria-hidden="true" />
  </IconButton>

  <div class="min-w-0 flex-1">
    <h1 class="truncate text-[1.08rem] font-bold leading-5 tracking-[-0.035em] text-foreground">{habitLabel}</h1>
    <p class="mt-0.5 text-xs text-muted">Daily habit · {stateLabel}</p>
  </div>

  <div class="flex shrink-0 items-center gap-2">
    <IconButton ariaLabel="Edit habit" title="Edit habit" class="!size-10 !min-h-10 !min-w-10 !rounded-xl !border-[#263752] !bg-[#101b2b] !text-[#c7d6ed]" disabled={pending} onClick={onEdit}>
      <Pencil size={16} aria-hidden="true" />
    </IconButton>
    <span class="inline-flex size-10 items-center justify-center rounded-xl border border-[#263752] bg-[#101b2b] text-[#aab9d0]" aria-hidden="true"><Ellipsis size={18} /></span>
  </div>
</header>
