import React, { useMemo, useState } from 'react';
import type { Habit } from '@/types/habit';
import type { HabitColorTheme } from '@/lib/theme/habit-colors';
import { formatDate } from '@/lib/habits/habitStats';
import { describeSchedule } from '@habbit-runner/shared';
import { isScheduledForDate, resolveHabitSchedule } from '@/lib/habits/schedule';
const POPOVER_WIDTH = 200;
const POPOVER_HEIGHT = 120;
const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type RetroCalendarDay = {
  date: string;
  dayOfMonth: number;
  scheduled: boolean;
  count: number;
  isToday: boolean;
  isFuture: boolean;
  isEmpty: boolean; // padding cell before first day
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

function buildRetroGrid(habit: Habit, schedule: ReturnType<typeof resolveHabitSchedule>) {
  const now = new Date();
  const todayKey = formatDate(now);

  // Start from 30 days ago
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 29);

  // Pad to beginning of that week (Sunday)
  const paddedStart = new Date(startDate);
  paddedStart.setDate(paddedStart.getDate() - paddedStart.getDay());

  const days: RetroCalendarDay[] = [];

  // Add padding cells before startDate
  const paddingCount = startDate.getDay();
  for (let i = 0; i < paddingCount; i++) {
    const date = new Date(paddedStart);
    date.setDate(paddedStart.getDate() + i);
    days.push({
      date: formatDate(date),
      dayOfMonth: date.getDate(),
      scheduled: false,
      count: 0,
      isToday: false,
      isFuture: false,
      isEmpty: true
    });
  }

  // Add actual 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateKey = formatDate(date);
    days.push({
      date: dateKey,
      dayOfMonth: date.getDate(),
      scheduled: isScheduledForDate(schedule, date),
      count: habit.completions[dateKey] ?? 0,
      isToday: dateKey === todayKey,
      isFuture: date > now,
      isEmpty: false
    });
  }

  // Chunk into weeks
  const weeks: RetroCalendarDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
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
  const weeks = useMemo(() => buildRetroGrid(habit, schedule), [habit, schedule]);
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
  if (day.isFuture || day.isEmpty) {
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
    return { ...prev, pendingValue: clampValue(prev.pendingValue + delta, 0, maxValue) };
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
    <div className="bg-bg-secondary border border-border rounded-2xl p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-[11px] font-mono text-muted uppercase tracking-[0.5em]">Retro calendar</h2>
          <p className="text-[10px] text-muted mt-0.5">{scheduleLabel}</p>
        </div>
        <span className="text-[11px] font-mono text-muted">30d</span>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-[3px]">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="text-center text-[9px] font-mono text-muted uppercase tracking-wider py-0.5">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="space-y-[3px]">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-[3px]">
            {week.map((day, di) => (
              <RetroCalendarDayCell
                key={day.date + di}
                day={day}
                maxValue={maxValue}
                accent={accent}
                onDayClick={handleDayClick}
              />
            ))}
          </div>
        ))}
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

type RetroCalendarDayCellProps = {
  day: RetroCalendarDay;
  maxValue: number;
  accent: HabitColorTheme;
  onDayClick: (day: RetroCalendarDay, event: React.MouseEvent<HTMLButtonElement>) => void;
};

function getDayBackground(day: RetroCalendarDay, maxValue: number, accent: HabitColorTheme) {
  if (day.isEmpty || day.isFuture) {
    return 'transparent';
  }
  if (day.count >= maxValue) {
    return accent.heatmapLevels[4];
  }
  if (day.count > 0) {
    return accent.heatmapLevels[3];
  }
  return 'var(--bg-card)';
}

function getDayButtonClasses(day: RetroCalendarDay) {
  const classes = ['aspect-square', 'rounded-lg', 'border', 'flex', 'flex-col', 'items-center', 'justify-center', 'transition-all', 'duration-150', 'relative'];
  if (day.isFuture) {
    classes.push('opacity-30', 'cursor-not-allowed');
  } else {
    classes.push('hover:brightness-110');
  }
  if (day.isToday) {
    classes.push('ring-1');
  }
  return classes.join(' ');
}

function getDayButtonStyle(day: RetroCalendarDay, maxValue: number, accent: HabitColorTheme, bg: string) {
  const completed = day.count >= maxValue;
  const borderColor = day.scheduled ? accent.hex : 'var(--border)';
  const borderStyle = day.scheduled ? 'solid' : 'dashed';
  const boxShadow = completed ? `0 0 10px ${accent.glow}` : undefined;
  const style: React.CSSProperties = {
    backgroundColor: bg,
    borderColor,
    borderStyle,
    boxShadow,
    ...(day.isToday ? { '--tw-ring-color': accent.hex } as React.CSSProperties : {})
  };
  return style;
}

function getDayLabelClass(day: RetroCalendarDay, completed: boolean) {
  const classes = ['text-[10px]', 'font-mono', 'leading-none'];
  if (completed) {
    classes.push('font-bold', 'text-foreground');
  } else if (day.isToday) {
    classes.push('font-semibold');
  } else {
    classes.push('text-muted');
  }
  return classes.join(' ');
}

function RetroCalendarDayCell({ day, maxValue, accent, onDayClick }: RetroCalendarDayCellProps) {
  if (day.isEmpty) {
    return <div className="aspect-square" />;
  }

  const bg = getDayBackground(day, maxValue, accent);
  const completed = day.count >= maxValue;

  return (
    <button
      type="button"
      onClick={(event) => onDayClick(day, event)}
      disabled={day.isFuture}
      className={getDayButtonClasses(day)}
      style={getDayButtonStyle(day, maxValue, accent, bg)}
      aria-label={`${day.date} ${day.scheduled ? 'scheduled' : 'manual'} ${day.count}/${maxValue}`}
    >
      <span className={getDayLabelClass(day, completed)} style={day.isToday && !completed ? { color: accent.hex } : undefined}>
        {day.dayOfMonth}
      </span>
      {day.count > 0 && maxValue > 1 && (
        <span className="text-[8px] font-mono text-foreground/60 leading-none mt-0.5">{day.count}/{maxValue}</span>
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
          <p className="text-[10px] font-mono" style={{ color: accent.hex }}>
            {editor.date}
          </p>
          <button onClick={onClose} className="text-[12px] font-bold text-muted">×</button>
        </div>
        <div className="mt-3 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => onAdjust(-1)}
            disabled={editor.pendingValue <= 0}
            className="w-9 h-9 rounded-full border border-border text-sm leading-none disabled:text-muted"
          >–</button>
          <span className="text-sm font-semibold text-foreground">{editor.pendingValue}/{maxValue}</span>
          <button
            type="button"
            onClick={() => onAdjust(1)}
            disabled={editor.pendingValue >= maxValue}
            className="w-9 h-9 rounded-full border border-border text-sm leading-none disabled:text-muted"
          >+</button>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => { void onSave(); }}
            className="flex-1 rounded-lg border border-border bg-accent/10 px-3 py-2 text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-accent transition hover:bg-accent/20"
            style={{ boxShadow: `0 0 8px ${accent.glow}` }}
          >Save</button>
          <button
            type="button"
            onClick={() => { void onReset(); }}
            className="flex-1 rounded-lg border border-border px-3 py-2 text-[10px] font-mono uppercase tracking-[0.3em] text-muted transition hover:border-border-hover"
          >Reset</button>
        </div>
      </div>
    </>
  );
}
