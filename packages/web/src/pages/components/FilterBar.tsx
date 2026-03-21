import { useEffect, useRef, useState } from 'react';
import { ChartGuideTooltip } from '@/components/ChartGuideTooltip';
import { invokeIfFunction } from '@/lib/callback';
import { isMandatoryToday } from '@/lib/habits/schedule';
import { LayoutGridIcon, ListIcon, type LucideIcon } from 'lucide-react';
import type { DashboardViewProps, ViewDensity } from './DashboardHero';

function SearchBar({ searchQuery, setSearchQuery }: { searchQuery: string; setSearchQuery: (v: string) => void }) {
  return (
    <div className="relative flex-1">
      <input
        type="text"
        id="habit-search"
        placeholder="Search habits..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full bg-bg-secondary border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent transition-all pl-10"
      />
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      </div>
      {searchQuery && (
        <button
          onClick={() => setSearchQuery('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      )}
    </div>
  );
}

function SortToggle({ sortMode, setSortMode }: { sortMode: 'custom' | 'smart'; setSortMode: (m: 'custom' | 'smart') => void }) {
  return (
    <div className="flex items-center gap-1.5 p-0.5 bg-bg-secondary rounded-lg border border-border/50">
      {(['custom', 'smart'] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => setSortMode(mode)}
          className={`px-3 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all duration-200 ${
            sortMode === mode
              ? 'bg-bg-primary text-accent shadow-sm ring-1 ring-border'
              : 'text-muted hover:text-foreground'
          }`}
        >
          {mode}
        </button>
      ))}
    </div>
  );
}

function FilterTabs({
  filter,
  setFilter,
  pendingCount
}: {
  filter: DashboardViewProps['filter'];
  setFilter: DashboardViewProps['setFilter'];
  pendingCount: number;
}) {
  return (
    <div className="flex gap-0 overflow-x-auto no-scrollbar">
      {(['pending', 'all', 'done', 'archived'] as const).map((value) => (
        <button
          key={value}
          type="button"
          id={`filter-${value}`}
          onClick={() => setFilter(value)}
          className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
            filter === value ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          {value}
          {value === 'pending' && (
            <span className="ml-1.5 text-[9px] bg-border px-1 py-0.5 rounded font-mono">{pendingCount}</span>
          )}
        </button>
      ))}
    </div>
  );
}

function TagFilterRow({
  allTags,
  selectedTags,
  toggleTag,
  setSelectedTags
}: {
  allTags: string[];
  selectedTags: string[];
  toggleTag: DashboardViewProps['toggleTag'];
  setSelectedTags: DashboardViewProps['setSelectedTags'];
}) {
  if (allTags.length === 0) {
    return <span className="text-[10px] font-mono text-muted">No tags yet</span>;
  }

  return (
    <>
      {allTags.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => invokeIfFunction(toggleTag, tag)}
          className={`text-[10px] font-mono px-2 py-1 rounded border whitespace-nowrap transition-colors ${
            selectedTags.includes(tag)
              ? 'bg-accent/10 border-accent/30 text-accent'
              : 'bg-bg-secondary border-border text-muted hover:text-foreground hover:border-border-hover'
          }`}
        >
          #{tag}
        </button>
      ))}
      {selectedTags.length > 0 && (
        <button
          type="button"
          onClick={() => invokeIfFunction(setSelectedTags, [])}
          className="text-[10px] font-mono px-2 py-1 rounded border whitespace-nowrap bg-bg-secondary border-accent/30 text-accent hover:bg-accent/10 transition-colors"
        >
          Clear tags
        </button>
      )}
    </>
  );
}

export function FilterBar({
  filter,
  setFilter,
  allTags,
  selectedTags,
  toggleTag,
  setSelectedTags,
  habits,
  today,
  sortMode,
  setSortMode,
  viewDensity,
  setViewDensity,
  searchQuery,
  setSearchQuery
}: Pick<
  DashboardViewProps,
  | 'filter'
  | 'setFilter'
  | 'allTags'
  | 'selectedTags'
  | 'toggleTag'
  | 'setSelectedTags'
  | 'habits'
  | 'today'
  | 'sortMode'
  | 'setSortMode'
  | 'viewDensity'
  | 'setViewDensity'
  | 'searchQuery'
  | 'setSearchQuery'
>) {
  const todayDate = new Date(today);
  todayDate.setHours(0, 0, 0, 0);
  const pendingCount = habits.filter((habit) => {
    if (!isMandatoryToday(habit, todayDate)) {
      return false;
    }
    return (habit.completions[today] ?? 0) < Math.max(1, habit.dailyTarget ?? 1);
  }).length;
  const [isSticky, setIsSticky] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) {return undefined;}
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(entry.boundingClientRect.top < 0);
      },
      { threshold: [1] }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative">
      <div ref={sentinelRef} className="absolute top-0 left-0 w-full h-px pointer-events-none" aria-hidden />
      <div
        className={`sticky top-[calc(var(--safe-area-inset-top, 0px))] z-[70] transition-shadow duration-200 ${
          isSticky ? 'shadow-[0_16px_30px_-24px_rgba(15,23,42,0.75)]' : ''
        }`}
      >
        <div className="border-b border-border bg-bg-primary/95 backdrop-blur-sm px-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 pt-3">
              <span className="text-[10px] font-mono text-muted uppercase tracking-wider">Dashboard filters</span>
              <ChartGuideTooltip
                title="Dashboard filters"
                summary="Use this control bar to narrow the dashboard to the habits that need attention, then switch sort and layout to review them faster."
                focusPoints={[
                  'Tabs: split today into pending, done, all, and archived views.',
                  'Search and tags: isolate one habit or one context quickly.',
                  'Sort and density: change scan order and switch between list and card views.'
                ]}
                variant="columns"
                triggerClassName="h-7 w-7"
              />
            </div>
            <FilterTabs filter={filter} setFilter={setFilter} pendingCount={pendingCount} />
            <div className="flex items-center gap-2 py-3 border-t border-border/40">
              <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
              <SortToggle sortMode={sortMode} setSortMode={setSortMode} />
              <DensityToggle viewDensity={viewDensity} setViewDensity={setViewDensity} />
            </div>
            <div className="py-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <TagFilterRow
                allTags={allTags || []}
                selectedTags={selectedTags}
                toggleTag={toggleTag}
                setSelectedTags={setSelectedTags}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DensityToggle({ viewDensity, setViewDensity }: { viewDensity: ViewDensity; setViewDensity: (density: ViewDensity) => void }) {
  const options: { value: ViewDensity; Icon: LucideIcon; label: string }[] = [
    { value: 'comfortable', Icon: LayoutGridIcon, label: 'Grid view' },
    { value: 'compact', Icon: ListIcon, label: 'List view' }
  ];
  return (
    <div className="flex items-center gap-1 bg-bg-secondary border border-border/50 rounded-lg p-0.5">
      {options.map(({ value, Icon, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => setViewDensity(value)}
          aria-pressed={viewDensity === value}
          aria-label={label}
          className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
            viewDensity === value
              ? 'bg-bg-primary border border-border/50 text-foreground shadow-sm'
              : 'text-muted hover:text-foreground'
          }`}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}
