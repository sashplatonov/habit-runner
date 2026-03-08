import React from 'react';
import {
  BellRingIcon,
  CheckIcon,
  ChevronRightIcon,
  FlameIcon,
  GripVerticalIcon,
  TrendingUpIcon,
  ZapIcon
} from 'lucide-react';
import { CompletionRing } from '@/components/CompletionRing';
import { MiniHeatmap } from '@/components/MiniHeatmap';
import { Onboarding, type OnboardingTemplate } from '@/components/Onboarding';
import { HABIT_COLOR_THEMES } from '@/lib/theme/habit-colors';
import type { Habit } from '@/types/habit';

type Reminder = {
  habitId: string;
  time: string;
  message: string;
};

type HabitRowProps = {
  habit: Habit;
  onToggle: () => void;
  onDetail: () => void;
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: () => void;
  isDropTarget?: boolean;
};

function HabitRow({
  habit,
  onToggle,
  onDetail,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDropTarget
}: HabitRowProps) {
  const today = new Date().toISOString().split('T')[0];
  const target = Math.max(1, habit.dailyTarget ?? 1);
  const todayCount = habit.completions[today] ?? 0;
  const completed = todayCount >= target;
  const accent = HABIT_COLOR_THEMES[habit.color];

  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 366; i++) {
    const key = d.toISOString().split('T')[0];
    if ((habit.completions[key] ?? 0) < target) {
      break;
    }
    streak++;
    d.setDate(d.getDate() - 1);
  }

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return (habit.completions[date.toISOString().split('T')[0]] ?? 0) >= target;
  });

  let rate30 = 0;
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    if ((habit.completions[date.toISOString().split('T')[0]] ?? 0) >= target) {
      rate30++;
    }
  }
  const completionRate = Math.round((rate30 / 30) * 100);

  return (
    <div
      draggable={Boolean(onDragStart)}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      tabIndex={0}
      role="listitem"
      aria-label={`${habit.name}, ${completed ? 'completed' : 'not completed'}`}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          onDetail();
          return;
        }
        if (event.key === ' ') {
          event.preventDefault();
          onToggle();
        }
      }}
      className={`group flex items-center gap-3 px-4 py-3 border-b border-border hover:bg-bg-secondary transition-colors cursor-pointer ${
        completed ? 'opacity-100' : 'opacity-90'
      } ${isDropTarget ? 'border-accent/60 bg-accent/5' : ''}`}
    >
      <div className="flex items-center gap-2 pr-1">
        <GripVerticalIcon size={14} className="text-muted" aria-hidden />
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
          completed
            ? `${accent.bgClass} ${accent.borderClass} ${accent.shadowClass}`
            : 'border-border-hover hover:border-muted'
        }`}
        aria-label={`Mark ${habit.name} as ${completed ? 'incomplete' : 'complete'}`}
      >
        {completed && <CheckIcon size={11} className={accent.textClass} strokeWidth={3} />}
      </button>

      <button type="button" onClick={onDetail} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
        <span className="text-base leading-none">{habit.icon}</span>
        <div className="min-w-0">
          <div className={`text-sm font-medium ${completed ? 'text-muted line-through' : 'text-foreground'} truncate`}>
            {habit.name}
          </div>
          <div className="text-[10px] font-mono text-muted mt-0.5">
            {todayCount}/{target} today
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {habit.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-[10px] font-mono text-foreground bg-bg-card border border-border rounded px-1.5 py-0.5"
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent.hex }} />
                {tag}
              </span>
            ))}
          </div>
        </div>
      </button>

      <div className="flex items-center justify-end mr-1" aria-hidden>
        <MiniHeatmap completions={habit.completions} dailyTarget={target} color={habit.color} />
      </div>

      <div className="flex items-end gap-[1px] h-4 sm:h-5" aria-hidden>
        {last7.map((done, i) => (
          <div
            key={i}
            className="w-[4px] rounded-sm transition-all"
            style={{
              height: done ? '100%' : '30%',
              backgroundColor: done ? accent.hex : 'var(--border)',
              opacity: i === 6 ? 1 : 0.5 + i * 0.07
            }}
          />
        ))}
      </div>

      <div className="flex items-center gap-1 w-12 sm:w-16 justify-end">
        {streak > 0 && (
          <>
            <FlameIcon size={11} className="text-accent-secondary" />
            <span className="text-[11px] font-mono text-accent-secondary">{streak}</span>
          </>
        )}
      </div>

      <CompletionRing percentage={completionRate} size={32} strokeWidth={2.5} color={habit.color} showText={false} />

      <button
        type="button"
        onClick={onDetail}
        aria-label={`Open details for ${habit.name}`}
        className="text-border-hover group-hover:text-muted transition-colors"
      >
        <ChevronRightIcon size={14} />
      </button>
    </div>
  );
}

function DropIndicator() {
  return (
    <div className="px-4 py-1">
      <div className="h-[3px] w-full rounded-full bg-gradient-to-r from-accent to-accent-secondary animate-pulse transition-all" />
    </div>
  );
}

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

export function DashboardView({
  habits,
  filtered,
  reminders,
  dropHint,
  dragOverHabitId,
  filter,
  allTags,
  selectedTags,
  addingTemplate,
  today,
  todayRate,
  completedToday,
  totalActive,
  dateStr,
  overallStreak,
  setFilter,
  setSelectedTags,
  toggleTag,
  navigate,
  handleExport,
  handleTemplateSelect,
  handleToggle,
  handleDismissReminder,
  handleDragStart,
  handleDragOver,
  handleDrop,
  handleDragEnd
}: DashboardViewProps) {
  if (habits.length === 0) {
    return (
      <div className="min-h-screen bg-bg-primary pt-14">
        <Onboarding onCreateCustom={() => navigate('/habit/new')} onTemplateSelect={handleTemplateSelect} activeTemplate={addingTemplate} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary pt-14">
      <div className="border-b border-border bg-bg-primary px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[11px] font-mono text-muted uppercase tracking-widest mb-1">{dateStr}</p>
              <h1 className="text-xl font-semibold text-foreground">Today</h1>
            </div>
            <div className="text-right">
              <div className="text-3xl font-mono font-bold text-accent" style={{ textShadow: '0 0 20px var(--glow)' }}>
                {todayRate}%
              </div>
              <div className="text-[10px] font-mono text-muted">{completedToday}/{totalActive} done</div>
            </div>
          </div>
          <div className="h-1 bg-border rounded-full overflow-hidden mb-4">
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

          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-bg-secondary border border-border rounded-lg px-3 py-2">
              <div className="flex items-center gap-1.5 mb-1">
                <ZapIcon size={10} className="text-accent" />
                <span className="text-[10px] font-mono text-muted uppercase tracking-wider">Active</span>
              </div>
              <span className="text-lg font-mono font-bold text-foreground">{totalActive}</span>
            </div>
            <div className="bg-bg-secondary border border-border rounded-lg px-3 py-2">
              <div className="flex items-center gap-1.5 mb-1">
                <FlameIcon size={10} className="text-accent-secondary" />
                <span className="text-[10px] font-mono text-muted uppercase tracking-wider">Streak</span>
              </div>
              <span className="text-lg font-mono font-bold text-accent-secondary">{overallStreak}d</span>
            </div>
            <div className="bg-bg-secondary border border-border rounded-lg px-3 py-2">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUpIcon size={10} className="text-accent-secondary" />
                <span className="text-[10px] font-mono text-muted uppercase tracking-wider">Done</span>
              </div>
              <span className="text-lg font-mono font-bold text-accent-secondary">{completedToday}</span>
            </div>
          </div>
        </div>
      </div>

      {reminders.length > 0 && (
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
      )}

      <div className="border-b border-border px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-0">
            {(['all', 'pending', 'done'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider border-b-2 transition-colors ${
                  filter === f ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-foreground'
                }`}
              >
                {f}
                {f === 'pending' && (
                  <span className="ml-1.5 text-[9px] bg-border px-1 py-0.5 rounded font-mono">
                    {habits.filter((h) => (h.completions[today] ?? 0) < Math.max(1, h.dailyTarget ?? 1)).length}
                  </span>
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
                    onClick={() => toggleTag(tag)}
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
                    onClick={() => setSelectedTags([])}
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

      <div className="max-w-2xl mx-auto py-6 space-y-1" role="list" aria-label="Habit list">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted">
            <div className="text-4xl mb-3">✓</div>
            <p className="font-mono text-sm">All habits are currently paused</p>
          </div>
        ) : (
          filtered.map((habit) => (
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
          ))
        )}
      </div>
    </div>
  );
}
