<script lang="ts">
  import { Check, Flag, Flame } from 'lucide-svelte';
  import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
  import Surface from '$lib/components/ui/Surface.svelte';

  type Props = {
    currentStreak: number;
    hasCompletionHistory: boolean;
    streakLabel: string;
    bestLabel: string;
    completionRateLabel: string;
    nextMilestoneLabel: string;
    nextMilestoneDays: number | null;
    nextMilestoneTarget: number | null;
    showCheckpoint?: boolean;
  };

  const {
    currentStreak,
    hasCompletionHistory,
    streakLabel,
    bestLabel,
    completionRateLabel,
    nextMilestoneLabel,
    nextMilestoneDays,
    nextMilestoneTarget,
    showCheckpoint = true
  }: Props = $props();

  const milestoneProgress = $derived(
    nextMilestoneTarget === null ? 100 : Math.round((currentStreak / Math.max(1, nextMilestoneTarget)) * 100)
  );
  const bestRunLabel = $derived(bestLabel.replace(/ best$/, ''));
  const questCopy = $derived(nextMilestoneDays === null ? 'You reached every consistency checkpoint. Keep the routine comfortable.' : nextMilestoneDays === 1 ? 'One scheduled completion unlocks this checkpoint.' : `${nextMilestoneDays} scheduled completions unlock this checkpoint.`);
</script>

<Surface as="section" padding="lg" class="habit-detail-surface overflow-hidden !p-3 sm:!p-4">
  <p class="detail-eyebrow">Habit journey</p>
  <div class="mt-2 flex items-center gap-2" aria-label="Habit journey progress">
    <span class="journey-node journey-node-done"><Check size={15} aria-hidden="true" /></span><span class="h-0.5 min-w-0 flex-1 bg-progress/60" aria-hidden="true"></span><span class="journey-node journey-node-current"><Flame size={15} aria-hidden="true" /></span><span class="h-0.5 min-w-0 flex-1 bg-border" aria-hidden="true"></span><span class="journey-node"><Flag size={15} aria-hidden="true" /></span>
  </div>
  <div class="mt-2 grid grid-cols-3 overflow-hidden rounded-2xl border border-border bg-bg-secondary">
    <div class="border-r border-border px-2.5 py-2.5"><p class="text-xs text-muted">Current run</p><p class="mt-0.5 text-lg font-bold tracking-[-0.035em] text-foreground">{streakLabel}</p></div>
    <div class="border-r border-border px-2.5 py-2.5"><p class="text-xs text-muted">Best run</p><p class="mt-0.5 text-lg font-bold tracking-[-0.035em] text-foreground">{hasCompletionHistory ? bestRunLabel : '—'}{#if hasCompletionHistory}<span class="sr-only">{bestLabel}</span>{/if}</p></div>
    <div class="px-2.5 py-2.5"><p class="text-xs text-muted">Next</p><p class="mt-0.5 text-lg font-bold tracking-[-0.035em] text-foreground">{nextMilestoneDays === null ? 'Complete' : `${nextMilestoneDays} done`}</p></div>
  </div>
  <p class="mt-2 text-xs leading-4 text-muted">{currentStreak > 0 ? `Keep your ${completionRateLabel.toLowerCase()} going toward the next checkpoint.` : 'Restart the run today, then build toward the next checkpoint.'}{#if hasCompletionHistory}<span class="sr-only">{completionRateLabel}</span>{/if}</p>
</Surface>

{#if showCheckpoint}
  <Surface as="section" padding="lg" class="habit-detail-surface !p-3 sm:!p-4">
    <div class="flex items-start justify-between gap-3"><div class="min-w-0"><p class="detail-eyebrow">Next checkpoint</p><h2 class="mt-1 text-lg font-bold tracking-[-0.035em] text-foreground">{nextMilestoneLabel}</h2></div><span class="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-accent" aria-hidden="true"><Flag size={15} /></span></div>
    <div class="mt-2"><div class="mb-1 flex justify-between text-xs text-muted"><span>Checkpoint progress</span><strong class="text-foreground">{milestoneProgress}%</strong></div><ProgressBar value={milestoneProgress} label="Checkpoint progress" showLabel={false} /></div>
    <p class="mt-2 text-xs leading-4 text-muted">{questCopy}</p>
  </Surface>
{/if}
