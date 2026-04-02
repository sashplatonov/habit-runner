import { FlameIcon, SparklesIcon } from 'lucide-react';
import { CompletionRing } from '@/components/CompletionRing';
import { ChartGuideTooltip } from '@/components/ChartGuideTooltip';
import { HABIT_COLOR_THEMES } from '@/lib/theme/habit-colors';
import type { StatsViewProps, Insight } from './StatsView';
import { INSIGHTS_TOOLTIP } from './blockGuideTooltips';
import { habitStatusLabel } from './StatsViewPanels.helpers';
export { DailyRateChart, PeriodTrendChart } from './StatsViewCharts';
export { PeriodSelector, FiltersPanel, HabitSortControls } from './StatsViewFilters';

export function InsightsRow({ insights }: { insights: Insight[] }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h2 className="text-xs font-mono text-muted uppercase tracking-wider">Insights</h2>
        <ChartGuideTooltip {...INSIGHTS_TOOLTIP} triggerClassName="h-7 w-7" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {insights.map((insight) => {
          const Icon = insight.icon ?? SparklesIcon;
          return (
            <div key={insight.id} className="bg-bg-secondary border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Icon size={16} className="text-accent flex-shrink-0" />
                <p className="text-[10px] font-mono text-muted uppercase tracking-[0.2em]">{insight.title}</p>
              </div>
              <p className="text-sm text-foreground">{insight.body}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// `DailyRateChart` is implemented in `StatsViewCharts.tsx` and re-exported above.

export function HabitPerformanceList({ sorted, navigate }: Pick<StatsViewProps, 'sorted' | 'navigate'>) {
  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-4 space-y-2">
      <div className="space-y-2">
        {sorted.map(({ habit, stats }, i) => {
          const color = HABIT_COLOR_THEMES[habit.color].hex;
          const status = habitStatusLabel(stats.completionRate, stats.currentStreak, stats.longestStreak);
          return (
            <button
              key={habit.id}
              onClick={() => navigate(`/habit/${habit.id}`)}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-bg-card transition-colors text-left"
            >
              <span className="text-[10px] font-mono text-muted w-4">{i + 1}</span>
              <span className="text-base">{habit.icon}</span>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-foreground truncate">{habit.name}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[9px] font-mono ${status.color}`}>{status.label}</span>
                    <span className="text-[10px] font-mono" style={{ color }}>
                      {stats.completionRate}%
                    </span>
                  </div>
                </div>
                <div className="h-1 bg-border rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${stats.completionRate}%`, backgroundColor: color, boxShadow: `0 0 6px ${color}60` }} />
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <FlameIcon size={12} className="text-accent-secondary" />
                <span className="text-[10px] font-mono text-accent-secondary">{stats.currentStreak}</span>
                <CompletionRing percentage={stats.completionRate} size={28} strokeWidth={2} color={habit.color} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function WeeklyBreakdown({ allStats }: Pick<StatsViewProps, 'allStats'>) {
  return (
    <div className="min-w-0 bg-bg-secondary border border-border rounded-lg p-4">
      <div className="mb-3 flex min-w-0 items-center gap-2">
        <h2 className="min-w-0 text-xs font-mono text-muted uppercase tracking-wider">Weekly breakdown</h2>
        <ChartGuideTooltip
          title="Weekly breakdown"
          summary="This compact view compares recent weekly volume for every habit so you can see which ones stay active and which ones fade out."
          focusPoints={[
            'Bar height: how many days the habit was completed that week.',
            'Latest bars: whether the habit is strengthening or cooling off now.',
            'Right-side percent: overall completion rate for quick ranking.'
          ]}
          variant="columns"
        />
      </div>
      <div className="space-y-3">
        {allStats.map(({ habit, stats }) => (
          <div key={habit.id} className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="w-5 flex-none text-sm">{habit.icon}</span>
            <span className="min-w-0 w-16 sm:w-20 truncate text-[11px] font-mono text-muted">{habit.name}</span>
            <div className="flex h-6 min-w-0 flex-1 items-center gap-1">
              {stats.weeklyData.map((week, index) => (
                <div
                  key={index}
                  className="flex-1 rounded-sm"
                  style={{
                    height: `${(week.count / 7) * 100}%`,
                    minHeight: 2,
                    backgroundColor: HABIT_COLOR_THEMES[habit.color].hex,
                    opacity: 0.3 + (index / 12) * 0.7
                  }}
                />
              ))}
            </div>
            <span className="w-8 flex-none text-right text-[10px] font-mono" style={{ color: HABIT_COLOR_THEMES[habit.color].hex }}>
              {stats.completionRate}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// `HabitSortControls` is implemented in `StatsViewFilters.tsx` and re-exported above.
