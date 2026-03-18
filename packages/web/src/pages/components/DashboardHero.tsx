import { FlameIcon, TrendingUpIcon, ZapIcon } from 'lucide-react';
import { CompletionRing } from '@/components/CompletionRing';
import type { OnboardingTemplate } from '@/components/Onboarding';
import type { Habit } from '@/types/habit';

type Reminder = {
  id: string;
  habitId: string;
  time: string;
  message: string;
};

export type DashboardViewProps = {
  habits: Habit[];
  filtered: Habit[];
  reminders: Reminder[];
  dropHint: { habitId: string; position: 'above' | 'below' } | null;
  dragOverHabitId: string | null;
  draggedHabitId: string | null;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  filter: 'all' | 'pending' | 'done' | 'archived';
  allTags: string[];
  selectedTags: string[];
  addingTemplate: string | null;
  today: string;
  todayRate: number;
  completedToday: number;
  totalActive: number;
  dateStr: string;
  overallStreak: number;
  daysSinceLastCompletion: number;
  setFilter: (value: 'all' | 'pending' | 'done' | 'archived') => void;
  setSelectedTags: (tags: string[]) => void;
  toggleTag: (tag: string) => void;
  navigate: (to: string) => void;
  handleExport: () => void;
  handleTemplateSelect: (template: OnboardingTemplate) => Promise<void>;
  handleToggle: (habit: Habit) => Promise<void>;
  handleDismissReminder: (reminderId: string) => void;
  handleDisableReminder: (habit: Habit) => Promise<void>;
  handleDragStart: (event: React.DragEvent<HTMLDivElement>, habitId: string) => void;
  handleDragOver: (event: React.DragEvent<HTMLDivElement>, habitId: string) => void;
  handleDrop: (event: React.DragEvent<HTMLDivElement>, habitId: string) => Promise<void>;
  handleDragEnd: () => void;
  handleTouchStart: (event: React.TouchEvent, habitId: string) => void;
  sortMode: 'custom' | 'smart';
  setSortMode: (mode: 'custom' | 'smart') => void;
};

function StatCards({ totalActive, overallStreak, completedToday }: { totalActive: number; overallStreak: number; completedToday: number }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="bg-bg-card border border-border rounded-xl px-3 py-2">
        <div className="flex items-center gap-1.5 mb-1">
          <ZapIcon size={10} className="text-accent" />
          <span className="text-[10px] font-mono text-muted uppercase tracking-wider">Active</span>
        </div>
        <span className="text-lg font-mono font-bold text-foreground">{totalActive}</span>
      </div>
      <div className="bg-bg-card border border-border rounded-xl px-3 py-2">
        <div className="flex items-center gap-1.5 mb-1">
          <FlameIcon size={10} className="text-accent-secondary" />
          <span className="text-[10px] font-mono text-muted uppercase tracking-wider">Streak</span>
        </div>
        <span className="text-lg font-mono font-bold text-accent-secondary">{overallStreak}d</span>
      </div>
      <div className="bg-bg-card border border-border rounded-xl px-3 py-2">
        <div className="flex items-center gap-1.5 mb-1">
          <TrendingUpIcon size={10} className="text-accent-secondary" />
          <span className="text-[10px] font-mono text-muted uppercase tracking-wider">Done</span>
        </div>
        <span className="text-lg font-mono font-bold text-accent-secondary">{completedToday}</span>
      </div>
    </div>
  );
}

function HeroBanners({ showComebackBanner, daysSinceLastCompletion, todayRate }: { showComebackBanner: boolean; daysSinceLastCompletion: number; todayRate: number }) {
  return (
    <>
      {showComebackBanner && (
        <div className="animate-comeback-slide mb-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-2.5 flex items-center gap-3">
          <span className="text-lg" role="img" aria-label="welcome back">👋</span>
          <div>
            <p className="text-sm font-semibold text-foreground">Welcome back!</p>
            <p className="text-[11px] font-mono text-muted">You've been away for {daysSinceLastCompletion} days. Let's start fresh today!</p>
          </div>
        </div>
      )}
      {todayRate >= 100 && (
        <div className="animate-slide-down-fade mb-3 rounded-xl border border-accent-secondary/30 bg-accent-secondary/5 px-4 py-2.5 flex items-center gap-3">
          <span className="text-lg" role="img" aria-label="celebration">🎉</span>
          <div>
            <p className="text-sm font-semibold text-foreground">Perfect day!</p>
            <p className="text-[11px] font-mono text-muted">All habits completed. Keep the streak alive!</p>
          </div>
        </div>
      )}
    </>
  );
}

export function DashboardHero({
  dateStr,
  todayRate,
  completedToday,
  totalActive,
  overallStreak,
  daysSinceLastCompletion,
  handleExport
}: Pick<
  DashboardViewProps,
  | 'dateStr'
  | 'todayRate'
  | 'completedToday'
  | 'totalActive'
  | 'overallStreak'
  | 'daysSinceLastCompletion'
  | 'handleExport'
>) {
  const remaining = totalActive - completedToday;
  const motivationText =
    todayRate >= 100
      ? null
      : todayRate >= 50
        ? `Almost there — ${remaining} left!`
        : todayRate > 0
          ? `Keep going — ${remaining} to go`
          : 'Start your streak';
  const showComebackBanner = daysSinceLastCompletion >= 2 && todayRate < 100;

  return (
    <>
      <div className="px-4 pt-4 pb-3 bg-bg-primary" style={{ paddingTop: 'calc(var(--safe-area-inset-top, 0px) + 1rem)' }}>
        <div className="max-w-2xl mx-auto">
          <p className="text-[11px] font-mono text-muted uppercase tracking-widest mb-0.5">{dateStr}</p>
          <h1 className="text-xl font-semibold text-foreground">Today</h1>
        </div>
      </div>
      <div className="border-b border-border bg-bg-primary px-4 pb-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-5 mb-3">
            <CompletionRing size={88} strokeWidth={7} percentage={todayRate} />
            <div className="flex-1 flex flex-col gap-2">
              {motivationText && (
                <p className={`text-xs font-mono ${todayRate >= 50 ? 'text-accent-secondary' : 'text-muted'} tracking-wide`}>
                  {motivationText}
                </p>
              )}
              <StatCards totalActive={totalActive} overallStreak={overallStreak} completedToday={completedToday} />
            </div>
          </div>
          <div className="h-[3px] bg-border rounded-full overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all duration-700 ${todayRate >= 100 ? 'animate-progress-glow' : ''}`}
              style={{
                width: `${Math.min(todayRate, 100)}%`,
                background: todayRate >= 100
                  ? 'linear-gradient(90deg, var(--accent-secondary), var(--accent))'
                  : 'linear-gradient(90deg, var(--accent), var(--accent-secondary))',
                boxShadow: '0 0 8px var(--glow)'
              }}
            />
          </div>
          <HeroBanners showComebackBanner={showComebackBanner} daysSinceLastCompletion={daysSinceLastCompletion} todayRate={todayRate} />
          <div className="flex items-center justify-between gap-3">
            <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-muted">Filters</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExport}
                className="text-[10px] font-mono uppercase tracking-[0.3em] border border-border px-3 py-1 rounded-full transition hover:border-accent hover:text-accent"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
