import React from 'react';
import {
  TrendingUpIcon,
  ZapIcon,
  FlameIcon,
  CalendarIcon,
  SearchIcon,
  TagIcon
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { CompletionRing } from '@/components/CompletionRing';
import { HABIT_COLOR_THEMES } from '@/lib/theme/habit-colors';
import type { Habit } from '@/types/habit';
import { invokeIfFunction } from '@/lib/callback';

type HabitStats = {
  completionRate: number;
  completedDays: number;
  longestStreak: number;
  currentStreak: number;
  weeklyData: Array<{ count: number }>;
};

type HabitStatEntry = {
  habit: Habit;
  stats: HabitStats;
};

type DailyDataPoint = {
  day: string;
  completed: number;
  total: number;
  rate: number;
};

type StatsViewProps = {
  navigate: (to: string) => void;
  avgRate: number;
  bestStreak: number;
  totalCompletions: number;
  currentStreaks: number;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  statusFilter: 'all' | 'active' | 'archived';
  setStatusFilter: (value: 'all' | 'active' | 'archived') => void;
  allTags: string[];
  selectedTags: string[];
  toggleTag: (tag: string) => void;
  dailyData: DailyDataPoint[];
  habitMonthlyData: Array<Record<string, string | number>>;
  filteredHabits: Habit[];
  sorted: HabitStatEntry[];
  allStats: HabitStatEntry[];
};

function CustomTooltip({
  active,
  payload,
  label
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bg-card border border-border rounded px-3 py-2 space-y-1">
        <p className="text-[10px] font-mono text-muted mb-1">{label}</p>
        {payload.map((p) => (
          <div key={p.name} className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-[10px] font-mono text-muted">{p.name}:</span>
            <span className="text-[10px] font-mono font-bold" style={{ color: p.color }}>
              {p.value}%
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

function DailyTooltip({
  active,
  payload,
  label
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bg-card border border-border rounded px-2 py-1.5">
        <p className="text-[10px] font-mono text-muted">{label}</p>
        <p className="text-xs font-mono font-bold text-accent">{payload[0].value}%</p>
      </div>
    );
  }
  return null;
}

function StatsHeader() {
  return (
    <div className="border-b border-border px-4 py-4">
      <div className="max-w-2xl mx-auto">
        <p className="text-[10px] font-mono text-muted uppercase tracking-widest mb-1">Overview</p>
        <h1 className="text-xl font-semibold text-foreground">Statistics</h1>
      </div>
    </div>
  );
}

function OverviewGrid({
  avgRate,
  bestStreak,
  totalCompletions,
  currentStreaks
}: Pick<StatsViewProps, 'avgRate' | 'bestStreak' | 'totalCompletions' | 'currentStreaks'>) {
  return (
    <div className="grid grid-cols-4 gap-2">
      <div className="bg-bg-secondary border border-border rounded-lg p-3">
        <div className="flex items-center gap-1 mb-2">
          <ZapIcon size={10} className="text-accent" />
          <span className="text-[9px] font-mono text-muted uppercase tracking-wider">Avg Rate</span>
        </div>
        <div className="text-xl font-mono font-bold text-accent" style={{ textShadow: '0 0 12px var(--glow)' }}>
          {avgRate}%
        </div>
      </div>
      <div className="bg-bg-secondary border border-border rounded-lg p-3">
        <div className="flex items-center gap-1 mb-2">
          <FlameIcon size={10} className="text-accent-secondary" />
          <span className="text-[9px] font-mono text-muted uppercase tracking-wider">Best</span>
        </div>
        <div className="text-xl font-mono font-bold text-accent-secondary">{bestStreak}d</div>
      </div>
      <div className="bg-bg-secondary border border-border rounded-lg p-3">
        <div className="flex items-center gap-1 mb-2">
          <TrendingUpIcon size={10} className="text-accent-secondary" />
          <span className="text-[9px] font-mono text-muted uppercase tracking-wider">Total</span>
        </div>
        <div
          className="text-xl font-mono font-bold text-accent-secondary"
          style={{ textShadow: '0 0 12px var(--glow-secondary)' }}
        >
          {totalCompletions}
        </div>
      </div>
      <div className="bg-bg-secondary border border-border rounded-lg p-3">
        <div className="flex items-center gap-1 mb-2">
          <CalendarIcon size={10} className="text-muted" />
          <span className="text-[9px] font-mono text-muted uppercase tracking-wider">Active</span>
        </div>
        <div className="text-xl font-mono font-bold text-foreground">{currentStreaks}</div>
      </div>
    </div>
  );
}

function FiltersPanel({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  allTags,
  selectedTags,
  toggleTag
}: Pick<
  StatsViewProps,
  'searchQuery' | 'setSearchQuery' | 'statusFilter' | 'setStatusFilter' | 'allTags' | 'selectedTags' | 'toggleTag'
>) {
  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-4 space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search habits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>

        <div className="flex bg-bg-card border border-border rounded-lg p-1">
          {(['all', 'active', 'archived'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-md text-xs font-mono capitalize transition-colors ${
                statusFilter === status ? 'bg-border text-foreground' : 'text-muted hover:text-foreground'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-2">
        <TagIcon size={14} className="text-muted mt-1 flex-shrink-0" />
        {allTags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => invokeIfFunction(toggleTag, tag)}
                className={`px-2 py-1 rounded border text-[10px] font-mono transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-accent/10 border-accent/30 text-accent'
                    : 'bg-bg-card border-border text-muted hover:border-border-hover hover:text-foreground'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        ) : (
          <span className="text-[11px] font-mono text-muted">No tags yet</span>
        )}
      </div>
    </div>
  );
}

function DailyRateChart({ avgRate, dailyData }: Pick<StatsViewProps, 'avgRate' | 'dailyData'>) {
  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-mono text-muted uppercase tracking-wider">Daily completion rate - 30 days</h2>
        <span className="text-[10px] font-mono text-accent">{avgRate}% avg</span>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={dailyData.filter((_, i) => i % 3 === 0)} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barSize={8}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
            axisLine={false}
            tickLine={false}
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<DailyTooltip />} />
          <Bar
            dataKey="rate"
            fill="var(--accent)"
            radius={[2, 2, 0, 0]}
            style={{ filter: 'drop-shadow(0 0 4px var(--glow))' }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function MonthlyRateChart({
  habitMonthlyData,
  filteredHabits
}: Pick<StatsViewProps, 'habitMonthlyData' | 'filteredHabits'>) {
  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-4">
      <h2 className="text-xs font-mono text-muted uppercase tracking-wider mb-4">Per-habit monthly rate</h2>
      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={habitMonthlyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            axisLine={false}
            tickLine={false}
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          {filteredHabits.map((h) => (
            <Line
              key={h.id}
              type="monotone"
              dataKey={h.name}
              stroke={HABIT_COLOR_THEMES[h.color].hex}
              strokeWidth={1.5}
              dot={{ fill: HABIT_COLOR_THEMES[h.color].hex, r: 2.5, strokeWidth: 0 }}
              activeDot={{ r: 4, fill: HABIT_COLOR_THEMES[h.color].hex }}
              style={{ filter: `drop-shadow(0 0 3px ${HABIT_COLOR_THEMES[h.color].hex}80)` }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function HabitPerformanceList({
  sorted,
  navigate
}: Pick<StatsViewProps, 'sorted' | 'navigate'>) {
  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-4">
      <h2 className="text-xs font-mono text-muted uppercase tracking-wider mb-3">Habit performance</h2>
      {sorted.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted font-mono">No habits match the current filters.</div>
      ) : (
        <div className="space-y-2">
          {sorted.map(({ habit, stats }, i) => {
            const hex = HABIT_COLOR_THEMES[habit.color].hex;
            return (
              <button
                key={habit.id}
                onClick={() => navigate(`/habit/${habit.id}`)}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-bg-card transition-colors text-left"
              >
                <span className="text-[10px] font-mono text-muted w-4">{i + 1}</span>
                <span className="text-base">{habit.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-foreground truncate">{habit.name}</span>
                    <span className="text-[10px] font-mono ml-2 flex-shrink-0" style={{ color: hex }}>
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
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <FlameIcon size={10} className="text-accent-secondary" />
                  <span className="text-[10px] font-mono text-accent-secondary">{stats.currentStreak}</span>
                </div>
                <CompletionRing percentage={stats.completionRate} size={28} strokeWidth={2} color={habit.color} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function WeeklyBreakdown({ allStats }: Pick<StatsViewProps, 'allStats'>) {
  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-4">
      <h2 className="text-xs font-mono text-muted uppercase tracking-wider mb-3">Weekly breakdown - last 12 weeks</h2>
      <div className="space-y-2">
        {allStats.map(({ habit, stats }) => (
          <div key={habit.id} className="flex items-center gap-3">
            <span className="text-sm w-5">{habit.icon}</span>
            <span className="text-[11px] text-muted w-20 truncate font-mono">{habit.name}</span>
            <div className="flex-1 flex items-end gap-[2px] h-6">
              {stats.weeklyData.map((w, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{
                    height: `${(w.count / 7) * 100}%`,
                    minHeight: 2,
                    backgroundColor: HABIT_COLOR_THEMES[habit.color].hex,
                    opacity: 0.3 + (i / 12) * 0.7
                  }}
                />
              ))}
            </div>
            <span className="text-[10px] font-mono w-8 text-right" style={{ color: HABIT_COLOR_THEMES[habit.color].hex }}>
              {stats.completionRate}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatsView(props: StatsViewProps) {
  return (
    <div className="min-h-screen bg-bg-primary pt-14">
      <StatsHeader />
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <OverviewGrid
          avgRate={props.avgRate}
          bestStreak={props.bestStreak}
          totalCompletions={props.totalCompletions}
          currentStreaks={props.currentStreaks}
        />
        <FiltersPanel
          searchQuery={props.searchQuery}
          setSearchQuery={props.setSearchQuery}
          statusFilter={props.statusFilter}
          setStatusFilter={props.setStatusFilter}
          allTags={props.allTags}
          selectedTags={props.selectedTags}
          toggleTag={props.toggleTag}
        />
        <DailyRateChart avgRate={props.avgRate} dailyData={props.dailyData} />
        <MonthlyRateChart habitMonthlyData={props.habitMonthlyData} filteredHabits={props.filteredHabits} />
        <HabitPerformanceList sorted={props.sorted} navigate={props.navigate} />
        <WeeklyBreakdown allStats={props.allStats} />
      </div>
    </div>
  );
}
