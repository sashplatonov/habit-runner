import React, { useMemo, useState } from 'react';
import type { Habit, HabitSchedule } from '@/types/habit';
import type { HabitColorTheme } from '@/lib/theme/habit-colors';
import { DAY_LABELS } from '../add-edit-habit.constants';
import { formatDate } from '@/lib/habits/habitStats';
import { describeSchedule } from '@habbit-runner/shared';
import { isScheduledForDate, resolveHabitSchedule } from '@/lib/habits/schedule';

const RETRO_WEEK_COUNT = 6;
const POPOVER_WIDTH = 200;
const POPOVER_HEIGHT = 120;

type RetroCalendarDay = {
  date: string;
  scheduled: boolean;
  count: number;
  isToday: boolean;
  isFuture: boolean;
};

type RetroCalendarEditor = {
  date: string;
  pendingValue: number;
  anchorX: number;
  anchorY: number;
};

function clampValue(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

function buildRetroWeeks(habit: Habit, schedule: HabitSchedule) {
  const weeks: RetroCalendarDay[][] = [];
  const now = new Date();
  const todayKey = formatDate(now);
  const start = new Date(now);
  start.setDate(start.getDate() - start.getDay() - (RETRO_WEEK_COUNT - 1) * 7);

  for (let weekIndex = 0; weekIndex < RETRO_WEEK_COUNT; weekIndex++) {
    const week: RetroCalendarDay[] = [];
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const date = new Date(start);
      date.setDate(start.getDate() + weekIndex * 7 + dayIndex);
      const dateKey = formatDate(date);
      week.push({
        date: dateKey,
        scheduled: isScheduledForDate(schedule, date),
        count: habit.completions[dateKey] ?? 0,
        isToday: dateKey === todayKey,
        isFuture: date > now
      });
    }
    weeks.push(week);
  }
  return weeks;
}

function clampPopoverX(anchorX: number) {
  if (typeof window === 'undefined') {
    return anchorX;
  }
  const min = 12;
  const max = window.innerWidth - POPOVER_WIDTH - 12;
  return Math.min(Math.max(anchorX - POPOVER_WIDTH / 2, min), Math.max(min, max));
}

function clampPopoverY(anchorY: number) {
  if (typeof window === 'undefined') {
    return anchorY;
  }
  const min = 12;
  const max = window.innerHeight - POPOVER_HEIGHT - 12;
  return Math.min(Math.max(anchorY - POPOVER_HEIGHT - 16, min), Math.max(min, max));
}

type HabitRetroCalendarProps = {
  habit: Habit;
  dailyTarget: number;
  accent: HabitColorTheme;
  setCompletionCount: (habitId: string, date: string, count: number) => Promise<unknown>;
};

export function HabitRetroCalendar({ habit, dailyTarget, accent, setCompletionCount }: HabitRetroCalendarProps) {
  const schedule = useMemo(() => resolveHabitSchedule(habit), [habit]);
  const weeks = useMemo(() => buildRetroWeeks(habit, schedule), [habit, schedule]);
  const maxValue = Math.max(1, dailyTarget);
  const scheduleLabel = describeSchedule(schedule);
  const [editor, setEditor] = useState<RetroCalendarEditor | null>(null);

  const openMultiTargetEditor = (day: RetroCalendarDay, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setEditor({
      date: day.date,
      pendingValue: clampValue(day.count, 0, maxValue),
      anchorX: rect.left + rect.width / 2,
      anchorY: rect.top
    });
  };

  const toggleSingleTargetDay = (day: RetroCalendarDay) => {
    const nextValue = day.count > 0 ? 0 : 1;
    void setCompletionCount(habit.id, day.date, nextValue);
  };

  const handleDayClick = (day: RetroCalendarDay, event: React.MouseEvent<HTMLButtonElement>) => {
    if (day.isFuture) {
      return;
    }
    if (maxValue > 1) {
      openMultiTargetEditor(day, event);
      return;
    }
    toggleSingleTargetDay(day);
  };

  const adjustEditorValue = (delta: number) => {
    setEditor((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        pendingValue: clampValue(prev.pendingValue + delta, 0, maxValue)
      };
    });
  };

  const applyEditorValue = async () => {
    if (!editor) {
      return;
    }
    await setCompletionCount(habit.id, editor.date, clampValue(editor.pendingValue, 0, maxValue));
    setEditor(null);
  };

  const handleReset = async () => {
    if (!editor) {
      return;
    }
    await setCompletionCount(habit.id, editor.date, 0);
    setEditor(null);
  };

  const closeEditor = () => setEditor(null);

  return (
    <div className="bg-bg-secondary border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-[11px] font-mono text-muted uppercase tracking-[0.5em]">Retro calendar</h2>
          <p className="text-[10px] text-muted mt-1">{scheduleLabel}</p>
          <p className="text-[10px] text-muted mt-1">Tap to edit past days, future dates are locked.</p>
        </div>
        <span className="text-[11px] font-mono text-muted">{RETRO_WEEK_COUNT}w</span>
      </div>
      <RetroCalendarGrid weeks={weeks} maxValue={maxValue} accent={accent} onDayClick={handleDayClick} />
      <div className="flex flex-wrap gap-3 text-[10px] font-mono text-muted">
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accent.heatmapLevels[4] }} />
          Completed day
        </span>
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full border border-border" />
          Scheduled day
        </span>
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full border border-dashed border-border/40" />
          Manual day
        </span>
      </div>
      {editor && (
        <RetroCalendarEditorPopover
          editor={editor}
          maxValue={maxValue}
          accent={accent}
          onAdjust={adjustEditorValue}
          onClose={closeEditor}
          onSave={applyEditorValue}
          onReset={handleReset}
        />
      )}
    </div>
  );
}

