import React from 'react';
import {
  CheckIcon,
  ChevronRightIcon,
  FlameIcon,
  GripVerticalIcon,
  TrendingUpIcon
} from 'lucide-react';
import { CompletionRing } from '@/components/CompletionRing';
import { MiniHeatmap } from '@/components/MiniHeatmap';
import { HABIT_COLOR_THEMES } from '@/lib/theme/habit-colors';
import type { Habit } from '@/types/habit';

function getDateKey(date: Date) {
  return date.toISOString().split('T')[0];
}

function calculateStreak(completions: Record<string, number>, target: number) {
  const cursor = new Date();
  let count = 0;
  while (count < 366) {
    const key = getDateKey(cursor);
    if ((completions[key] ?? 0) < target) {
      break;
    }
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

function buildLastWeek(completions: Record<string, number>, target: number) {
  return Array.from({ length: 7 }, (_, index) => {
    const cursor = new Date();
    cursor.setDate(cursor.getDate() - (6 - index));
    const key = getDateKey(cursor);
    return (completions[key] ?? 0) >= target;
  });
}

function calculate30DayRate(completions: Record<string, number>, target: number) {
  let count = 0;
  for (let i = 0; i < 30; i++) {
    const cursor = new Date();
    cursor.setDate(cursor.getDate() - i);
    const key = getDateKey(cursor);
    if ((completions[key] ?? 0) >= target) {
      count++;
    }
  }
  return Math.round((count / 30) * 100);
}

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

function HabitRowMetrics({
  habit,
  target,
  streak,
  last7,
  completionRate
}: {
  habit: Habit;
  target: number;
  streak: number;
  last7: boolean[];
  completionRate: number;
}) {
  const accent = HABIT_COLOR_THEMES[habit.color];

  return (
    <>
      <div className="hidden lg:flex items-center justify-end mr-1" aria-hidden>
        <MiniHeatmap completions={habit.completions} dailyTarget={target} color={habit.color} />
      </div>

      <div className="hidden md:flex items-end gap-[1px] h-4 sm:h-5" aria-hidden>
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

      <div className="hidden md:block">
        <CompletionRing percentage={completionRate} size={32} strokeWidth={2.5} color={habit.color} showText={false} />
      </div>
    </>
  );
}

function HabitRowMobileStats({
  habit,
  streak,
  last7,
  completionRate,
}: {
  habit: Habit;
  streak: number;
  last7: boolean[];
  completionRate: number;
}) {
  const accent = HABIT_COLOR_THEMES[habit.color];
  return (
    <div
      className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-muted text-foreground"
    >
      {streak > 0 && (
        <div className="flex items-center gap-1">
          <FlameIcon size={12} className="text-accent-secondary" />
          <span className="font-semibold text-foreground">{streak}d</span>
        </div>
      )}
      <div className="flex items-center gap-1">
        <TrendingUpIcon size={12} className="text-accent-secondary" />
        <span className="font-semibold text-foreground">{completionRate}% 30d</span>
      </div>
      <div className="flex items-center gap-[2px] h-5" aria-hidden>
        {last7.map((done, i) => (
          <span
            key={i}
            className="w-[4px] rounded-sm transition-all"
            style={{
              height: done ? '100%' : '45%',
              backgroundColor: done ? accent.hex : 'var(--border)',
              opacity: done ? 1 : 0.5 + i * 0.03
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function HabitRow({
  habit,
  onToggle,
  onDetail,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDropTarget
}: HabitRowProps) {
  const todayKey = getDateKey(new Date());
  const target = Math.max(1, habit.dailyTarget ?? 1);
  const todayCount = habit.completions[todayKey] ?? 0;
  const completed = todayCount >= target;
  const accent = HABIT_COLOR_THEMES[habit.color];
  const streak = calculateStreak(habit.completions, target);
  const last7 = buildLastWeek(habit.completions, target);
  const completionRate = calculate30DayRate(habit.completions, target);

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
      className={`group flex items-stretch bg-bg-secondary border border-border rounded-xl overflow-hidden hover:border-border-hover transition-colors cursor-pointer ${
        isDropTarget ? 'border-accent/60 bg-accent/5' : ''
      }`}
    >
      {/* Accent strip */}
      <div
        className="w-1 self-stretch flex-shrink-0 rounded-l-xl"
        style={{ background: accent.hex }}
        aria-hidden
      />

      {/* Card body */}
      <div className="flex-1 flex items-center gap-3 px-3 py-2.5">
        {/* Drag handle */}
        <div className="hidden sm:flex items-center pr-1">
          <GripVerticalIcon size={14} className="text-muted" aria-hidden />
        </div>

        {/* Checkbox */}
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

        {/* Icon + info */}
        <button
          type="button"
          onClick={onDetail}
          className="flex flex-1 min-w-0 items-center gap-2.5 text-left"
        >
          <span className="flex-shrink-0 text-base leading-none">{habit.icon}</span>
          <div className="min-w-0 flex-1">
            <div className={`text-sm font-medium ${completed ? 'text-muted line-through' : 'text-foreground'} truncate`}>
              {habit.name}
            </div>
            <div className="text-[10px] font-mono text-muted mt-0.5">
              {todayCount}/{target} today
            </div>
            <div className="hidden sm:flex items-center gap-2 mt-0.5">
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
            <HabitRowMobileStats
              habit={habit}
              streak={streak}
              last7={last7}
              completionRate={completionRate}
            />
          </div>
        </button>

        {/* Desktop metrics */}
        <HabitRowMetrics
          habit={habit}
          target={target}
          streak={streak}
          last7={last7}
          completionRate={completionRate}
        />

        {/* Chevron */}
        <button
          type="button"
          onClick={onDetail}
          aria-label={`Open details for ${habit.name}`}
          className="hidden sm:block text-border-hover group-hover:text-muted transition-colors"
        >
          <ChevronRightIcon size={14} />
        </button>
      </div>
    </div>
  );
}

export function DropIndicator() {
  return (
    <div className="px-4 py-1">
      <div className="h-[3px] w-full rounded-full bg-gradient-to-r from-accent to-accent-secondary animate-pulse transition-all" />
    </div>
  );
}
