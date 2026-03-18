import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpDownIcon,
  CalendarIcon,
  FilterIcon,
  FlameIcon,
  SearchIcon,
  SparklesIcon,
  TagIcon,
  TrendingUpIcon,
  ZapIcon
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

type PeriodOption = 'week' | 'month' | 'quarter' | 'year';

type Insight = {
  id: string;
  title: string;
  body: string;
};

type ActivityDay = {
  date: string;
  intensity: number;
  isFrozen: boolean;
  inWindow: boolean;
};

type ActivityWeek = {
  label: string;
  days: ActivityDay[];
};

const PERIOD_OPTIONS: Array<{ id: PeriodOption; label: string }> = [
  { id: 'week', label: 'W' },
  { id: 'month', label: 'M' },
  { id: 'quarter', label: 'Q' },
  { id: 'year', label: 'Y' }
];

const SECTION_CONFIGS = [
  { id: 'overview', label: 'Overview' },
  { id: 'charts', label: 'Charts' },
  { id: 'habits', label: 'Habits' },
  { id: 'activity', label: 'Activity' }
];

const HEATMAP_LEVELS = [0.18, 0.38, 0.62, 0.88];
const HEATMAP_MONTH_FORMATTER = new Intl.DateTimeFormat('en-US', { month: 'short' });
const HEATMAP_DAY_FORMATTER = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const HEATMAP_DAY_NUMBER_FORMATTER = new Intl.DateTimeFormat('en-US', { day: 'numeric' });

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
  habitPeriodData: Array<Record<string, string | number>>;
  filteredHabits: Habit[];
  sorted: HabitStatEntry[];
  allStats: HabitStatEntry[];
  bestWeekday: string;
  worstWeekday: string;
  investmentPercent: number;
  totalActiveDays: number;
  period: PeriodOption;
  setPeriod: (value: PeriodOption) => void;
  insights: Insight[];
  activityWeeks: ActivityWeek[];
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
      <div className="max-w-6xl mx-auto">
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
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <div className="bg-bg-secondary border border-border rounded-lg p-3">
        <div className="flex items-center gap-1 mb-2">
          <ZapIcon size={10} className="text-accent" />
          <span className="text-[9px] font-mono text-muted uppercase tracking-wider">Avg Rate</span>
        </div>
        <div className="text-2xl font-mono font-bold text-accent" style={{ textShadow: '0 0 12px var(--glow)' }}>
          {avgRate}%
        </div>
      </div>
      <div className="bg-bg-secondary border border-border rounded-lg p-3">
        <div className="flex items-center gap-1 mb-2">
          <FlameIcon size={10} className="text-accent-secondary" />
          <span className="text-[9px] font-mono text-muted uppercase tracking-wider">Best</span>
        </div>
        <div className="text-2xl font-mono font-bold text-accent-secondary">{bestStreak}d</div>
      </div>
      <div className="bg-bg-secondary border border-border rounded-lg p-3">
        <div className="flex items-center gap-1 mb-2">
          <TrendingUpIcon size={10} className="text-accent-secondary" />
          <span className="text-[9px] font-mono text-muted uppercase tracking-wider">Total</span>
        </div>
        <div
          className="text-2xl font-mono font-bold text-accent-secondary"
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
        <div className="text-2xl font-mono font-bold text-foreground">{currentStreaks}</div>
      </div>
    </div>
  );
}

