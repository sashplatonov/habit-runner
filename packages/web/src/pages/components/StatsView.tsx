import { useEffect, useMemo, useRef, useState } from 'react';
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

const SECTION_CONFIGS = [
  { id: 'overview', label: 'Overview' },
  { id: 'charts', label: 'Charts' },
  { id: 'habits', label: 'Habits' },
  { id: 'activity', label: 'Activity' }
];

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
      <p className="text-[10px] font-mono text-muted text-center">
        You were active on {percent}% of days this window. Keep it up!
      </p>
    </div>
  );
}

function StatsToolbar({
  activeSection,
  scrollToSection,
  period,
  setPeriod,
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
  activeSection: string;
  scrollToSection: (id: string) => void;
  filtersOpen: boolean;
  setFiltersOpen: React.Dispatch<React.SetStateAction<boolean>>;
} & Pick<
  StatsViewProps,
  'period' | 'setPeriod' | 'searchQuery' | 'setSearchQuery' | 'statusFilter' | 'setStatusFilter' | 'allTags' | 'selectedTags' | 'toggleTag'
>) {
  return (
    <div className="sticky top-0 z-30 border-b border-border bg-bg-primary/95 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {SECTION_CONFIGS.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`rounded-full px-3 py-1 text-[11px] font-mono transition-colors ${
                activeSection === section.id ? 'bg-bg-card text-foreground' : 'text-muted hover:text-foreground'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <PeriodSelector period={period} setPeriod={setPeriod} />
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

function StatsOverviewSection({
  sectionRef,
  avgRate,
  bestStreak,
  totalCompletions,
  currentStreaks,
  investmentPercent,
  totalActiveDays,
  bestWeekday,
  worstWeekday,
  insights
}: {
  sectionRef: (el: HTMLElement | null) => void;
} & Pick<
  StatsViewProps,
  'avgRate' | 'bestStreak' | 'totalCompletions' | 'currentStreaks' | 'investmentPercent' | 'totalActiveDays' | 'bestWeekday' | 'worstWeekday' | 'insights'
>) {
  return (
    <section id="overview" ref={sectionRef} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
        <OverviewGrid avgRate={avgRate} bestStreak={bestStreak} totalCompletions={totalCompletions} currentStreaks={currentStreaks} />
        <InvestmentSection percent={investmentPercent} totalDays={totalActiveDays} bestDay={bestWeekday} worstDay={worstWeekday} />
      </div>
      <InsightsRow insights={insights} />
    </section>
  );
}

function StatsChartsSection({
  sectionRef,
  avgRate,
  dailyData,
  habitPeriodData,
  filteredHabits
}: {
  sectionRef: (el: HTMLElement | null) => void;
} & Pick<StatsViewProps, 'avgRate' | 'dailyData' | 'habitPeriodData' | 'filteredHabits'>) {
  const [hiddenHabits, setHiddenHabits] = useState<string[]>([]);
  const toggleHabitVisibility = (name: string) => {
    setHiddenHabits((prev) => (prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]));
  };
  return (
    <section id="charts" ref={sectionRef} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <DailyRateChart avgRate={avgRate} dailyData={dailyData} />
        <PeriodTrendChart
          habitPeriodData={habitPeriodData}
          filteredHabits={filteredHabits}
          hiddenHabits={hiddenHabits}
          toggleHabitVisibility={toggleHabitVisibility}
        />
      </div>
    </section>
  );
}

function StatsHabitsSection({
  sectionRef,
  navigate,
  allStats,
  sorted
}: {
  sectionRef: (el: HTMLElement | null) => void;
} & Pick<StatsViewProps, 'navigate' | 'allStats' | 'sorted'>) {
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
    <section id="habits" ref={sectionRef} className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xs font-mono text-muted uppercase tracking-wider">Habit performance</h2>
        <HabitSortControls habitSort={habitSort} handleSortChange={handleSortChange} />
      </div>
      <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
        <HabitPerformanceList sorted={sortedStats} navigate={navigate} />
        <WeeklyBreakdown allStats={allStats} />
      </div>
    </section>
  );
}

function StatsActivitySection({
  sectionRef,
  filteredHabits
}: {
  sectionRef: (el: HTMLElement | null) => void;
} & Pick<StatsViewProps, 'filteredHabits'>) {
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
    <section id="activity" ref={sectionRef} className="space-y-4">
      <div className="bg-bg-secondary border border-border rounded-lg p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono text-muted uppercase tracking-wider">Activity - 90 days</h2>
          <span className="text-[10px] font-mono text-muted">{filteredHabits.length} habits</span>
        </div>
        <HabitHeatmap completions={mergedCompletions} dailyTarget={aggregateTarget} />
      </div>
    </section>
  );
}

export function StatsView(props: StatsViewProps) {
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const [activeSection, setActiveSection] = useState(SECTION_CONFIGS[0].id);
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  const scrollToSection = (id: string) => {
    const el = sectionRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  const setSectionRef = (id: string) => (el: HTMLElement | null) => {
    sectionRefs.current[id] = el;
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <StatsHeader />
      <StatsToolbar
        activeSection={activeSection}
        scrollToSection={scrollToSection}
        period={props.period}
        setPeriod={props.setPeriod}
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
      <div className="max-w-6xl mx-auto px-4 py-4 space-y-8">
        <StatsOverviewSection
          sectionRef={setSectionRef('overview')}
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
        <StatsChartsSection
          sectionRef={setSectionRef('charts')}
          avgRate={props.avgRate}
          dailyData={props.dailyData}
          habitPeriodData={props.habitPeriodData}
          filteredHabits={props.filteredHabits}
        />
        <StatsHabitsSection
          sectionRef={setSectionRef('habits')}
          navigate={props.navigate}
          allStats={props.allStats}
          sorted={props.sorted}
        />
        <StatsActivitySection
          sectionRef={setSectionRef('activity')}
          filteredHabits={props.filteredHabits}
        />
      </div>
    </div>
  );
}
