import React from 'react';
import { BellRingIcon, FlameIcon, TrendingUpIcon, ZapIcon } from 'lucide-react';
import { Onboarding, type OnboardingTemplate } from '@/components/Onboarding';
import { CompletionRing } from '@/components/CompletionRing';
import type { Habit } from '@/types/habit';
import { HabitRow, DropIndicator } from './DashboardView.helpers';
import { invokeIfFunction } from '@/lib/callback';
import { isScheduledForDate, resolveHabitSchedule } from '@/lib/habits/schedule';

type Reminder = {
  habitId: string;
  time: string;
  message: string;
};

type DashboardViewProps = {
  habits: Habit[];
  filtered: Habit[];
  reminders: Reminder[];
  dropHint: { habitId: string; position: 'above' | 'below' } | null;
  dragOverHabitId: string | null;
  filter: 'all' | 'pending' | 'done';
  allTags: string[];
  selectedTags: string[];
  addingTemplate: string | null;
  today: string;
  todayRate: number;
  completedToday: number;
  totalActive: number;
  dateStr: string;
  overallStreak: number;
  setFilter: (value: 'all' | 'pending' | 'done') => void;
  setSelectedTags: (tags: string[]) => void;
  toggleTag: (tag: string) => void;
  navigate: (to: string) => void;
  handleExport: () => void;
  handleTemplateSelect: (template: OnboardingTemplate) => Promise<void>;
  handleToggle: (habit: Habit) => Promise<void>;
  handleDismissReminder: (habitId: string) => void;
  handleDragStart: (event: React.DragEvent<HTMLDivElement>, habitId: string) => void;
  handleDragOver: (event: React.DragEvent<HTMLDivElement>, habitId: string) => void;
  handleDrop: (event: React.DragEvent<HTMLDivElement>, habitId: string) => Promise<void>;
  handleDragEnd: () => void;
};