function InvestmentSection({
  percent,
  totalDays,
  bestDay,
  worstDay
}: {
  percent: number;
  totalDays: number;
  bestDay: string;
  worstDay: string;
}) {
  const hasBestDay = bestDay !== 'N/A';
  const hasWorstDay = worstDay !== 'N/A';
  const displayBestDay = hasBestDay ? bestDay : '—';
  const displayWorstDay = hasWorstDay ? worstDay : '—';
  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-mono text-muted uppercase tracking-wider">Your Investment</h2>
          <p className="text-[10px] text-muted mt-1 italic">Progress across habits this window</p>
        </div>
        <div className="text-2xl font-mono font-bold text-accent">{percent}%</div>
      </div>
        <div className="grid grid-cols-3 gap-2">
        <div className="p-2 bg-bg-card border border-border rounded-lg text-center">
          <p className="text-[8px] font-mono text-muted uppercase">Best Day</p>
          <p
            className={`text-xs font-mono font-bold ${hasBestDay ? 'text-accent-secondary' : 'text-muted'}`}
            title={hasBestDay ? `Best day: ${bestDay}` : 'No data yet'}
          >
            {displayBestDay}
          </p>
        </div>
        <div className="p-2 bg-bg-card border border-border rounded-lg text-center">
          <p className="text-[8px] font-mono text-muted uppercase">Worst Day</p>
          <p
            className={`text-xs font-mono font-bold ${hasWorstDay ? 'text-muted' : 'text-muted/70'}`}
            title={hasWorstDay ? `Worst day: ${worstDay}` : 'No data yet'}
          >
            {displayWorstDay}
          </p>
        </div>
        <div className="p-2 bg-bg-card border border-border rounded-lg text-center">
          <p className="text-[8px] font-mono text-muted uppercase">Active Days</p>
          <p className="text-xs font-mono font-bold text-foreground">{totalDays}d</p>
        </div>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-accent transition-all duration-1000"
          style={{ width: `${percent}%`, boxShadow: `0 0 10px var(--glow)` }}
        />
      </div>
      <p className="text-[10px] font-mono text-muted text-center">
        You were active on {percent}% of days this window. Keep it up!
      </p>
    </div>
  );
}

