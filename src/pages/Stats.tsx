import React, { useMemo, useState } from 'react';
import {
  TrendingUpIcon,
  ZapIcon,
  FlameIcon,
  CalendarIcon,
  SearchIcon,
  TagIcon } from
'lucide-react';
import { useHabits } from '@/hooks/useHabits';
import { CompletionRing } from '@/components/CompletionRing';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid } from
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
  const { allHabits, getHabitStats } = useHabits();
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'archived'>(
    'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    allHabits.forEach((h) => h.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [allHabits]);

  const filteredHabits = useMemo(() => {
    return allHabits.filter((h) => {
      if (statusFilter === 'active' && h.archived) {return false;}
      if (statusFilter === 'archived' && !h.archived) {return false;}
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !h.name.toLowerCase().includes(query) &&
          !h.description.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      if (selectedTags.length > 0 && !selectedTags.some((t) => h.tags.includes(t))) {
        return false;
      }
      return true;
    });
  }, [allHabits, statusFilter, searchQuery, selectedTags]);

  const allStats = useMemo(
    () =>
    filteredHabits.map((h) => ({
      habit: h,
      stats: getHabitStats(h.id)
    })),
    [filteredHabits, getHabitStats]
  );

  const dailyData = useMemo(() => {
    return Array.from(
      {
        length: 30
      },
      (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        const key = date.toISOString().split('T')[0];
        const completed = filteredHabits.filter(
          (h) => h.completions[key]
        ).length;
        return {
          day: date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          }),
          completed,
          total: filteredHabits.length,
          rate:
          filteredHabits.length > 0 ?
          Math.round(completed / filteredHabits.length * 100) :
          0
        };
      }
    );
  }, [filteredHabits]);

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
        filteredHabits.forEach((h) => {
          let completed = 0;
          for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(
              monthDate.getFullYear(),
              monthDate.getMonth(),
              d
            );
            if (date > today) {break;}
            const key = date.toISOString().split('T')[0];
            if (h.completions[key]) {completed++;}
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
  }, [filteredHabits]);

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
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
    prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
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

        {/* Filters */}
        <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-lg p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <SearchIcon
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />

              <input
                type="text"
                placeholder="Search habits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#12121f] border border-[#1e1e2e] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-[#64748b] focus:outline-none focus:border-[#00d4ff]/50 transition-colors" />

            </div>

            <div className="flex bg-[#12121f] border border-[#1e1e2e] rounded-lg p-1">
              {(['all', 'active', 'archived'] as const).map((status) =>
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-md text-xs font-mono capitalize transition-colors ${statusFilter === status ? 'bg-[#1e1e2e] text-white' : 'text-[#64748b] hover:text-white'}`}>

                  {status}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2">
            <TagIcon
              size={14}
              className="text-[#64748b] mt-1 flex-shrink-0" />

            {allTags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((tag) =>
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-2 py-1 rounded border text-[10px] font-mono transition-colors ${selectedTags.includes(tag) ? 'bg-[#00d4ff]/10 border-[#00d4ff]/30 text-[#00d4ff]' : 'bg-[#12121f] border-[#1e1e2e] text-[#64748b] hover:border-[#2e2e3e] hover:text-white'}`}>
                    #{tag}
                  </button>
                )}
              </div>
            ) : (
              <span className="text-[11px] font-mono text-[#64748b]">
                No tags yet
              </span>
            )}
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
              {filteredHabits.map((h) =>
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
          {sorted.length === 0 ?
          <div className="text-center py-8 text-sm text-[#64748b] font-mono">
              No habits match the current filters.
            </div> :

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
          }
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
