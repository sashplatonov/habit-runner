import { invokeIfFunction } from '@/lib/callback';
import { isMandatoryToday } from '@/lib/habits/schedule';
import type { DashboardViewProps } from './DashboardHero';

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
  return (
    <div className="border-b border-border px-4">
      <div className="max-w-2xl mx-auto">
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
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-3 border-t border-border/40">
          <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          <div className="flex flex-col items-end gap-1.5">
            <SortToggle sortMode={sortMode} setSortMode={setSortMode} />
            {sortMode === 'smart' && (
              <div className="flex items-center gap-2 text-[9px] font-mono text-muted">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-accent/60 inline-block" />easy first</span>
                <span className="text-border">·</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-accent-secondary/60 inline-block" />hard last</span>
                <span className="text-border">·</span>
                <span>custom order within</span>
              </div>
            )}
          </div>
        </div>
        <div className="py-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(allTags || []).length > 0 ? (
            <>
              {(allTags || []).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => invokeIfFunction(toggleTag, tag)}
                  className={`text-[10px] font-mono px-2 py-1 rounded border whitespace-nowrap transition-colors ${
                    (selectedTags || []).includes(tag)
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
          ) : (
            <span className="text-[10px] font-mono text-muted">No tags yet</span>
          )}
        </div>
      </div>
    </div>
  );
}
