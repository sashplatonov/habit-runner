<script lang="ts">
  import ChartGuideTooltip from '$lib/components/ChartGuideTooltip.svelte';
  import { INSIGHTS_TOOLTIP } from '$lib/habits/blockGuideTooltips';
  import { Lightbulb, Flame, AlertTriangle, Zap } from 'lucide-svelte';

  type Insight = {
    id: string;
    title: string;
    body: string;
  };

  const ICON_MAP: Record<string, typeof Lightbulb> = {
    streak: Flame,
    weekday: AlertTriangle,
    momentum: Zap,
  };

  type Props = {
    insights: Insight[];
  };

  const { insights }: Props = $props();

  function getIcon(insight: Insight) {
    return ICON_MAP[insight.id] ?? Lightbulb;
  }
</script>

{#if insights.length > 0}
  <div class="space-y-2">
    <div class="flex items-center gap-2">
      <h2 class="text-xs font-mono uppercase tracking-wider text-muted">Insights</h2>
      <ChartGuideTooltip {...INSIGHTS_TOOLTIP} triggerClassName="h-7 w-7" />
    </div>
    <div class="grid gap-3 md:grid-cols-3">
      {#each insights as insight (insight.id)}
        {@const Icon = getIcon(insight)}
        <div class="rounded-[1.5rem] border border-border bg-bg-card/92 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] space-y-2">
          <div class="flex items-center gap-2">
            <Icon size={16} class="shrink-0 text-accent" />
            <p class="text-[10px] font-mono uppercase tracking-[0.2em] text-muted">{insight.title}</p>
          </div>
          <p class="text-sm text-foreground">{insight.body}</p>
        </div>
      {/each}
    </div>
  </div>
{/if}
