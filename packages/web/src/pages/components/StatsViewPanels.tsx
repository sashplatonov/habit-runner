import { ArrowUpDownIcon, FlameIcon, SearchIcon, SparklesIcon, TagIcon, TrendingUpIcon, ZapIcon } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { CompletionRing } from '@/components/CompletionRing';
import { HABIT_COLOR_THEMES } from '@/lib/theme/habit-colors';
import { invokeIfFunction } from '@/lib/callback';
import type { Habit, StatsViewProps, Insight, PeriodOption } from './StatsView';

const PERIOD_OPTIONS: Array<{ id: PeriodOption; label: string }> = [
  { id: 'week', label: 'W' },
  { id: 'month', label: 'M' },
  { id: 'quarter', label: 'Q' },
  { id: 'year', label: 'Y' }
];

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

export function PeriodSelector({
  period,
  setPeriod
}: {
  period: PeriodOption;
  setPeriod: (value: PeriodOption) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-bg-card px-1 py-1">
      {PERIOD_OPTIONS.map((option) => (
        <button
          key={option.id}
          onClick={() => setPeriod(option.id)}
          className={`w-9 h-9 rounded-full text-xs font-mono transition-colors ${
            period === option.id ? 'bg-foreground text-bg-primary' : 'text-muted hover:text-foreground'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function FiltersPanel({
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

export function InsightsRow({ insights }: { insights: Insight[] }) {
  const iconMap: Record<string, JSX.Element> = {
    streak: <FlameIcon size={16} className="text-accent" />,
    weekday: <ZapIcon size={16} className="text-accent-secondary" />,
    momentum: <TrendingUpIcon size={16} className="text-accent-secondary" />
  };
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {insights.map((insight) => (
        <div key={insight.id} className="bg-bg-secondary border border-border rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            {iconMap[insight.id] || <SparklesIcon size={16} className="text-accent" />}
            <p className="text-[10px] font-mono text-muted uppercase tracking-[0.2em]">{insight.title}</p>
          </div>
          <p className="text-sm text-foreground">{insight.body}</p>
        </div>
      ))}
    </div>
  );
}

export function DailyRateChart({ avgRate, dailyData }: Pick<StatsViewProps, 'avgRate' | 'dailyData'>) {
  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-mono text-muted uppercase tracking-wider">Daily completion rate</h2>
        <span className="text-[10px] font-mono text-accent">{avgRate}% avg</span>
      </div>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={dailyData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }} barSize={7}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
          <Tooltip content={<DailyTooltip />} />
          <Bar dataKey="rate" fill="var(--accent)" radius={[4, 4, 0, 0]} style={{ filter: 'drop-shadow(0 0 6px var(--glow))' }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PeriodTrendChart({
  habitPeriodData,
  filteredHabits,
  hiddenHabits,
  toggleHabitVisibility
}: {
  habitPeriodData: Array<Record<string, string | number>>;
  filteredHabits: Habit[];
  hiddenHabits: string[];
  toggleHabitVisibility: (name: string) => void;
}) {
  const visibleHabits = filteredHabits.filter((habit) => !hiddenHabits.includes(habit.name));
  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xs font-mono text-muted uppercase tracking-wider">Period trends</h2>
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
              {habit.name}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={170}>
        <LineChart data={habitPeriodData} margin={{ top: 4, right: 4, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="period" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
          <Tooltip content={<CustomTooltip />} />
          {visibleHabits.map((habit) => (
            <Line
              key={habit.id}
              type="monotone"
              dataKey={habit.name}
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

export function HabitPerformanceList({ sorted, navigate }: Pick<StatsViewProps, 'sorted' | 'navigate'>) {
  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-4 space-y-2">
      <div className="space-y-2">
        {sorted.map(({ habit, stats }, i) => {
          const color = HABIT_COLOR_THEMES[habit.color].hex;
          return (
            <button
              key={habit.id}
              onClick={() => navigate(`/habit/${habit.id}`)}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-bg-card transition-colors text-left"
            >
              <span className="text-[10px] font-mono text-muted w-4">{i + 1}</span>
              <span className="text-base">{habit.icon}</span>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground truncate">{habit.name}</span>
                  <span className="text-[10px] font-mono" style={{ color }}>
                    {stats.completionRate}%
                  </span>
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
    <div className="bg-bg-secondary border border-border rounded-lg p-4">
      <h2 className="text-xs font-mono text-muted uppercase tracking-wider mb-3">Weekly breakdown</h2>
      <div className="space-y-3">
        {allStats.map(({ habit, stats }) => (
          <div key={habit.id} className="flex items-center gap-3">
            <span className="text-sm w-5">{habit.icon}</span>
            <span className="text-[11px] text-muted w-20 truncate font-mono">{habit.name}</span>
            <div className="flex-1 flex items-center gap-1 h-6">
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
            <span className="text-[10px] font-mono w-8 text-right" style={{ color: HABIT_COLOR_THEMES[habit.color].hex }}>
              {stats.completionRate}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HabitSortControls({
  habitSort,
  handleSortChange
}: {
  habitSort: 'rate' | 'streak' | 'name';
  handleSortChange: (key: 'rate' | 'streak' | 'name') => void;
}) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-mono">
      Sort by
      {(['rate', 'streak', 'name'] as const).map((key) => (
        <button
          key={key}
          onClick={() => handleSortChange(key)}
          className={`rounded-full px-3 py-1 text-[10px] transition-colors ${
            habitSort === key ? 'bg-border text-foreground' : 'text-muted hover:text-foreground'
          }`}
        >
          {key}
          {habitSort === key && <ArrowUpDownIcon size={12} className="inline-block ml-1 text-muted" />}
        </button>
      ))}
    </div>
  );
}