export function StatsView(props: StatsViewProps) {
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const [activeSection, setActiveSection] = useState(SECTION_CONFIGS[0].id);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [hiddenHabits, setHiddenHabits] = useState<string[]>([]);
  const [habitSort, setHabitSort] = useState<'rate' | 'streak' | 'name'>('rate');
  const [habitSortDir, setHabitSortDir] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length > 0) {
          const topEntry = visible.reduce((prev, curr) =>
            prev.boundingClientRect.top < curr.boundingClientRect.top ? prev : curr
          );
          setActiveSection(topEntry.target.id);
        }
      },
      { threshold: 0.4, rootMargin: '-40% 0px -60% 0px' }
    );

    SECTION_CONFIGS.forEach((section) => {
      const ref = sectionRefs.current[section.id];
      if (ref) {
        observer.observe(ref);
      }
    });

    return () => observer.disconnect();
  }, []);

  const sortedStats = useMemo(() => {
    const entries = [...props.sorted];
    if (habitSort === 'name') {
      entries.sort((a, b) =>
        habitSortDir === 'asc'
          ? a.habit.name.localeCompare(b.habit.name)
          : b.habit.name.localeCompare(a.habit.name)
      );
    } else {
      const metric = habitSort === 'rate' ? 'completionRate' : 'longestStreak';
      entries.sort((a, b) => {
        const diff = b.stats[metric] - a.stats[metric];
        return habitSortDir === 'asc' ? -diff : diff;
      });
    }
    return entries;
  }, [props.sorted, habitSort, habitSortDir]);

  const toggleHabitVisibility = (name: string) => {
    setHiddenHabits((prev) => (prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]));
  };

  const handleSortChange = (key: 'rate' | 'streak' | 'name') => {
    if (habitSort === key) {
      setHabitSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setHabitSort(key);
      setHabitSortDir('desc');
    }
  };

  const scrollToSection = (id: string) => {
    const el = sectionRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <StatsHeader />
      <div className="sticky top-0 z-30 border-b border-border bg-bg-primary/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {SECTION_CONFIGS.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`rounded-full px-3 py-1 text-[11px] font-mono transition-colors ${
                  activeSection === section.id
                    ? 'bg-bg-card text-foreground'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <PeriodSelector period={props.period} setPeriod={props.setPeriod} />
            <button
              onClick={() => setFiltersOpen((prev) => !prev)}
              className="rounded-full border border-border px-3 py-1 text-xs font-mono flex items-center gap-2 text-muted hover:text-foreground"
            >
              <FilterIcon size={14} />
              Filters
            </button>
          </div>
        </div>
        {filtersOpen && (
          <div className="px-4 pb-4">
            <FiltersPanel
              searchQuery={props.searchQuery}
              setSearchQuery={props.setSearchQuery}
              statusFilter={props.statusFilter}
              setStatusFilter={props.setStatusFilter}
              allTags={props.allTags}
              selectedTags={props.selectedTags}
              toggleTag={props.toggleTag}
            />
          </div>
        )}
      </div>
      <div className="max-w-6xl mx-auto px-4 py-4 space-y-8">
        <section
          id="overview"
          ref={(el) => {
            sectionRefs.current.overview = el;
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
            <OverviewGrid
              avgRate={props.avgRate}
              bestStreak={props.bestStreak}
              totalCompletions={props.totalCompletions}
              currentStreaks={props.currentStreaks}
            />
            <InvestmentSection
              percent={props.investmentPercent}
              totalDays={props.totalActiveDays}
              bestDay={props.bestWeekday}
              worstDay={props.worstWeekday}
            />
          </div>
          <InsightsRow insights={props.insights} />
        </section>
        <section
          id="charts"
          ref={(el) => {
            sectionRefs.current.charts = el;
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <DailyRateChart avgRate={props.avgRate} dailyData={props.dailyData} />
            <PeriodTrendChart
              habitPeriodData={props.habitPeriodData}
              filteredHabits={props.filteredHabits}
              hiddenHabits={hiddenHabits}
              toggleHabitVisibility={toggleHabitVisibility}
            />
          </div>
        </section>
        <section
          id="habits"
          ref={(el) => {
            sectionRefs.current.habits = el;
          }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xs font-mono text-muted uppercase tracking-wider">Habit performance</h2>
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
                  {habitSort === key && (
                    <ArrowUpDownIcon size={12} className="inline-block ml-1 text-muted" />
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
            <HabitPerformanceList sorted={sortedStats} navigate={props.navigate} />
            <WeeklyBreakdown allStats={props.allStats} />
          </div>
        </section>
        <section
          id="activity"
          ref={(el) => {
            sectionRefs.current.activity = el;
          }}
          className="space-y-4"
        >
            <ActivityHeatmap weeks={props.activityWeeks} period={props.period} />
        </section>
      </div>
    </div>
  );
}

function PeriodSelector({
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
        {(allTags || []).length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {(allTags || []).map((tag) => (
              <button
                key={tag}
                onClick={() => invokeIfFunction(toggleTag, tag)}
                className={`px-2 py-1 rounded border text-[10px] font-mono transition-colors ${
                  (selectedTags || []).includes(tag)
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

function InsightsRow({ insights }: { insights: Insight[] }) {
  const iconMap: Record<string, JSX.Element> = {
    streak: <FlameIcon size={16} className="text-accent" />,
    weekday: <ZapIcon size={16} className="text-accent-secondary" />,
    momentum: <TrendingUpIcon size={16} className="text-accent-secondary" />
  };
  const safeInsights = Array.isArray(insights) ? insights : [];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {safeInsights.map((insight) => (
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

function DailyRateChart({ avgRate, dailyData }: Pick<StatsViewProps, 'avgRate' | 'dailyData'>) {
  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-mono text-muted uppercase tracking-wider">Daily completion rate</h2>
        <span className="text-[10px] font-mono text-accent">{avgRate}% avg</span>
      </div>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={dailyData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }} barSize={7}>
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
            radius={[4, 4, 0, 0]}
            style={{ filter: 'drop-shadow(0 0 6px var(--glow))' }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function PeriodTrendChart({
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
  const safeFilteredHabits = Array.isArray(filteredHabits) ? filteredHabits : [];
  const visibleHabits = safeFilteredHabits.filter((habit) => !hiddenHabits.includes(habit.name));
  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xs font-mono text-muted uppercase tracking-wider">Period trends</h2>
          <p className="text-[10px] font-mono text-muted">Tap to hide/show habits</p>
        </div>
        <div className="flex flex-wrap gap-2 max-w-full">
          {safeFilteredHabits.map((habit) => (
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
          <XAxis
            dataKey="period"
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

function HabitPerformanceList({ sorted, navigate }: Pick<StatsViewProps, 'sorted' | 'navigate'>) {
  const safeSorted = Array.isArray(sorted) ? sorted : [];
  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-4 space-y-2">
      <div className="space-y-2">
        {safeSorted.map(({ habit, stats }, i) => {
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
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${stats.completionRate}%`,
                      backgroundColor: color,
                      boxShadow: `0 0 6px ${color}60`
                    }}
                  />
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

function WeeklyBreakdown({ allStats }: Pick<StatsViewProps, 'allStats'>) {
  const safeAllStats = Array.isArray(allStats) ? allStats : [];
  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-4">
      <h2 className="text-xs font-mono text-muted uppercase tracking-wider mb-3">Weekly breakdown</h2>
      <div className="space-y-3">
        {safeAllStats.map(({ habit, stats }) => (
          <div key={habit.id} className="flex items-center gap-3">
            <span className="text-sm w-5">{habit.icon}</span>
            <span className="text-[11px] text-muted w-20 truncate font-mono">{habit.name}</span>
            <div className="flex-1 flex items-center gap-1 h-6">
              {(Array.isArray(stats.weeklyData) ? stats.weeklyData : []).map((week, index) => (
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

const HEATMAP_ROW_LABELS: Record<PeriodOption, string[]> = {
  week: ['Week'],
  month: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  quarter: ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'],
  year: ['Mon', '', '', 'Thu', '', '', 'Sun']
};

const HEATMAP_SUMMARIES: Record<PeriodOption, string> = {
  week: '7 days across the current window',
  month: 'Daily grid grouped by week',
  quarter: 'Three months compressed into weekly columns',
  year: 'Full-year overview with monthly anchors'
};

type HeatmapAxisLabel = {
  label: string;
  sublabel?: string;
};

type HeatmapLayout = {
  cells: ActivityDay[][];
  rowLabels: string[];
  columnLabels: HeatmapAxisLabel[];
};

function heatOpacity(intensity: number, maxIntensity: number): number {
  if (intensity <= 0 || maxIntensity <= 0) {
    return 0.12;
  }
  const r = intensity / maxIntensity;
  if (r <= 0.25) {
    return HEATMAP_LEVELS[0];
  }
  if (r <= 0.5) {
    return HEATMAP_LEVELS[1];
  }
  if (r <= 0.75) {
    return HEATMAP_LEVELS[2];
  }
  return HEATMAP_LEVELS[3];
}

function parseHeatmapDate(date: string) {
  return new Date(`${date}T00:00:00`);
}

function buildWeekHeatmapLayout(days: ActivityDay[]): HeatmapLayout {
  const visibleDays = days.filter((day) => day?.inWindow);
  return {
    cells: [visibleDays],
    rowLabels: HEATMAP_ROW_LABELS.week,
    columnLabels: visibleDays.map((day, index) => ({
      label: HEATMAP_ROW_LABELS.month[index] ?? '',
      sublabel: day?.date ? HEATMAP_DAY_NUMBER_FORMATTER.format(parseHeatmapDate(day.date)) : ''
    }))
  };
}

function buildWeekColumnLabels(weeks: ActivityWeek[]): HeatmapAxisLabel[] {
  const cols = weeks.length;
  if (cols === 0) {
    return [];
  }

  if (cols <= 6) {
    return weeks.map((week) => {
      const first = week?.days?.find((day) => day?.inWindow);
      return {
        label: first?.date ? HEATMAP_DAY_FORMATTER.format(parseHeatmapDate(first.date)) : ''
      };
    });
  }

  const every = cols <= 14 ? 2 : 4;
  return weeks.map((week, index) => {
    if (index % every !== 0 && index !== cols - 1) {
      return { label: '' };
    }
    const first = week?.days?.find((day) => day?.inWindow);
    return {
      label: first?.date ? HEATMAP_DAY_FORMATTER.format(parseHeatmapDate(first.date)) : ''
    };
  });
}

function buildMonthColumnLabels(weeks: ActivityWeek[]): HeatmapAxisLabel[] {
  let lastMonth = -1;
  return weeks.map((week) => {
    const first = week?.days?.find((day) => day?.inWindow);
    if (!first?.date) {
      return { label: '' };
    }
    const date = parseHeatmapDate(first.date);
    const month = date.getMonth();
    const showMonth = month !== lastMonth;
    lastMonth = month;
    return {
      label: showMonth ? HEATMAP_MONTH_FORMATTER.format(date) : '',
      sublabel: showMonth ? HEATMAP_DAY_NUMBER_FORMATTER.format(date) : ''
    };
  });
}

function buildGenericHeatmapLayout(weeks: ActivityWeek[], period: Exclude<PeriodOption, 'week'>): HeatmapLayout {
  const rowCount = 7;
  return {
    cells: Array.from({ length: rowCount }, (_, rowIndex) =>
      weeks.map((week) => week?.days?.[rowIndex]).filter((day): day is ActivityDay => Boolean(day))
    ),
    rowLabels: HEATMAP_ROW_LABELS[period],
    columnLabels: period === 'month' ? buildWeekColumnLabels(weeks) : buildMonthColumnLabels(weeks)
  };
}

function buildHeatmapLayout(weeks: ActivityWeek[], period: PeriodOption): HeatmapLayout {
  if (period === 'week') {
    return buildWeekHeatmapLayout(Array.isArray(weeks[0]?.days) ? weeks[0].days : []);
  }

  return buildGenericHeatmapLayout(weeks, period);
}

function heatmapCellColor(day: ActivityDay, maxIntensity: number) {
  const baseColor = day.isFrozen ? 'rgb(96 165 250)' : 'var(--accent)';
  return {
    backgroundColor: day.inWindow ? baseColor : 'var(--bg-card)',
    opacity: day.inWindow ? heatOpacity(day.intensity ?? 0, maxIntensity) : 0.16
  };
}

function ActivityHeatmap({ weeks, period }: { weeks: ActivityWeek[]; period: PeriodOption }) {
  const safeWeeks = Array.isArray(weeks) ? weeks : [];
  const allDays = safeWeeks.flatMap((w) => (Array.isArray(w?.days) ? w.days : []));
  const inWindow = allDays.filter((d) => d?.inWindow);
  const maxIntensity = inWindow.length > 0 ? Math.max(0, ...inWindow.map((d) => d.intensity ?? 0)) : 0;
  const layout = buildHeatmapLayout(safeWeeks, period);
  const rows = layout.cells.length;
  const cols = layout.cells[0]?.length ?? 0;

  if (inWindow.length === 0) {
    return (
      <div className="bg-bg-secondary border border-border rounded-lg p-3">
        <h2 className="text-xs font-mono text-muted uppercase tracking-wider mb-2">Focus intensity</h2>
        <p className="text-[11px] font-mono text-muted">Complete habits to see activity here.</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xs font-mono text-muted uppercase tracking-wider">Focus intensity</h2>
          <p className="text-[10px] font-mono text-muted">{HEATMAP_SUMMARIES[period]}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-muted">
          <div className="flex items-center gap-2">
            <span>low</span>
            {HEATMAP_LEVELS.map((lvl, i) => (
              <span key={i} className="block aspect-square w-3 rounded-[3px] bg-accent" style={{ opacity: lvl }} />
            ))}
            <span>high</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="block aspect-square w-3 rounded-[3px] bg-blue-400 opacity-40" />
            <span>frozen</span>
          </div>
          <span>{maxIntensity > 0 ? `peak ${maxIntensity}` : 'no data'}</span>
        </div>
      </div>
      <div className="grid grid-cols-[auto,minmax(0,1fr)] gap-x-3 gap-y-2">
        <div />
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${Math.max(cols, 1)}, minmax(0, 1fr))` }}
        >
          {layout.columnLabels.map((entry, index) => (
            <div key={`col-${index}`} className="min-w-0 text-center">
              <p className="truncate text-[8px] font-mono uppercase tracking-[0.16em] text-muted">{entry.label}</p>
              {entry.sublabel ? <p className="text-[9px] font-mono text-muted/80">{entry.sublabel}</p> : null}
            </div>
          ))}
        </div>
        <div
          className="grid gap-1"
          style={{ gridTemplateRows: `repeat(${Math.max(rows, 1)}, minmax(0, 1fr))` }}
        >
          {layout.rowLabels.map((label, index) => (
            <div key={`row-${index}`} className="flex items-center justify-end pr-1">
              <span className="text-[9px] font-mono uppercase tracking-[0.16em] text-muted">{label}</span>
            </div>
          ))}
        </div>
        <div
          className="grid w-full gap-1"
          style={{
            gridTemplateColumns: `repeat(${Math.max(cols, 1)}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${Math.max(rows, 1)}, minmax(0, 1fr))`
          }}
        >
          {layout.cells.flatMap((row, rowIndex) =>
            row.map((day, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}-${day.date}`}
                title={`${HEATMAP_DAY_FORMATTER.format(parseHeatmapDate(day.date))}: ${day.intensity} completed${day.isFrozen ? ' • frozen' : ''}`}
                className="aspect-square w-full rounded-[4px] transition-opacity"
                style={heatmapCellColor(day, maxIntensity)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
