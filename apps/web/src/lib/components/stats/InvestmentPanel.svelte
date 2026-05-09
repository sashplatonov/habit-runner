<script lang="ts">
  import ChartGuideTooltip from '$lib/components/ChartGuideTooltip.svelte';
  import type { WeekdayStats } from '$lib/stats/statsPage';
  import { getInvestmentColor, getInvestmentMessage } from '$lib/stats/StatsView.helpers';
  import { YOUR_INVESTMENT_TOOLTIP } from '$lib/habits/blockGuideTooltips';

  type Props = {
    weekdayStats: WeekdayStats;
  };

  const { weekdayStats }: Props = $props();

  const investmentColor = $derived(getInvestmentColor(weekdayStats.investmentPercent));
  const investmentMessage = $derived(getInvestmentMessage(weekdayStats.investmentPercent, weekdayStats.worstWeekday));
</script>

<div class="rounded-[1.5rem] border border-border bg-bg-card/92 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] space-y-4">
  <div class="flex items-center justify-between">
    <div>
      <div class="flex items-center gap-2">
        <h2 class="text-xs font-mono uppercase tracking-wider text-muted">Your Investment</h2>
        <ChartGuideTooltip {...YOUR_INVESTMENT_TOOLTIP} triggerClassName="h-7 w-7" />
      </div>
      <p class="mt-1 text-[10px] italic text-muted">Progress across habits this window</p>
    </div>
    <div class="text-2xl font-mono font-bold text-accent">{weekdayStats.investmentPercent}%</div>
  </div>

  <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
    <div class="rounded-[1rem] border border-border bg-bg-secondary/88 p-2.5 text-center">
      <p class="text-[8px] font-mono uppercase text-muted">Best Day</p>
      <p class="text-xs font-mono font-bold {weekdayStats.bestWeekday !== 'N/A' ? 'text-accent-secondary' : 'text-muted'}">{weekdayStats.bestWeekday !== 'N/A' ? weekdayStats.bestWeekday : '—'}</p>
    </div>
    <div class="rounded-[1rem] border border-border bg-bg-secondary/88 p-2.5 text-center">
      <p class="text-[8px] font-mono uppercase text-muted">Worst Day</p>
      <p class="text-xs font-mono font-bold {weekdayStats.worstWeekday !== 'N/A' ? 'text-muted' : 'text-muted/70'}">{weekdayStats.worstWeekday !== 'N/A' ? weekdayStats.worstWeekday : '—'}</p>
    </div>
    <div class="rounded-[1rem] border border-border bg-bg-secondary/88 p-2.5 text-center">
      <p class="text-[8px] font-mono uppercase text-muted">Active Days</p>
      <p class="text-xs font-mono font-bold text-foreground">{weekdayStats.totalActiveDays}d</p>
    </div>
  </div>

  <div class="h-1.5 overflow-hidden rounded-full bg-border">
    <div class="h-full bg-accent transition-all duration-1000" style:width={`${weekdayStats.investmentPercent}%`} style:box-shadow="0 0 10px var(--glow)"></div>
  </div>

  <p class="text-[10px] font-mono text-center" style:color={investmentColor}>{investmentMessage}</p>
</div>
