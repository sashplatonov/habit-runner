<script lang="ts">
  import type { Insight } from '$lib/stats/statsPage';
  import { Lightbulb, Flame, Dumbbell, Sprout, AlertTriangle, Calendar, Zap, TrendingUp, TrendingDown } from 'lucide-svelte';

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
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {#each insights as insight (insight.id)}
      <div class="flex items-start gap-3 rounded-2xl border border-border bg-bg-card p-3">
        <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <svelte:component this={getIcon(insight)} size={14} />
        </div>
        <div>
          <p class="text-[9px] font-mono uppercase tracking-[0.3em] text-muted">{insight.title}</p>
          <p class="mt-0.5 text-xs leading-relaxed text-foreground">{insight.body}</p>
        </div>
      </div>
    {/each}
  </div>
{/if}
