import React from 'react';
import { SearchIcon, TagIcon } from 'lucide-react';
import { invokeIfFunction } from '@/lib/callback';
import type { PeriodOption, StatsViewProps } from './StatsView';

const PERIOD_OPTIONS: Array<{ id: PeriodOption; label: string }> = [
  { id: 'week', label: 'W' },
  { id: 'month', label: 'M' },
  { id: 'quarter', label: 'Q' },
  { id: 'year', label: 'Y' }
];

export function PeriodSelector({ period, setPeriod }: { period: PeriodOption; setPeriod: (value: PeriodOption) => void; }) {
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

export function FiltersPanel({ searchQuery, setSearchQuery, statusFilter, setStatusFilter, allTags, selectedTags, toggleTag }: Pick<
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

export function HabitSortControls({
  habitSort,
  handleSortChange
}: {
  habitSort: 'rate' | 'streak' | 'name';
  handleSortChange: (key: 'rate' | 'streak' | 'name') => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
      <span className="text-muted">Sort by</span>
      {(['rate', 'streak', 'name'] as const).map((key) => (
        <button
          key={key}
          onClick={() => handleSortChange(key)}
          className={`rounded-full px-3 py-1 text-[10px] transition-colors ${
            habitSort === key ? 'bg-border text-foreground' : 'text-muted hover:text-foreground'
          }`}
        >
          {key}
        </button>
      ))}
    </div>
  );
}

export default PeriodSelector;

