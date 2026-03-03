import React, { useMemo } from 'react';
import { TrendingUpIcon, ZapIcon, FlameIcon, CalendarIcon } from 'lucide-react';
import { useHabits } from '../hooks/useHabits';
import { CompletionRing } from '../components/CompletionRing';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend } from
'recharts';
interface StatsProps {
  onNavigate: (view: string, habitId?: string) => void;
}
const colorHex: Record<string, string> = {
  blue: '#00d4ff',
  green: '#00ff88',
  purple: '#a855f7',
  orange: '#f97316',
  red: '#ef4444',
  cyan: '#22d3ee'
};
export function Stats({ onNavigate }: StatsProps) {
  const { habits, getHabitStats } = useHabits();
  const allStats = useMemo(
    () =>
    habits.map((h) => ({
      habit: h,
      stats: getHabitStats(h.id)
    })),
    [habits, getHabitStats]
  );
  // Overall completion rate over last 30 days
  const dailyData = useMemo(() => {
    return Array.from(
      {
        length: 30
      },
      (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        const key = date.toISOString().split('T')[0];
        const completed = habits.filter((h) => h.completions[key]).length;
        return {
          day: date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          }),
          completed,
          total: habits.length,
          rate:
          habits.length > 0 ?
          Math.round(completed / habits.length * 100) :
          0
        };
      }
    );
  }, [habits]);
  // Per-habit monthly rates
  const habitMonthlyData = useMemo(() => {
    const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'];

    const today = new Date();
    return Array.from(
      {
        length: 6
      },
      (_, m) => {
        const monthDate = new Date(
          today.getFullYear(),
          today.getMonth() - (5 - m),
          1
        );
        const daysInMonth = new Date(
          monthDate.getFullYear(),
          monthDate.getMonth() + 1,
          0
        ).getDate();
        const entry: Record<string, string | number> = {
          month: monthNames[monthDate.getMonth()]
        };
        habits.forEach((h) => {
          let completed = 0;
          for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(
              monthDate.getFullYear(),
              monthDate.getMonth(),
              d
            );
            if (date > today) break;
            const key = date.toISOString().split('T')[0];
            if (h.completions[key]) completed++;
          }
          const daysElapsed =
          monthDate.getMonth() === today.getMonth() ?
          today.getDate() :
          daysInMonth;
          entry[h.name] = Math.round(
            completed / Math.max(1, daysElapsed) * 100
          );
        });
        return entry;
      }
    );
  }, [habits]);
  // Best performers
  const sorted = [...allStats].sort(
    (a, b) => b.stats.completionRate - a.stats.completionRate
  );
  const totalCompletions = allStats.reduce(
    (sum, { stats }) => sum + stats.completedDays,
    0
  );
  const avgRate =
  allStats.length > 0 ?
  Math.round(
    allStats.reduce((sum, { stats }) => sum + stats.completionRate, 0) /
    allStats.length
  ) :
  0;
  const bestStreak = Math.max(
    ...allStats.map(({ stats }) => stats.longestStreak),
    0
  );
  const currentStreaks = allStats.reduce(
    (sum, { stats }) => sum + (stats.currentStreak > 0 ? 1 : 0),
    0
  );
  const CustomTooltip = ({
    active,
    payload,
    label








  }: {active?: boolean;payload?: {name: string;value: number;color: string;}[];label?: string;}) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#12121f] border border-[#1e1e2e] rounded px-3 py-2 space-y-1">
          <p className="text-[10px] font-mono text-[#64748b] mb-1">{label}</p>
          {payload.map((p) =>
          <div key={p.name} className="flex items-center gap-2">
              <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: p.color
              }} />

              <span className="text-[10px] font-mono text-[#64748b]">
                {p.name}:
              </span>
              <span
              className="text-[10px] font-mono font-bold"
              style={{
                color: p.color
              }}>

                {p.value}%
              </span>
            </div>
          )}
        </div>);

    }
    return null;
  };
  const DailyTooltip = ({
    active,
    payload,
    label






  }: {active?: boolean;payload?: {value: number;}[];label?: string;}) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#12121f] border border-[#1e1e2e] rounded px-2 py-1.5">
          <p className="text-[10px] font-mono text-[#64748b]">{label}</p>
          <p className="text-xs font-mono font-bold text-[#00d4ff]">
            {payload[0].value}%
          </p>
        </div>);

    }
    return null;
  };
  return (
    <div className="min-h-screen bg-[#080810] pt-14">
      {/* Header */}
      <div className="border-b border-[#1e1e2e] px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-[10px] font-mono text-[#64748b] uppercase tracking-widest mb-1">
            Overview
          </p>
          <h1 className="text-xl font-semibold text-white">Statistics</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Top stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-lg p-3">
            <div className="flex items-center gap-1 mb-2">
              <ZapIcon size={10} className="text-[#00d4ff]" />
              <span className="text-[9px] font-mono text-[#64748b] uppercase tracking-wider">
                Avg Rate
              </span>
            </div>
            <div
              className="text-xl font-mono font-bold text-[#00d4ff]"
              style={{
                textShadow: '0 0 12px rgba(0,212,255,0.4)'
              }}>

              {avgRate}%
            </div>
          </div>
          <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-lg p-3">
            <div className="flex items-center gap-1 mb-2">
              <FlameIcon size={10} className="text-orange-400" />
              <span className="text-[9px] font-mono text-[#64748b] uppercase tracking-wider">
                Best
              </span>
            </div>
            <div className="text-xl font-mono font-bold text-orange-400">
              {bestStreak}d
            </div>
          </div>
          <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-lg p-3">
            <div className="flex items-center gap-1 mb-2">
              <TrendingUpIcon size={10} className="text-[#00ff88]" />
              <span className="text-[9px] font-mono text-[#64748b] uppercase tracking-wider">
                Total
              </span>
            </div>
            <div
              className="text-xl font-mono font-bold text-[#00ff88]"
              style={{
                textShadow: '0 0 12px rgba(0,255,136,0.4)'
              }}>

              {totalCompletions}
            </div>
          </div>
          <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-lg p-3">
            <div className="flex items-center gap-1 mb-2">
              <CalendarIcon size={10} className="text-[#64748b]" />
              <span className="text-[9px] font-mono text-[#64748b] uppercase tracking-wider">
                Active
              </span>
            </div>
            <div className="text-xl font-mono font-bold text-white">
              {currentStreaks}
            </div>
          </div>
        </div>

        {/* Daily completion rate — 30 days */}
        <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-mono text-[#64748b] uppercase tracking-wider">
              Daily completion rate — 30 days
            </h2>
            <span className="text-[10px] font-mono text-[#00d4ff]">
              {avgRate}% avg
            </span>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart
              data={dailyData.filter((_, i) => i % 3 === 0)}
              margin={{
                top: 4,
                right: 4,
                bottom: 0,
                left: -20
              }}
              barSize={8}>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e1e2e"
                vertical={false} />

              <XAxis
                dataKey="day"
                tick={{
                  fill: '#64748b',
                  fontSize: 9,
                  fontFamily: 'JetBrains Mono'
                }}
                axisLine={false}
                tickLine={false} />

              <YAxis
                tick={{
                  fill: '#64748b',
                  fontSize: 9,
                  fontFamily: 'JetBrains Mono'
                }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`} />

              <Tooltip content={<DailyTooltip />} />
              <Bar
                dataKey="rate"
                fill="#00d4ff"
                radius={[2, 2, 0, 0]}
                style={{
                  filter: 'drop-shadow(0 0 4px rgba(0,212,255,0.4))'
                }} />

            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Per-habit trend lines */}
        <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-lg p-4">
          <h2 className="text-xs font-mono text-[#64748b] uppercase tracking-wider mb-4">
            Per-habit monthly rate
          </h2>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart
              data={habitMonthlyData}
              margin={{
                top: 4,
                right: 4,
                bottom: 0,
                left: -20
              }}>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e1e2e"
                vertical={false} />

              <XAxis
                dataKey="month"
                tick={{
                  fill: '#64748b',
                  fontSize: 10,
                  fontFamily: 'JetBrains Mono'
                }}
                axisLine={false}
                tickLine={false} />

              <YAxis
                tick={{
                  fill: '#64748b',
                  fontSize: 10,
                  fontFamily: 'JetBrains Mono'
                }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`} />

              <Tooltip content={<CustomTooltip />} />
              {habits.map((h) =>
              <Line
                key={h.id}
                type="monotone"
                dataKey={h.name}
                stroke={colorHex[h.color]}
                strokeWidth={1.5}
                dot={{
                  fill: colorHex[h.color],
                  r: 2.5,
                  strokeWidth: 0
                }}
                activeDot={{
                  r: 4,
                  fill: colorHex[h.color]
                }}
                style={{
                  filter: `drop-shadow(0 0 3px ${colorHex[h.color]}80)`
                }} />

              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Habit leaderboard */}
        <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-lg p-4">
          <h2 className="text-xs font-mono text-[#64748b] uppercase tracking-wider mb-3">
            Habit performance
          </h2>
          <div className="space-y-2">
            {sorted.map(({ habit, stats }, i) => {
              const hex = colorHex[habit.color];
              return (
                <button
                  key={habit.id}
                  onClick={() => onNavigate('detail', habit.id)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#12121f] transition-colors text-left">

                  <span className="text-[10px] font-mono text-[#64748b] w-4">
                    {i + 1}
                  </span>
                  <span className="text-base">{habit.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-white truncate">
                        {habit.name}
                      </span>
                      <span
                        className="text-[10px] font-mono ml-2 flex-shrink-0"
                        style={{
                          color: hex
                        }}>

                        {stats.completionRate}%
                      </span>
                    </div>
                    <div className="h-1 bg-[#1e1e2e] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${stats.completionRate}%`,
                          backgroundColor: hex,
                          boxShadow: `0 0 6px ${hex}60`
                        }} />

                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <FlameIcon size={10} className="text-orange-400" />
                    <span className="text-[10px] font-mono text-orange-400">
                      {stats.currentStreak}
                    </span>
                  </div>
                  <CompletionRing
                    percentage={stats.completionRate}
                    size={28}
                    strokeWidth={2}
                    color={habit.color} />

                </button>);

            })}
          </div>
        </div>

        {/* Weekly heatmap summary */}
        <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-lg p-4">
          <h2 className="text-xs font-mono text-[#64748b] uppercase tracking-wider mb-3">
            Weekly breakdown — last 12 weeks
          </h2>
          <div className="space-y-2">
            {allStats.map(({ habit, stats }) =>
            <div key={habit.id} className="flex items-center gap-3">
                <span className="text-sm w-5">{habit.icon}</span>
                <span className="text-[11px] text-[#64748b] w-20 truncate font-mono">
                  {habit.name}
                </span>
                <div className="flex-1 flex items-end gap-[2px] h-6">
                  {stats.weeklyData.map((w, i) =>
                <div
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{
                    height: `${w.count / 7 * 100}%`,
                    minHeight: 2,
                    backgroundColor: colorHex[habit.color],
                    opacity: 0.3 + i / 12 * 0.7
                  }} />

                )}
                </div>
                <span
                className="text-[10px] font-mono w-8 text-right"
                style={{
                  color: colorHex[habit.color]
                }}>

                  {stats.completionRate}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>);

}