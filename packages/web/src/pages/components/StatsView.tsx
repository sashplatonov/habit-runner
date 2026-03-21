import { useMemo, useState } from 'react';
import { CalendarIcon, FilterIcon, FlameIcon, TrendingUpIcon, ZapIcon } from 'lucide-react';
import type { Habit } from '@/types/habit';
import { PeriodSelector, FiltersPanel, InsightsRow, DailyRateChart, PeriodTrendChart, HabitPerformanceList, WeeklyBreakdown, HabitSortControls } from './StatsViewPanels';
import { HabitHeatmap } from '@/components/HabitHeatmap';

export type HabitStats = {
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

export type PeriodOption = 'week' | 'month' | 'quarter' | 'year';

export type Insight = {
  id: string;
  title: string;
  body: string;
};

export type ActivityDay = {
  date: string;
  intensity: number;
  isFrozen: boolean;
  inWindow: boolean;
};

export type ActivityWeek = {
  label: string;
  days: ActivityDay[];
};

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'charts', label: 'Charts' },
  { id: 'habits', label: 'Habits' },
  { id: 'activity', label: 'Activity' }
] as const;

type TabId = (typeof TABS)[number]['id'];

export type StatsViewProps = {
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
  dailyHabitDetails: Record<string, string[]>;
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
      <p className="text-[10px] font-mono text-center" style={{ color: percent >= 70 ? 'var(--accent)' : percent >= 40 ? 'var(--accent-secondary)' : 'var(--text-muted)' }}>
        {percent >= 80
          ? `Active ${percent}% of days — excellent consistency!`
          : percent >= 60
            ? `Active ${percent}% of days. Try filling the gaps on ${worstDay !== 'N/A' ? worstDay : 'your slow days'}.`
            : percent >= 30
              ? `Active ${percent}% of days — build a daily routine to improve this.`
              : `Only ${percent}% active. Start with completing just one habit per day.`}
      </p>
    </div>
  );
}

