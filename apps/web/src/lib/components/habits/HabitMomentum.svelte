<script lang="ts">
  import { Flag, Flame, ShieldCheck, Sparkles, Trophy } from 'lucide-svelte';
  import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
  import StatusPill from '$lib/components/ui/StatusPill.svelte';
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
  };

  const {
    currentStreak,
    hasCompletionHistory,
    streakLabel,
    bestLabel,
    completionRateLabel,
    nextMilestoneLabel,
    nextMilestoneDays,
    nextMilestoneTarget
  }: Props = $props();

  const milestoneProgress = $derived(
    nextMilestoneTarget === null ? 100 : Math.round((currentStreak / Math.max(1, nextMilestoneTarget)) * 100)
  );
  const questCopy = $derived(
    nextMilestoneDays === null
      ? 'You reached every consistency checkpoint. Keep the routine comfortable.'
      : nextMilestoneDays === 1
        ? 'One scheduled completion unlocks this checkpoint.'
        : `${nextMilestoneDays} scheduled completions unlock this checkpoint.`
  );
</script>

<Surface
  as="section"
  padding="lg"
  class="overflow-hidden"
  style="background: linear-gradient(135deg, var(--bg-card), color-mix(in srgb, var(--bg-card) 84%, var(--progress) 16%));"
>
  <div class="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-stretch">
    <div class="relative overflow-hidden rounded-[1.5rem] border border-progress/25 bg-bg-card/80 p-5">
      <div class="absolute -right-8 -top-10 size-32 rounded-full bg-progress/10 blur-2xl" aria-hidden="true"></div>
      <div class="relative">
        <StatusPill tone={currentStreak > 0 ? 'progress' : 'neutral'}>
          <Flame size={12} aria-hidden="true" />
          Current run
        </StatusPill>

        <p class="mt-5 text-4xl font-semibold tracking-[-0.05em] text-foreground sm:text-5xl">{streakLabel}</p>
        <p class="mt-2 max-w-xs text-sm leading-6 text-muted">
          {currentStreak > 0
            ? 'A truthful count of consecutive scheduled opportunities completed.'
            : 'Complete the next scheduled step to start a new run.'}
        </p>

        {#if hasCompletionHistory}
          <div class="mt-5 flex flex-wrap gap-2">
            <span class="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-secondary px-3 py-1.5 text-xs text-muted">
              <Trophy size={12} aria-hidden="true" />
              {bestLabel}
            </span>
            <span class="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-secondary px-3 py-1.5 text-xs text-muted">
              <ShieldCheck size={12} aria-hidden="true" />
              {completionRateLabel}
            </span>
          </div>
        {/if}
      </div>
    </div>

    <div class="flex flex-col justify-between rounded-[1.5rem] border border-border bg-bg-secondary/80 p-5">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-[10px] font-mono uppercase tracking-[0.24em] text-muted">Next checkpoint</p>
          <h2 class="mt-2 text-xl font-semibold tracking-tight text-foreground">{nextMilestoneLabel}</h2>
        </div>
        <span class="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-progress/25 bg-progress/10 text-progress" aria-hidden="true">
          {#if nextMilestoneDays === null}
            <Sparkles size={18} />
          {:else}
            <Flag size={18} />
          {/if}
        </span>
      </div>

      <div class="mt-7">
        <ProgressBar value={milestoneProgress} label="Checkpoint progress" />
        <p class="mt-3 text-sm leading-6 text-muted">{questCopy}</p>
      </div>
    </div>
  </div>
</Surface>
