import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ChartGuideTooltip } from '@/components/ChartGuideTooltip';
import { formatHabitLabel } from '@/lib/habits/formatHabitLabel';
import { HABIT_COLOR_THEMES } from '@/lib/theme/habit-colors';
import type { Habit, PeriodOption, DailyDataPoint } from './StatsView';
import { buildQuarterTickMeta, buildDailyChartInsight, parseQuarterPeriodLabel, formatQuarterWeekLabel } from './StatsViewPanels.helpers';

type TooltipPayload = { name: string; value: number; color: string };
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (active && Array.isArray(payload) && payload.length) {
    return (
      <div className="bg-bg-card border border-border rounded px-3 py-2 space-y-1">
        <p className="text-[10px] font-mono text-muted mb-1">{label}</p>
        {payload.map((p) => (
          <div key={p.name} className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-[10px] font-mono text-muted">{p.name}:</span>
            <span className="text-[10px] font-mono font-bold" style={{ color: p.color }}>{p.value}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

function DailyTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; payload?: { day?: string } }>; label?: string }) {
  if (active && Array.isArray(payload) && payload.length) {
    const dayLabel = payload[0]?.payload?.day ?? label ?? '';
    return (
      <div className="bg-bg-card border border-border rounded px-2 py-1.5">
        <p className="text-[10px] font-mono text-muted">{dayLabel}</p>
        <p className="text-xs font-mono font-bold text-accent">{payload[0].value}%</p>
      </div>
    );
  }
  return null;
}

export function DailyRateChart({ avgRate, dailyData, period }: { avgRate: number; dailyData: DailyDataPoint[]; period: PeriodOption; }) {
  const insight = buildDailyChartInsight(avgRate, dailyData);
  const quarterTickMeta = period === 'quarter'
    ? buildQuarterTickMeta(dailyData.map((entry) => String(entry.axisLabel ?? '')))
    : undefined;
  const dailyXAxisProps = period === 'quarter'
    ? {
        height: 44,
        interval: 0 as const,
        minTickGap: 0,
        tick: <QuarterXAxisTick tickMeta={quarterTickMeta ?? new Map()} />
      }
    : {
        tick: { fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }
      };
  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-mono text-muted uppercase tracking-wider">Daily completion rate</h2>
          <ChartGuideTooltip
            title="Daily completion rate"
            summary="This chart shows how consistently you finished scheduled habits each day in the selected period."
            focusPoints={['Average rate: your baseline consistency for this window.','Low bars or gaps: days where routine friction is breaking momentum.','Clusters of strong days: patterns worth repeating.']}
            variant="bars"
          />
        </div>
        <span className="text-[10px] font-mono text-accent">{avgRate}% avg</span>
      </div>
      <p className="text-[10px] font-mono text-muted mb-3">Tap to hide/show habits</p>
      <ResponsiveContainer width="100%" height={150}>
          <BarChart data={dailyData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }} barSize={7}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="axisLabel"
            {...dailyXAxisProps}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
          <Tooltip content={<DailyTooltip />} />
          <Bar dataKey="rate" fill="var(--accent)" radius={[4, 4, 0, 0]} style={{ filter: 'drop-shadow(0 0 6px var(--glow))' }} />
        </BarChart>
      </ResponsiveContainer>
      <div className={`flex items-center gap-1 mt-3 ${insight.color}`}>
        <insight.icon size={10} className="flex-shrink-0" />
        <p className="text-[10px] font-mono">{insight.text}</p>
      </div>
    </div>
  );
}

export function PeriodTrendChart({
  habitPeriodData,
  filteredHabits,
  hiddenHabits,
  toggleHabitVisibility,
  period
}: {
  habitPeriodData: Array<Record<string, string | number>>;
  filteredHabits: Habit[];
  hiddenHabits: string[];
  toggleHabitVisibility: (name: string) => void;
  period: PeriodOption;
}) {
  const visibleHabits = filteredHabits.filter((habit) => !hiddenHabits.includes(habit.name));
  const quarterTickMeta = period === 'quarter'
    ? buildQuarterTickMeta(habitPeriodData.map((entry) => String(entry.period ?? '')))
    : undefined;
  const trendXAxisProps = period === 'quarter'
    ? {
        height: 44,
        interval: 0 as const,
        minTickGap: 0,
        tick: <QuarterXAxisTick tickMeta={quarterTickMeta ?? new Map()} />
      }
    : {
        tick: { fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }
      };
  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-mono text-muted uppercase tracking-wider">Period trends</h2>
            <ChartGuideTooltip
              title="Period trends"
              summary="Each line tracks how one habit performs over time, so you can compare momentum and spot drop-offs early."
              focusPoints={[
                'Trend direction: rising lines usually mean the habit is stabilizing.',
                'Line crossings: habits changing rank or losing priority.',
                'Flat low lines: habits that may need a simpler schedule or target.'
              ]}
              variant="line"
            />
          </div>
          <p className="text-[10px] font-mono text-muted">Tap to hide/show habits</p>
        </div>
        <div className="flex flex-wrap gap-2 max-w-full">
          {filteredHabits.map((habit) => (
            <button
              key={habit.id}
              onClick={() => toggleHabitVisibility(habit.name)}
              className={`rounded-full px-3 py-1 text-[10px] font-mono border transition-colors ${
                hiddenHabits.includes(habit.name)
                  ? 'border-border text-muted bg-bg-card'
                  : 'border-accent/40 bg-accent/10 text-accent'
              }`}
            >
              {formatHabitLabel(habit)}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={170}>
        <LineChart data={habitPeriodData} margin={{ top: 4, right: 4, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="period"
            {...trendXAxisProps}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
          <Tooltip content={<CustomTooltip />} />
          {visibleHabits.map((habit) => (
            <Line
              key={habit.id}
              type="monotone"
              dataKey={habit.name}
              name={formatHabitLabel(habit)}
              stroke={HABIT_COLOR_THEMES[habit.color].hex}
              strokeWidth={2}
              dot={{ r: 3, fill: HABIT_COLOR_THEMES[habit.color].hex, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              style={{ filter: `drop-shadow(0 0 6px ${HABIT_COLOR_THEMES[habit.color].hex}55)` }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function QuarterXAxisTick({ x, y, payload, tickMeta }: { x?: number; y?: number; payload?: { value?: string | number; index?: number }; tickMeta: Map<number, { monthLabel?: string; weekLabel: string }>; }) {
  if (typeof x !== 'number' || typeof y !== 'number' || !payload || payload.value === null || payload.value === undefined) {
    return null;
  }
  const entry = typeof payload.index === 'number' ? tickMeta.get(payload.index) : undefined;
  const fallback = parseQuarterPeriodLabel(String(payload.value));
  const weekLabel = formatQuarterWeekLabel(entry?.weekLabel ?? fallback.weekLabel);
  const monthLabel = entry?.monthLabel;
  return (
    <g transform={`translate(${x},${y + 8})`}>
      <text textAnchor="middle" fontFamily="JetBrains Mono" fontSize={10} fill="var(--text-muted)">
        {weekLabel}
        {monthLabel ? (
          <tspan x="0" dy="12">
            {monthLabel}
          </tspan>
        ) : null}
      </text>
    </g>
  );
}

// named exports only