function DashboardHero({
  dateStr,
  todayRate,
  completedToday,
  totalActive,
  overallStreak,
  handleExport
}: Pick<DashboardViewProps, 'dateStr' | 'todayRate' | 'completedToday' | 'totalActive' | 'overallStreak' | 'handleExport'>) {
  return (
    <>
      <div
        className="px-4 pt-4 pb-3 bg-bg-primary"
        style={{ paddingTop: 'calc(var(--safe-area-inset-top, 0px) + 1rem)' }}
      >
        <div className="max-w-2xl mx-auto">
          <p className="text-[11px] font-mono text-muted uppercase tracking-widest mb-0.5">{dateStr}</p>
          <h1 className="text-xl font-semibold text-foreground">Today</h1>
        </div>
      </div>
    <div className="border-b border-border bg-bg-primary px-4 pb-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-5 mb-3">
          <CompletionRing size={88} strokeWidth={7} percentage={todayRate} />
          <div className="flex-1">
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
          </div>
        </div>
        <div className="h-[3px] bg-border rounded-full overflow-hidden mb-3">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${todayRate}%`,
              background: 'linear-gradient(90deg, var(--accent), var(--accent-secondary))',
              boxShadow: '0 0 8px var(--glow)'
            }}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-muted">Filters</div>
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
    </>
  );
}

function RemindersPanel({
  reminders,
  habits,
  handleToggle,
  handleDismissReminder
}: Pick<DashboardViewProps, 'reminders' | 'habits' | 'handleToggle' | 'handleDismissReminder'>) {
  if (!reminders.length) {
    return null;
  }
  return (
    <div className="max-w-2xl mx-auto px-4 py-3 space-y-2">
      {reminders.map((reminder) => {
        const habit = habits.find((item) => item.id === reminder.habitId);
        if (!habit) {
          return null;
        }
        return (
          <div key={reminder.habitId} className="flex flex-col gap-2 rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <BellRingIcon size={16} className="text-accent-secondary" />
              <div className="text-sm font-semibold text-foreground">{reminder.message}</div>
              <span className="text-[10px] font-mono text-muted ml-auto">{reminder.time}</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  void handleToggle(habit);
                }}
                className="flex-1 rounded-full border border-accent px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.3em] text-accent hover:bg-accent/10 transition-colors"
              >
                Mark done
              </button>
              <button
                type="button"
                onClick={() => handleDismissReminder(habit.id)}
                className="flex-1 rounded-full border border-border px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.3em] text-muted hover:text-foreground hover:border-border-hover transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FilterBar({
  filter,
  setFilter,
  allTags,
  selectedTags,
  toggleTag,
  setSelectedTags,
  habits,
  today
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
>) {
  const todayDate = new Date(today);
  todayDate.setHours(0, 0, 0, 0);
  const pendingCount = habits.filter((habit) => {
    const schedule = resolveHabitSchedule(habit);
    if (!isScheduledForDate(schedule, todayDate)) {
      return false;
    }
    return (habit.completions[today] ?? 0) < Math.max(1, habit.dailyTarget ?? 1);
  }).length;
  return (
    <div className="border-b border-border px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex gap-0">
          {(['all', 'pending', 'done'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider border-b-2 transition-colors ${
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
        <div className="py-2.5 flex items-center gap-1.5 overflow-x-auto">
          {allTags.length > 0 ? (
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
          ) : (
            <span className="text-[10px] font-mono text-muted">No tags yet</span>
          )}
        </div>
      </div>
    </div>
  );
}

function HabitListSection({
  filtered,
  dropHint,
  dragOverHabitId,
  handleToggle,
  handleDrop,
  handleDragStart,
  handleDragOver,
  handleDragEnd,
  navigate
}: Pick<
  DashboardViewProps,
  | 'filtered'
  | 'dropHint'
  | 'dragOverHabitId'
  | 'handleToggle'
  | 'handleDrop'
  | 'handleDragStart'
  | 'handleDragOver'
  | 'handleDragEnd'
  | 'navigate'
>) {
  if (filtered.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-muted flex flex-col items-center justify-center">
        <div className="text-4xl mb-3">✓</div>
        <p className="font-mono text-sm">All habits are currently paused</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-3 flex flex-col gap-2 px-4" role="list" aria-label="Habit list">
      {filtered.map((habit) => (
        <React.Fragment key={habit.id}>
          {dropHint?.habitId === habit.id && dropHint.position === 'above' && <DropIndicator />}
          <HabitRow
            habit={habit}
            onToggle={() => {
              void handleToggle(habit);
            }}
            onDetail={() => navigate(`/habit/${habit.id}`)}
            onDragStart={(event) => handleDragStart(event, habit.id)}
            onDragOver={(event) => handleDragOver(event, habit.id)}
            onDrop={(event) => {
              void handleDrop(event, habit.id);
            }}
            onDragEnd={handleDragEnd}
            isDropTarget={dragOverHabitId === habit.id}
          />
          {dropHint?.habitId === habit.id && dropHint.position === 'below' && <DropIndicator />}
        </React.Fragment>
      ))}
    </div>
  );
}

export function DashboardView(props: DashboardViewProps) {
  if (props.habits.length === 0) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <Onboarding
          onCreateCustom={() => props.navigate('/habit/new')}
          onTemplateSelect={props.handleTemplateSelect}
          activeTemplate={props.addingTemplate}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHero
        dateStr={props.dateStr}
        todayRate={props.todayRate}
        completedToday={props.completedToday}
        totalActive={props.totalActive}
        overallStreak={props.overallStreak}
        handleExport={props.handleExport}
      />
      <RemindersPanel
        reminders={props.reminders}
        habits={props.habits}
        handleToggle={props.handleToggle}
        handleDismissReminder={props.handleDismissReminder}
      />
      <FilterBar
        filter={props.filter}
        setFilter={props.setFilter}
        allTags={props.allTags}
        selectedTags={props.selectedTags}
        toggleTag={props.toggleTag}
        setSelectedTags={props.setSelectedTags}
        habits={props.habits}
        today={props.today}
      />
      <HabitListSection
        filtered={props.filtered}
        dropHint={props.dropHint}
        dragOverHabitId={props.dragOverHabitId}
        handleToggle={props.handleToggle}
        handleDrop={props.handleDrop}
        handleDragStart={props.handleDragStart}
        handleDragOver={props.handleDragOver}
        handleDragEnd={props.handleDragEnd}
        navigate={props.navigate}
      />
    </div>
  );
}
