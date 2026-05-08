<script lang="ts">
  import { AlertTriangle, Calendar } from 'lucide-svelte';
  import type { WeekdayStats } from '$lib/stats/statsPage';
  import { getInvestmentColor, getInvestmentMessage } from '$lib/stats/StatsView.helpers';

  type Props = {
    weekdayStats: WeekdayStats;
    period: string;
    periodDisplayNames: Record<string, string>;
  };

  const { weekdayStats, period, periodDisplayNames }: Props = $props();

  const investmentColor = $derived(getInvestmentColor(weekdayStats.investmentPercent));
  const investmentMessage = $derived(getInvestmentMessage(weekdayStats.investmentPercent, weekdayStats.worstWeekday));
  const icon = $derived(weekdayStats.investmentPercent > 50 ? AlertTriangle : Calendar);
</script>

<div class="rounded-2xl border border-border bg-bg-card p-3">
  <div class="mb-2 flex items-center gap-2">
    <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 text-accent">
      <svelte:component this={icon} size={14} />
    </div>
    <div>
      <p class="text-[9px] font-mono uppercase tracking-[0.3em] text-muted">Investment</p>
      <p class="text-xs font-semibold text-foreground">{weekdayStats.investmentPercent}% of {periodDisplayNames[period] ?? period}</p>
    </div>
  </div>
  <div class="h-2 overflow-hidden rounded-full bg-bg-secondary">
    <div class="h-full rounded-full transition-all" style:width="{weekdayStats.investmentPercent}%" style:background-color={investmentColor}></div>
  </div>
  <p class="mt-2 text-[10px] leading-relaxed text-muted">{investmentMessage}</p>
</div>
