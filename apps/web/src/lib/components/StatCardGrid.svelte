<script lang="ts">
  import { Calendar, Flame, Target, TrendingUp } from 'lucide-svelte';
  import type { HabitStats } from '@/types/habit';
  import { HABIT_PHASES, getHabitPhase } from '$lib/habits/phases';
  import {
    getBestHint,
    getHabitAgeDays,
    getRateColor,
    getRateHint,
    getRateWindowLabel,
    getStreakHint,
    getTotalHint
  } from '$lib/habits/detailHints';
  import type { HabitColorTheme } from '$lib/theme/habit-colors';
  import ChartGuideTooltip from '$lib/components/ChartGuideTooltip.svelte';

  type Props = {
    stats: Pick<HabitStats, 'currentStreak' | 'longestStreak' | 'completionRate' | 'completedDays'>;
    accent: HabitColorTheme;
    habitCreatedAt: string;
  };

  const { stats, accent, habitCreatedAt }: Props = $props();

  const habitAgeDays = $derived(getHabitAgeDays(habitCreatedAt));
  const rateWindowLabel = $derived(getRateWindowLabel(habitAgeDays));
  const streakHint = $derived(getStreakHint(stats.currentStreak, stats.longestStreak));
  const bestHint = $derived(getBestHint(stats.longestStreak));
  const rateHint = $derived(getRateHint(habitAgeDays, stats.completionRate));
  const totalHint = $derived(getTotalHint(stats.completedDays));
  const rateHintColor = $derived(getRateColor(habitAgeDays, stats.completionRate));
  const phase = $derived(getHabitPhase(stats.currentStreak));

  const cards = $derived([
    {
      key: 'streak',
      icon: Flame,
      label: 'Streak',
      value: stats.currentStreak,
      unit: 'days',
      hint: streakHint,
      hintColor:
        stats.currentStreak === 0
          ? 'text-accent-secondary'
          : stats.currentStreak >= stats.longestStreak
            ? 'text-accent'
            : 'text-muted'
    },
    {
      key: 'best',
      icon: Target,
      label: 'Best',
      value: stats.longestStreak,
      unit: 'days',
      hint: bestHint,
      hintColor:
        stats.longestStreak >= 21
          ? 'text-accent'
          : stats.longestStreak >= 7
            ? 'text-accent-secondary'
            : 'text-muted'
    },
    {
      key: 'rate',
      icon: TrendingUp,
      label: 'Rate',
      value: `${stats.completionRate}%`,
      unit: rateWindowLabel,
      hint: rateHint,
      hintColor: rateHintColor
    },
    {
      key: 'total',
      icon: Calendar,
      label: 'Total',
      value: stats.completedDays,
      unit: 'days',
      hint: totalHint,
      hintColor: stats.completedDays >= 100 ? 'text-accent' : 'text-muted'
    }
  ]);
</script>

<div class="space-y-2">
  <div class="flex items-center gap-2">
    <h2 class="text-xs font-mono uppercase tracking-wider text-muted">Key metrics</h2>
    <ChartGuideTooltip
      title="Key metrics"
      summary="These four cards give you the essential snapshot for one habit: live streak, personal best, completion reliability, and total volume."
      focusPoints={[
        'Streak: whether the habit still has live momentum.',
        'Best and rate: compare current form against your baseline ceiling.',
        'Total completions: long-term proof that repetitions are accumulating.'
      ]}
      variant="columns"
      triggerClassName="h-7 w-7"
    />
  </div>

  <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
    {#each cards as card, cardIndex (card.key + '-' + cardIndex)}
      {@const CardIcon = card.icon}
      {@const HintIcon = card.hint.icon}
      {@const PhaseIcon = phase.icon}
      <div class="rounded-lg border border-border bg-bg-secondary p-3">
        <div class="mb-2 flex items-center gap-1">
          <span style:color={card.key === 'best' ? accent.hex : undefined}>
            <CardIcon
              size={10}
              class={card.key === 'rate' || card.key === 'streak' ? 'text-accent-secondary' : card.key === 'total' ? 'text-muted' : ''}
            />
          </span>
          <span class="text-[9px] font-mono uppercase tracking-wider text-muted">{card.label}</span>
          {#if card.key === 'streak'}
            <span class="ml-auto">
              <ChartGuideTooltip
                title="Adaptive phases"
                summary="Your streak passes through 4 science-backed phases. Each phase changes what skipping a day actually means for your habit."
                focusPoints={HABIT_PHASES.map((entry) => `${entry.name} (${entry.range}d): ${entry.description}. ${entry.hint}.`)}
                variant="columns"
                triggerClassName="h-5 w-5"
              />
            </span>
          {/if}
        </div>

        <div
          class="text-xl font-mono font-bold {card.key === 'streak' ? 'text-accent-secondary' : card.key === 'total' ? 'text-foreground' : ''}"
          style:color={card.key === 'best' ? accent.hex : undefined}
        >
          {card.value}
        </div>

        <div class="text-[9px] font-mono text-muted">{card.unit}</div>

        {#if card.key === 'streak' && stats.currentStreak > 0}
          <div class="mb-0.5 mt-0.5 flex items-center gap-0.5">
            <PhaseIcon size={8} class="flex-shrink-0 text-muted" />
            <span class="text-[9px] font-mono text-muted">{phase.name}</span>
          </div>
        {/if}

        <div class="mt-1 flex items-center gap-0.5 {card.hintColor}">
          <HintIcon size={8} class="flex-shrink-0" />
          <span class="text-[9px] font-mono">{card.hint.text}</span>
        </div>
      </div>
    {/each}
  </div>
</div>