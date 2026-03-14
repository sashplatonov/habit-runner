import React from 'react';
import { BellRingIcon, FlameIcon, TrendingUpIcon, ZapIcon } from 'lucide-react';
import { Onboarding, type OnboardingTemplate } from '@/components/Onboarding';
import { CompletionRing } from '@/components/CompletionRing';
import { HabitRow, DropIndicator } from './DashboardView.helpers';
import { invokeIfFunction } from '@/lib/callback';
import { isScheduledForDate, resolveHabitSchedule } from '@/lib/habits/schedule';
import type { Habit } from '@/types/habit';

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
  draggedHabitId: string | null;
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
  daysSinceLastCompletion: number;
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
  reorderMode: boolean;
  toggleReorderMode: () => void;
  moveHabit: (habitId: string, direction: 'up' | 'down') => Promise<void>;
  sortMode: 'custom' | 'smart';
  setSortMode: (mode: 'custom' | 'smart') => void;
};

function DashboardHero({
  dateStr,
  todayRate,
  completedToday,
  totalActive,
  overallStreak,
  daysSinceLastCompletion,
  handleExport,
  reorderMode,
  toggleReorderMode
}: Pick<
  DashboardViewProps,
  | 'dateStr'
  | 'todayRate'
  | 'completedToday'
  | 'totalActive'
  | 'overallStreak'
  | 'daysSinceLastCompletion'
  | 'handleExport'
  | 'reorderMode'
  | 'toggleReorderMode'
>) {
  const remaining = totalActive - completedToday;
  const motivationText =
    todayRate >= 100
      ? null // handled by banner below
      : todayRate >= 50
        ? `Almost there — ${remaining} left!`
        : todayRate > 0
          ? `Keep going — ${remaining} to go`
          : 'Start your streak';
  const showComebackBanner = daysSinceLastCompletion >= 2 && todayRate < 100;

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
          <div className="flex-1 flex flex-col gap-2">
            {/* Motivational label */}
            {motivationText && (
              <p className={`text-xs font-mono ${todayRate >= 50 ? 'text-accent-secondary' : 'text-muted'} tracking-wide`}>
                {motivationText}
              </p>
            )}
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
        {/* Progress bar */}
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
        {/* Comeback banner (Task 11) */}
        {showComebackBanner && (
          <div className="animate-comeback-slide mb-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-2.5 flex items-center gap-3">
            <span className="text-lg" role="img" aria-label="welcome back">👋</span>
            <div>
              <p className="text-sm font-semibold text-foreground">Welcome back!</p>
              <p className="text-[11px] font-mono text-muted">You've been away for {daysSinceLastCompletion} days. Let's start fresh today!</p>
            </div>
          </div>
        )}
        {/* Celebration banner at 100% */}
        {todayRate >= 100 && (
          <div className="animate-slide-down-fade mb-3 rounded-xl border border-accent-secondary/30 bg-accent-secondary/5 px-4 py-2.5 flex items-center gap-3">
            <span className="text-lg" role="img" aria-label="celebration">🎉</span>
            <div>
              <p className="text-sm font-semibold text-foreground">Perfect day!</p>
              <p className="text-[11px] font-mono text-muted">All habits completed. Keep the streak alive!</p>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-muted">Filters</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleReorderMode}
              aria-pressed={reorderMode}
              className={`text-[10px] font-mono uppercase tracking-[0.3em] border px-3 py-1 rounded-full transition ${
                reorderMode
                  ? 'border-accent text-accent bg-accent/10'
                  : 'border-border hover:border-accent hover:text-accent'
              }`}
            >
              {reorderMode ? 'Done' : 'Reorder'}
            </button>
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
  today,
  sortMode,
  setSortMode
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
        <div className="flex items-center justify-between py-1">
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
          <span className="text-[10px] font-mono text-muted/50 hidden sm:inline">
            {sortMode === 'smart' ? 'Auto-ordered by efficiency' : 'Manual order'}
          </span>
        </div>
        <div className="py-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
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
  draggedHabitId,
  handleToggle,
  handleDrop,
  handleDragStart,
  handleDragOver,
  handleDragEnd,
  navigate,
  reorderMode,
  moveHabit,
  selectedTags
}: Pick<
  DashboardViewProps,
  | 'filtered'
  | 'dropHint'
  | 'dragOverHabitId'
  | 'draggedHabitId'
  | 'handleToggle'
  | 'handleDrop'
  | 'handleDragStart'
  | 'handleDragOver'
  | 'handleDragEnd'
  | 'navigate'
  | 'reorderMode'
  | 'moveHabit'
  | 'selectedTags'
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
      {selectedTags.length > 0 ? (
        selectedTags.map((tag) => {
          const habitsInTag = filtered.filter((h) => h.tags.includes(tag));
          if (habitsInTag.length === 0) {return null;}
          return (
            <div key={tag} className="space-y-2 mb-4">
              <div className="flex items-center gap-2 px-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted">{tag}</h3>
              </div>
              {habitsInTag.map((habit, index) => (
                <HabitRowEntry
                  key={`${tag}-${habit.id}`}
                  habit={habit}
                  index={index}
                  filteredLength={habitsInTag.length}
                  dropHint={dropHint}
                  dragOverHabitId={dragOverHabitId}
                  draggedHabitId={draggedHabitId}
                  handleToggle={handleToggle}
                  handleDrop={handleDrop}
                  handleDragStart={handleDragStart}
                  handleDragOver={handleDragOver}
                  handleDragEnd={handleDragEnd}
                  navigate={navigate}
                  reorderMode={reorderMode}
                  moveHabit={moveHabit}
                />
              ))}
            </div>
          );
        })
      ) : (
        filtered.map((habit, index) => (
          <HabitRowEntry
            key={habit.id}
            habit={habit}
            index={index}
            filteredLength={filtered.length}
            dropHint={dropHint}
            dragOverHabitId={dragOverHabitId}
            draggedHabitId={draggedHabitId}
            handleToggle={handleToggle}
            handleDrop={handleDrop}
            handleDragStart={handleDragStart}
            handleDragOver={handleDragOver}
            handleDragEnd={handleDragEnd}
            navigate={navigate}
            reorderMode={reorderMode}
            moveHabit={moveHabit}
          />
        ))
      )}
    </div>
  );
}

