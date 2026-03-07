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
import { HABIT_COLOR_THEMES } from '@/lib/theme/habit-colors';
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
import { useNavigate } from '@/lib/router';
export function Stats() {
  const navigate = useNavigate();
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
        <div className="bg-bg-card border border-border rounded px-3 py-2 space-y-1">
          <p className="text-[10px] font-mono text-muted mb-1">{label}</p>
          {payload.map((p) =>
          <div key={p.name} className="flex items-center gap-2">
              <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: p.color
              }} />

              <span className="text-[10px] font-mono text-muted">
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
        <div className="bg-bg-card border border-border rounded px-2 py-1.5">
          <p className="text-[10px] font-mono text-muted">{label}</p>
          <p className="text-xs font-mono font-bold text-accent">
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
    <div className="min-h-screen bg-bg-primary pt-14">
      {/* Header */}
      <div className="border-b border-border px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-[10px] font-mono text-muted uppercase tracking-widest mb-1">
            Overview
          </p>
          <h1 className="text-xl font-semibold text-foreground">Statistics</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Top stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-bg-secondary border border-border rounded-lg p-3">
            <div className="flex items-center gap-1 mb-2">
              <ZapIcon size={10} className="text-accent" />
              <span className="text-[9px] font-mono text-muted uppercase tracking-wider">
                Avg Rate
              </span>
            </div>
            <div
              className="text-xl font-mono font-bold text-accent"
              style={{
                textShadow: '0 0 12px var(--glow)'
              }}>

              {avgRate}%
            </div>
          </div>
          <div className="bg-bg-secondary border border-border rounded-lg p-3">
            <div className="flex items-center gap-1 mb-2">
              <FlameIcon size={10} className="text-accent-secondary" />
              <span className="text-[9px] font-mono text-muted uppercase tracking-wider">
                Best
              </span>
            </div>
            <div className="text-xl font-mono font-bold text-accent-secondary">
              {bestStreak}d
            </div>
          </div>
          <div className="bg-bg-secondary border border-border rounded-lg p-3">
            <div className="flex items-center gap-1 mb-2">
              <TrendingUpIcon size={10} className="text-accent-secondary" />
              <span className="text-[9px] font-mono text-muted uppercase tracking-wider">
                Total
              </span>
            </div>
            <div
              className="text-xl font-mono font-bold text-accent-secondary"
              style={{
                textShadow: '0 0 12px var(--glow-secondary)'
              }}>

              {totalCompletions}
            </div>
          </div>
          <div className="bg-bg-secondary border border-border rounded-lg p-3">
            <div className="flex items-center gap-1 mb-2">
              <CalendarIcon size={10} className="text-muted" />
              <span className="text-[9px] font-mono text-muted uppercase tracking-wider">
                Active
              </span>
            </div>
            <div className="text-xl font-mono font-bold text-foreground">
              {currentStreaks}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-bg-secondary border border-border rounded-lg p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <SearchIcon
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />

              <input
                type="text"
                placeholder="Search habits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:border-accent/50 transition-colors" />

            </div>

            <div className="flex bg-bg-card border border-border rounded-lg p-1">
              {(['all', 'active', 'archived'] as const).map((status) =>
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-md text-xs font-mono capitalize transition-colors ${statusFilter === status ? 'bg-border text-foreground' : 'text-muted hover:text-foreground'}`}>

                  {status}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2">
            <TagIcon
              size={14}
              className="text-muted mt-1 flex-shrink-0" />

            {allTags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((tag) =>
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-2 py-1 rounded border text-[10px] font-mono transition-colors ${selectedTags.includes(tag) ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-bg-card border-border text-muted hover:border-border-hover hover:text-foreground'}`}>
                    #{tag}
                  </button>
                )}
              </div>
            ) : (
              <span className="text-[11px] font-mono text-muted">
                No tags yet
              </span>
            )}
          </div>
        </div>

        {/* Daily completion rate — 30 days */}
        <div className="bg-bg-secondary border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-mono text-muted uppercase tracking-wider">
              Daily completion rate — 30 days
            </h2>
            <span className="text-[10px] font-mono text-accent">
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
                stroke="var(--border)"
                vertical={false} />

              <XAxis
                dataKey="day"
                tick={{
                  fill: 'var(--text-muted)',
                  fontSize: 9,
                  fontFamily: 'JetBrains Mono'
                }}
                axisLine={false}
                tickLine={false} />

              <YAxis
                tick={{
                  fill: 'var(--text-muted)',
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
                fill="var(--accent)"
                radius={[2, 2, 0, 0]}
                style={{
                  filter: 'drop-shadow(0 0 4px var(--glow))'
                }} />

            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Per-habit trend lines */}
        <div className="bg-bg-secondary border border-border rounded-lg p-4">
          <h2 className="text-xs font-mono text-muted uppercase tracking-wider mb-4">
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
                stroke="var(--border)"
                vertical={false} />

              <XAxis
                dataKey="month"
                tick={{
                  fill: 'var(--text-muted)',
                  fontSize: 10,
                  fontFamily: 'JetBrains Mono'
                }}
                axisLine={false}
                tickLine={false} />

              <YAxis
                tick={{
                  fill: 'var(--text-muted)',
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
                stroke={HABIT_COLOR_THEMES[h.color].hex}
                strokeWidth={1.5}
                dot={{
                  fill: HABIT_COLOR_THEMES[h.color].hex,
                  r: 2.5,
                  strokeWidth: 0
                }}
                activeDot={{
                  r: 4,
                  fill: HABIT_COLOR_THEMES[h.color].hex
                }}
                style={{
                  filter: `drop-shadow(0 0 3px ${HABIT_COLOR_THEMES[h.color].hex}80)`
                }} />

              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Habit leaderboard */}
        <div className="bg-bg-secondary border border-border rounded-lg p-4">
          <h2 className="text-xs font-mono text-muted uppercase tracking-wider mb-3">
            Habit performance
          </h2>
          {sorted.length === 0 ?
          <div className="text-center py-8 text-sm text-muted font-mono">
              No habits match the current filters.
            </div> :

          <div className="space-y-2">
              {sorted.map(({ habit, stats }, i) => {
              const hex = HABIT_COLOR_THEMES[habit.color].hex;
              return (
                <button
                  key={habit.id}
                  onClick={() => navigate(`/habit/${habit.id}`)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-bg-card transition-colors text-left">

                    <span className="text-[10px] font-mono text-muted w-4">
                      {i + 1}
                    </span>
                    <span className="text-base">{habit.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-foreground truncate">
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
                      <div className="h-1 bg-border rounded-full overflow-hidden">
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
                      <FlameIcon size={10} className="text-accent-secondary" />
                      <span className="text-[10px] font-mono text-accent-secondary">
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
        <div className="bg-bg-secondary border border-border rounded-lg p-4">
          <h2 className="text-xs font-mono text-muted uppercase tracking-wider mb-3">
            Weekly breakdown — last 12 weeks
          </h2>
          <div className="space-y-2">
            {allStats.map(({ habit, stats }) =>
            <div key={habit.id} className="flex items-center gap-3">
                <span className="text-sm w-5">{habit.icon}</span>
                <span className="text-[11px] text-muted w-20 truncate font-mono">
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
                    backgroundColor: HABIT_COLOR_THEMES[habit.color].hex,
                    opacity: 0.3 + i / 12 * 0.7
                  }} />

                )}
                </div>
                <span
                className="text-[10px] font-mono w-8 text-right"
                style={{
                  color: HABIT_COLOR_THEMES[habit.color].hex
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
