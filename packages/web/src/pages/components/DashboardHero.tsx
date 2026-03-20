import { useEffect, useRef, useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, FlameIcon, MoreHorizontalIcon, TrendingUpIcon, ZapIcon } from 'lucide-react';
import { CompletionRing } from '@/components/CompletionRing';
import type { OnboardingTemplate } from '@/components/Onboarding';
import type { Habit } from '@/types/habit';

type Reminder = {
  id: string;
  habitId: string;
  time: string;
  message: string;
};

export type ViewDensity = 'comfortable' | 'compact';

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
  viewDensity: ViewDensity;
  setViewDensity: (density: ViewDensity) => void;
  heroCollapsed: boolean;
  setHeroCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
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

function getMotivationText(todayRate: number, remaining: number): string | null {
  if (todayRate >= 100) {
    return null;
  }
  if (todayRate >= 50) {
    return `Almost there - ${remaining} left!`;
  }
  if (todayRate > 0) {
    return `Keep going - ${remaining} to go`;
  }
  return 'Start your streak';
}

function HeroSummaryBar({
  dateStr,
  todayRate,
  completedToday,
  totalActive,
  overallStreak
}: {
  dateStr: string;
  todayRate: number;
  completedToday: number;
  totalActive: number;
  overallStreak: number;
}) {
  return (
    <div>
      <p className="text-[11px] font-mono text-muted uppercase tracking-widest mb-1">{dateStr}</p>
      <div className="flex items-center gap-3">
        <CompletionRing size={28} strokeWidth={3.5} percentage={todayRate} />
        <div className="text-[12px] font-semibold text-foreground">{`${completedToday}/${totalActive || 0}`}</div>
        <div className="flex items-center gap-1 text-[12px] font-mono text-accent-secondary">
          <FlameIcon size={14} />
          <span>{overallStreak}d</span>
        </div>
      </div>
    </div>
  );
}

function HeroActions({
  menuOpen,
  setMenuOpen,
  menuRef,
  handleExport,
  heroCollapsed,
  onToggleHero
}: {
  menuOpen: boolean;
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  menuRef: React.RefObject<HTMLDivElement | null>;
  handleExport: () => void;
  heroCollapsed: boolean;
  onToggleHero: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="w-9 h-9 rounded-xl border border-border bg-bg-secondary flex items-center justify-center transition hover:border-accent"
          aria-haspopup="true"
          aria-expanded={menuOpen}
        >
          <MoreHorizontalIcon size={18} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-36 rounded-2xl border border-border bg-bg-card shadow-xl z-20">
            <button
              type="button"
              onClick={() => {
                handleExport();
                setMenuOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-xs font-semibold tracking-widest uppercase text-foreground hover:bg-bg-secondary"
            >
              Export CSV
            </button>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onToggleHero}
        className="w-9 h-9 rounded-xl border border-border bg-bg-secondary flex items-center justify-center transition hover:border-accent"
        aria-label={heroCollapsed ? 'Expand hero' : 'Collapse hero'}
      >
        {heroCollapsed ? <ChevronDownIcon size={16} /> : <ChevronUpIcon size={16} />}
      </button>
    </div>
  );
}

function HeroExpandedPanel({
  heroCollapsed,
  todayRate,
  totalActive,
  overallStreak,
  completedToday,
  motivationText,
  showComebackBanner,
  daysSinceLastCompletion
}: {
  heroCollapsed: boolean;
  todayRate: number;
  totalActive: number;
  overallStreak: number;
  completedToday: number;
  motivationText: string | null;
  showComebackBanner: boolean;
  daysSinceLastCompletion: number;
}) {
  return (
    <div
      className="overflow-hidden transition-all duration-300"
      style={{ maxHeight: heroCollapsed ? 0 : 1200 }}
      aria-hidden={heroCollapsed}
    >
      <div className="px-4 pb-4">
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
        </div>
      </div>
    </div>
  );
}

export function DashboardHero({
  dateStr,
  todayRate,
  completedToday,
  totalActive,
  overallStreak,
  daysSinceLastCompletion,
  handleExport,
  heroCollapsed,
  setHeroCollapsed
}: Pick<
  DashboardViewProps,
  | 'dateStr'
  | 'todayRate'
  | 'completedToday'
  | 'totalActive'
  | 'overallStreak'
  | 'daysSinceLastCompletion'
  | 'handleExport'
  | 'heroCollapsed'
  | 'setHeroCollapsed'
>) {
  const remaining = totalActive - completedToday;
  const motivationText = getMotivationText(todayRate, remaining);
  const showComebackBanner = daysSinceLastCompletion >= 2 && todayRate < 100;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const handleClickAway = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClickAway);
    return () => document.removeEventListener('pointerdown', handleClickAway);
  }, []);

  const toggleHero = () => setHeroCollapsed((prev) => !prev);
  return (
    <section className="border-b border-border bg-bg-primary">
      <div className="px-4 py-3" style={{ paddingTop: 'calc(var(--safe-area-inset-top, 0px) + 1rem)' }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <HeroSummaryBar
            dateStr={dateStr}
            todayRate={todayRate}
            completedToday={completedToday}
            totalActive={totalActive}
            overallStreak={overallStreak}
          />
          <HeroActions
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            menuRef={menuRef}
            handleExport={handleExport}
            heroCollapsed={heroCollapsed}
            onToggleHero={toggleHero}
          />
        </div>
      </div>
      <HeroExpandedPanel
        heroCollapsed={heroCollapsed}
        todayRate={todayRate}
        totalActive={totalActive}
        overallStreak={overallStreak}
        completedToday={completedToday}
        motivationText={motivationText}
        showComebackBanner={showComebackBanner}
        daysSinceLastCompletion={daysSinceLastCompletion}
      />
    </section>
  );
}
