<script lang="ts">
  import Surface from '$lib/components/ui/Surface.svelte';

  type Props = {
    streakLabel: string;
    bestLabel: string;
    phaseLabel: string;
    phaseHint: string;
    completionRateLabel: string;
    nextMilestoneLabel: string;
    nextMilestoneDays: number | null;
  };

  const {
    streakLabel,
    bestLabel,
    phaseLabel,
    phaseHint,
    completionRateLabel,
    nextMilestoneLabel,
    nextMilestoneDays
  }: Props = $props();
</script>

<Surface as="section" padding="lg" class="space-y-4">
  <div>
    <p class="text-[10px] font-mono uppercase tracking-[0.24em] text-muted">Momentum</p>
    <h2 class="mt-1 text-base font-semibold text-foreground">Current progress without pressure</h2>
  </div>

  <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <div class="rounded-[1.25rem] border border-border bg-bg-secondary px-4 py-3">
      <p class="text-[10px] font-mono uppercase tracking-[0.2em] text-muted">Current streak</p>
      <p class="mt-1 text-lg font-semibold text-foreground">{streakLabel}</p>
    </div>
    <div class="rounded-[1.25rem] border border-border bg-bg-secondary px-4 py-3">
      <p class="text-[10px] font-mono uppercase tracking-[0.2em] text-muted">Best run</p>
      <p class="mt-1 text-lg font-semibold text-foreground">{bestLabel}</p>
    </div>
    <div class="rounded-[1.25rem] border border-border bg-bg-secondary px-4 py-3">
      <p class="text-[10px] font-mono uppercase tracking-[0.2em] text-muted">Phase</p>
      <p class="mt-1 text-lg font-semibold text-foreground">{phaseLabel}</p>
      <p class="text-xs text-muted">{phaseHint}</p>
    </div>
    <div class="rounded-[1.25rem] border border-border bg-bg-secondary px-4 py-3">
      <p class="text-[10px] font-mono uppercase tracking-[0.2em] text-muted">Rate</p>
      <p class="mt-1 text-lg font-semibold text-foreground">{completionRateLabel}</p>
      <p class="text-xs text-muted">{nextMilestoneLabel}{#if nextMilestoneDays !== null} · {nextMilestoneDays} day{nextMilestoneDays === 1 ? '' : 's'} away{/if}</p>
    </div>
  </div>
</Surface>