type HabitRowEntryProps = {
  habit: Habit;
  index: number;
  filteredLength: number;
  dropHint: { habitId: string; position: 'above' | 'below' } | null;
  dragOverHabitId: string | null;
  draggedHabitId: string | null;
  handleToggle: (habit: Habit) => Promise<void>;
  handleDrop: (event: React.DragEvent<HTMLDivElement>, habitId: string) => Promise<void>;
  handleDragStart: (event: React.DragEvent<HTMLDivElement>, habitId: string) => void;
  handleDragOver: (event: React.DragEvent<HTMLDivElement>, habitId: string) => void;
  handleDragEnd: () => void;
  navigate: (to: string) => void;
  reorderMode: boolean;
  moveHabit: (habitId: string, direction: 'up' | 'down') => Promise<void>;
};

function HabitRowEntry({
  habit,
  index,
  filteredLength,
  dropHint,
  dragOverHabitId,
  draggedHabitId,
  handleToggle,
  handleDrop,
  handleDragStart,
  handleDragOver,
  handleDragEnd,
  navigate,
  reorderMode,
  moveHabit
}: HabitRowEntryProps) {
  const dropHintPosition = dropHint?.habitId === habit.id ? dropHint.position : null;
  const isDragging = draggedHabitId === habit.id;
  const canMoveUp = reorderMode && index > 0;
  const canMoveDown = reorderMode && index < filteredLength - 1;
  const showDropAbove = dropHintPosition === 'above';
  const showDropBelow = dropHintPosition === 'below';

  return (
    <React.Fragment>
      {showDropAbove && <DropIndicator />}
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
        isDragging={isDragging}
        dropHintPosition={dropHintPosition}
        reorderMode={reorderMode}
        onMoveUp={canMoveUp ? () => void moveHabit(habit.id, 'up') : undefined}
        onMoveDown={canMoveDown ? () => void moveHabit(habit.id, 'down') : undefined}
        disableMoveUp={!canMoveUp}
        disableMoveDown={!canMoveDown}
      />
      {showDropBelow && <DropIndicator />}
    </React.Fragment>
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
        daysSinceLastCompletion={props.daysSinceLastCompletion}
        handleExport={props.handleExport}
        reorderMode={props.reorderMode}
        toggleReorderMode={props.toggleReorderMode}
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
        sortMode={props.sortMode}
        setSortMode={props.setSortMode}
      />
      <HabitListSection
        filtered={props.filtered}
        dropHint={props.dropHint}
        dragOverHabitId={props.dragOverHabitId}
        draggedHabitId={props.draggedHabitId}
        handleToggle={props.handleToggle}
        handleDrop={props.handleDrop}
        handleDragStart={props.handleDragStart}
        handleDragOver={props.handleDragOver}
        handleDragEnd={props.handleDragEnd}
        reorderMode={props.reorderMode}
        moveHabit={props.moveHabit}
        navigate={props.navigate}
        selectedTags={props.selectedTags}
      />
    </div>
  );
}