function StatsTabBar({
  activeTab,
  setActiveTab,
  filtersOpen,
  setFiltersOpen,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  allTags,
  selectedTags,
  toggleTag
}: {
  activeTab: TabId;
  setActiveTab: (id: TabId) => void;
  filtersOpen: boolean;
  setFiltersOpen: React.Dispatch<React.SetStateAction<boolean>>;
} & Pick<
  StatsViewProps,
  'searchQuery' | 'setSearchQuery' | 'statusFilter' | 'setStatusFilter' | 'allTags' | 'selectedTags' | 'toggleTag'
>) {
  return (
    <div className="sticky top-0 z-30 border-b border-border bg-bg-primary/95 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-1">
          {/* Tabs */}
          <div className="flex flex-1 min-w-0">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-4 py-3 text-xs font-mono transition-colors whitespace-nowrap ${
                    isActive
                      ? 'text-foreground'
                      : 'text-muted hover:text-foreground/70'
                  }`}
                >
                  {tab.label}
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-accent"
                      style={{ boxShadow: '0 0 6px var(--glow)' }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 py-2 pl-2">
            <button
              onClick={() => setFiltersOpen((prev) => !prev)}
              className={`rounded-full border px-3 py-1 text-xs font-mono flex items-center gap-1.5 transition-colors ${
                filtersOpen
                  ? 'border-accent text-accent'
                  : 'border-border text-muted hover:text-foreground'
              }`}
            >
              <FilterIcon size={12} />
              Filters
            </button>
          </div>
        </div>
      </div>
      {filtersOpen && (
        <div className="border-t border-border px-4 py-3 max-w-6xl mx-auto">
          <FiltersPanel
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            allTags={allTags}
            selectedTags={selectedTags}
            toggleTag={toggleTag}
          />
        </div>
      )}
    </div>
  );
}

function TabOverview({
  avgRate,
  bestStreak,
  totalCompletions,
  currentStreaks,
  investmentPercent,
  totalActiveDays,
  bestWeekday,
  worstWeekday,
  insights
}: Pick<
  StatsViewProps,
  'avgRate' | 'bestStreak' | 'totalCompletions' | 'currentStreaks' | 'investmentPercent' | 'totalActiveDays' | 'bestWeekday' | 'worstWeekday' | 'insights'
>) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
        <OverviewGrid avgRate={avgRate} bestStreak={bestStreak} totalCompletions={totalCompletions} currentStreaks={currentStreaks} />
        <InvestmentSection percent={investmentPercent} totalDays={totalActiveDays} bestDay={bestWeekday} worstDay={worstWeekday} />
      </div>
      <InsightsRow insights={insights} />
    </div>
  );
}

function TabCharts({
  avgRate,
  dailyData,
  habitPeriodData,
  filteredHabits,
  period,
  setPeriod
}: Pick<StatsViewProps, 'avgRate' | 'dailyData' | 'habitPeriodData' | 'filteredHabits' | 'period' | 'setPeriod'>) {
  const [hiddenHabits, setHiddenHabits] = useState<string[]>([]);
  const toggleHabitVisibility = (name: string) => {
    setHiddenHabits((prev) => (prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]));
  };
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <PeriodSelector period={period} setPeriod={setPeriod} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <DailyRateChart avgRate={avgRate} dailyData={dailyData} />
        <PeriodTrendChart
          habitPeriodData={habitPeriodData}
          filteredHabits={filteredHabits}
          hiddenHabits={hiddenHabits}
          toggleHabitVisibility={toggleHabitVisibility}
        />
      </div>
    </div>
  );
}

function TabHabits({ navigate, allStats, sorted }: Pick<StatsViewProps, 'navigate' | 'allStats' | 'sorted'>) {
  const [habitSort, setHabitSort] = useState<'rate' | 'streak' | 'name'>('rate');
  const [habitSortDir, setHabitSortDir] = useState<'desc' | 'asc'>('desc');
  const sortedStats = useMemo(() => {
    const entries = [...sorted];
    if (habitSort === 'name') {
      entries.sort((a, b) => habitSortDir === 'asc' ? a.habit.name.localeCompare(b.habit.name) : b.habit.name.localeCompare(a.habit.name));
    } else {
      const metric = habitSort === 'rate' ? 'completionRate' : 'longestStreak';
      entries.sort((a, b) => habitSortDir === 'asc' ? a.stats[metric] - b.stats[metric] : b.stats[metric] - a.stats[metric]);
    }
    return entries;
  }, [sorted, habitSort, habitSortDir]);
  const handleSortChange = (key: 'rate' | 'streak' | 'name') => {
    if (habitSort === key) { setHabitSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc')); }
    else { setHabitSort(key); setHabitSortDir('desc'); }
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xs font-mono text-muted uppercase tracking-wider">Habit performance</h2>
        <HabitSortControls habitSort={habitSort} handleSortChange={handleSortChange} />
      </div>
      <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
        <HabitPerformanceList sorted={sortedStats} navigate={navigate} />
        <WeeklyBreakdown allStats={allStats} />
      </div>
    </div>
  );
}

function TabActivity({
  filteredHabits,
  dailyHabitDetails
}: Pick<StatsViewProps, 'filteredHabits' | 'dailyHabitDetails'>) {
  const mergedCompletions = useMemo(() => {
    const merged: Record<string, number> = {};
    for (const habit of filteredHabits) {
      for (const [date, count] of Object.entries(habit.completions)) {
        merged[date] = (merged[date] ?? 0) + count;
      }
    }
    return merged;
  }, [filteredHabits]);

  const aggregateTarget = Math.max(
    1,
    filteredHabits.reduce((sum, habit) => sum + Math.max(1, habit.dailyTarget ?? 1), 0)
  );

  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-mono text-muted uppercase tracking-wider">Activity — 90 days</h2>
        <span className="text-[10px] font-mono text-muted">{filteredHabits.length} habits</span>
      </div>
      <HabitHeatmap
        completions={mergedCompletions}
        dailyTarget={aggregateTarget}
        dayDetails={dailyHabitDetails}
      />
    </div>
  );
}

export function StatsView(props: StatsViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg-primary">
      <StatsHeader />
      <StatsTabBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        filtersOpen={filtersOpen}
        setFiltersOpen={setFiltersOpen}
        searchQuery={props.searchQuery}
        setSearchQuery={props.setSearchQuery}
        statusFilter={props.statusFilter}
        setStatusFilter={props.setStatusFilter}
        allTags={props.allTags}
        selectedTags={props.selectedTags}
        toggleTag={props.toggleTag}
      />
      <div className="max-w-6xl mx-auto px-4 py-4">
        {activeTab === 'overview' && (
          <TabOverview
            avgRate={props.avgRate}
            bestStreak={props.bestStreak}
            totalCompletions={props.totalCompletions}
            currentStreaks={props.currentStreaks}
            investmentPercent={props.investmentPercent}
            totalActiveDays={props.totalActiveDays}
            bestWeekday={props.bestWeekday}
            worstWeekday={props.worstWeekday}
            insights={props.insights}
          />
        )}
        {activeTab === 'charts' && (
          <TabCharts
            avgRate={props.avgRate}
            dailyData={props.dailyData}
            habitPeriodData={props.habitPeriodData}
            filteredHabits={props.filteredHabits}
            period={props.period}
            setPeriod={props.setPeriod}
          />
        )}
        {activeTab === 'habits' && (
          <TabHabits
            navigate={props.navigate}
            allStats={props.allStats}
            sorted={props.sorted}
          />
        )}
        {activeTab === 'activity' && (
          <TabActivity filteredHabits={props.filteredHabits} dailyHabitDetails={props.dailyHabitDetails} />
        )}
      </div>
    </div>
  );
}