type RetroCalendarGridProps = {
  weeks: RetroCalendarDay[][];
  maxValue: number;
  accent: HabitColorTheme;
  onDayClick: (day: RetroCalendarDay, event: React.MouseEvent<HTMLButtonElement>) => void;
};

function RetroCalendarGrid({ weeks, maxValue, accent, onDayClick }: RetroCalendarGridProps) {
  return (
    <div className="flex gap-2">
      <div className="flex flex-col gap-1 mt-[2px]">
        {DAY_LABELS.map((day) => (
          <span key={day} className="text-[9px] font-mono text-muted uppercase tracking-[0.25em]">
            {day[0]}
          </span>
        ))}
      </div>
      <div className="flex gap-[6px] overflow-x-auto pb-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-[6px]">
            {week.map((day) => (
              <RetroCalendarDayCell
                key={day.date}
                day={day}
                maxValue={maxValue}
                accent={accent}
                onDayClick={onDayClick}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

type RetroCalendarDayCellProps = {
  day: RetroCalendarDay;
  maxValue: number;
  accent: HabitColorTheme;
  onDayClick: (day: RetroCalendarDay, event: React.MouseEvent<HTMLButtonElement>) => void;
};

function getDayBackgroundColor(day: RetroCalendarDay, maxValue: number, accent: HabitColorTheme) {
  if (day.isFuture) {
    return 'var(--bg-card)';
  }
  if (day.count >= maxValue) {
    return accent.heatmapLevels[4];
  }
  if (day.count > 0) {
    return accent.heatmapLevels[3];
  }
  return 'var(--bg-card)';
}

function getDayBoxShadow(day: RetroCalendarDay, maxValue: number, accent: HabitColorTheme) {
  if (day.count >= maxValue) {
    return `0 0 12px ${accent.glow}`;
  }
  if (day.isToday) {
    return `0 0 0 2px ${accent.hex}`;
  }
  return undefined;
}

function RetroCalendarDayCell({ day, maxValue, accent, onDayClick }: RetroCalendarDayCellProps) {
  const backgroundColor = getDayBackgroundColor(day, maxValue, accent);
  const boxShadow = getDayBoxShadow(day, maxValue, accent);
  const borderColor = day.scheduled ? accent.hex : 'var(--border)';
  const borderStyle = day.scheduled ? 'solid' : 'dashed';

  return (
    <button
      type="button"
      onClick={(event) => onDayClick(day, event)}
      disabled={day.isFuture}
      className={`w-10 h-10 rounded-xl border transition-all duration-150 flex items-center justify-center text-[10px] font-mono ${day.isFuture ? 'cursor-not-allowed opacity-40' : 'hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(0,0,0,0.12)]'}`}
      style={{
        backgroundColor,
        borderColor,
        borderStyle,
        boxShadow
      }}
      aria-label={`${day.date} ${day.scheduled ? 'scheduled' : 'manual'} day ${day.count}/${maxValue}`}
    >
      {day.count > 0 ? (
        <span className="text-[11px] font-semibold text-foreground">{day.count}</span>
      ) : (
        <span className="text-[10px] text-muted">{day.isToday ? 'Today' : ''}</span>
      )}
    </button>
  );
}

type RetroCalendarEditorPopoverProps = {
  editor: RetroCalendarEditor;
  maxValue: number;
  accent: HabitColorTheme;
  onAdjust: (delta: number) => void;
  onClose: () => void;
  onSave: () => Promise<void>;
  onReset: () => Promise<void>;
};

function RetroCalendarEditorPopover({
  editor,
  maxValue,
  accent,
  onAdjust,
  onClose,
  onSave,
  onReset
}: RetroCalendarEditorPopoverProps) {
  const left = clampPopoverX(editor.anchorX);
  const top = clampPopoverY(editor.anchorY);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 w-[200px] rounded-2xl border border-border bg-bg-primary p-3 shadow-[0_20px_40px_rgba(0,0,0,0.35)]"
        style={{ left, top }}
      >
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-mono text-muted" style={{ color: accent.hex }}>
            {editor.date}
          </p>
          <button onClick={onClose} className="text-[12px] font-bold text-muted">
            ×
          </button>
        </div>
        <div className="mt-3 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => onAdjust(-1)}
            disabled={editor.pendingValue <= 0}
            className="w-9 h-9 rounded-full border border-border text-sm leading-none disabled:text-muted"
          >
            –
          </button>
          <span className="text-sm font-semibold text-foreground">
            {editor.pendingValue}/{maxValue}
          </span>
          <button
            type="button"
            onClick={() => onAdjust(1)}
            disabled={editor.pendingValue >= maxValue}
            className="w-9 h-9 rounded-full border border-border text-sm leading-none disabled:text-muted"
          >
            +
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => {
              void onSave();
            }}
            className="flex-1 rounded-lg border border-border bg-accent/10 px-3 py-2 text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-accent transition hover:bg-accent/20"
            style={{ boxShadow: `0 0 8px ${accent.glow}` }}
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              void onReset();
            }}
            className="flex-1 rounded-lg border border-border px-3 py-2 text-[10px] font-mono uppercase tracking-[0.3em] text-muted transition hover:border-border-hover"
          >
            Reset
          </button>
        </div>
      </div>
    </>
  );
}
