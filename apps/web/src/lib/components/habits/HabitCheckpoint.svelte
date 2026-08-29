<script lang="ts">
  import { Flag } from 'lucide-svelte';
  import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
  import Surface from '$lib/components/ui/Surface.svelte';

  type Props = {
    currentStreak: number;
    nextMilestoneLabel: string;
    nextMilestoneDays: number | null;
    nextMilestoneTarget: number | null;
  };

  const { currentStreak, nextMilestoneLabel, nextMilestoneDays, nextMilestoneTarget }: Props = $props();
  const milestoneProgress = $derived(nextMilestoneTarget === null ? 100 : Math.round((currentStreak / Math.max(1, nextMilestoneTarget)) * 100));
  const questCopy = $derived(nextMilestoneDays === null ? 'You reached every consistency checkpoint. Keep the routine comfortable.' : nextMilestoneDays === 1 ? 'One scheduled completion unlocks this checkpoint.' : `${nextMilestoneDays} scheduled completions unlock this checkpoint.`);
</script>

<Surface as="section" padding="lg" class="habit-detail-surface !p-3 sm:!p-4">
  <div class="flex items-start justify-between gap-3"><div class="min-w-0"><p class="detail-eyebrow">Next checkpoint</p><h2 class="mt-1 text-lg font-bold tracking-[-0.035em] text-foreground">{nextMilestoneLabel}</h2></div><span class="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-accent" aria-hidden="true"><Flag size={15} /></span></div>
  <div class="mt-3"><div class="mb-1 flex justify-between text-xs text-muted"><span>Checkpoint progress</span><strong class="text-foreground">{milestoneProgress}%</strong></div><ProgressBar value={milestoneProgress} label="Checkpoint progress" /></div>
  <p class="mt-2 text-xs leading-4 text-muted">{questCopy}</p>
</Surface>
