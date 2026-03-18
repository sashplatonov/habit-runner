import React, { useMemo, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import type { Habit } from '@/types/habit';
import type { HabitColorTheme } from '@/lib/theme/habit-colors';
import { formatDate } from '@/lib/habits/habitStats';
import { describeSchedule } from '@habbit-runner/shared';
import { isScheduledForDate, resolveHabitSchedule } from '@/lib/habits/schedule';
const POPOVER_WIDTH = 200;
const POPOVER_HEIGHT = 120;
const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type RetroCalendarDay = {
  date: string;
  dayOfMonth: number;
  scheduled: boolean;
  count: number;
  isToday: boolean;
  isFuture: boolean;
  isEmpty: boolean; // padding cell before first day
  dayOfWeek: number;
  isWeekend: boolean;
  monthIndex?: number;
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

function buildRetroGrid(habit: Habit, schedule: ReturnType<typeof resolveHabitSchedule>, displayDate: Date = new Date()) {
  const now = new Date();
  const todayKey = formatDate(now);

  // Start from 30 days before displayDate
  const startDate = new Date(displayDate);
  startDate.setDate(startDate.getDate() - 29);

  // Pad to beginning of that week (Monday)
  const weekStartOffset = (startDate.getDay() + 6) % 7;
  const paddedStart = new Date(startDate);
  paddedStart.setDate(paddedStart.getDate() - weekStartOffset);

  const days: RetroCalendarDay[] = [];

  // Add padding cells before startDate
  const paddingCount = weekStartOffset;
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
      isEmpty: true,
      dayOfWeek: date.getDay(),
      isWeekend: date.getDay() === 0 || date.getDay() === 6
    });
  }

  const monthIndexMap = new Map<number, number>();
  const registerMonthIndex = (month: number) => {
    if (!monthIndexMap.has(month)) {
      monthIndexMap.set(month, monthIndexMap.size);
    }
    return monthIndexMap.get(month)!;
  };

  // Add actual 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateKey = formatDate(date);
    const weekDay = date.getDay();
    days.push({
      date: dateKey,
      dayOfMonth: date.getDate(),
      scheduled: isScheduledForDate(schedule, date),
      count: habit.completions[dateKey] ?? 0,
      isToday: dateKey === todayKey,
      isFuture: date > now,
      isEmpty: false,
      dayOfWeek: weekDay,
      isWeekend: weekDay === 0 || weekDay === 6,
      monthIndex: registerMonthIndex(date.getMonth())
    });
  }

  // Chunk into weeks
  const weeks: RetroCalendarDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return { weeks, monthCount: monthIndexMap.size };
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
  const [displayDate, setDisplayDate] = useState(new Date());
  const { weeks, monthCount } = useMemo(() => buildRetroGrid(habit, schedule, displayDate), [habit, schedule, displayDate]);
  const maxValue = Math.max(1, dailyTarget);
  const scheduleLabel = describeSchedule(schedule);
  const [editor, setEditor] = useState<RetroCalendarEditor | null>(null);

  const monthYearLabel = displayDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  const isCurrentMonth = displayDate.toDateString() === new Date().toDateString() ||
    (displayDate.getMonth() === new Date().getMonth() && displayDate.getFullYear() === new Date().getFullYear());

  const handlePrevMonth = () => {
    const prev = new Date(displayDate);
    prev.setMonth(prev.getMonth() - 1);
    setDisplayDate(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(displayDate);
    next.setMonth(next.getMonth() + 1);
    setDisplayDate(next);
  };

  const handleToday = () => {
    setDisplayDate(new Date());
  };

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

      {/* Month navigation */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <button
          onClick={handlePrevMonth}
          className="flex items-center justify-center w-7 h-7 rounded border border-border hover:border-border-hover text-muted hover:text-foreground transition-colors"
          title="Previous month"
        >
          <ChevronLeftIcon size={16} />
        </button>

        <div className="flex-1 text-center">
          <button
            onClick={handleToday}
            className={`text-xs font-mono uppercase tracking-wider transition-colors ${
              isCurrentMonth
                ? 'text-foreground font-semibold'
                : 'text-muted hover:text-foreground'
            }`}
            title="Jump to current month"
          >
            {monthYearLabel}
          </button>
        </div>

        <button
          onClick={handleNextMonth}
          className="flex items-center justify-center w-7 h-7 rounded border border-border hover:border-border-hover text-muted hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={displayDate.getFullYear() > new Date().getFullYear() || (displayDate.getFullYear() === new Date().getFullYear() && displayDate.getMonth() >= new Date().getMonth())}
          title="Next month"
        >
          <ChevronRightIcon size={16} />
        </button>
      </div>

      <div className="w-full mx-auto lg:max-w-[248px]">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {DAY_HEADERS.map((d) => (
            <div key={d} className="text-center text-[9px] font-mono text-muted uppercase tracking-wider py-0.5">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="space-y-1.5 sm:space-y-2">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {week.map((day, di) => (
                <RetroCalendarDayCell
                  key={day.date + di}
                  day={day}
                  maxValue={maxValue}
                  accent={accent}
                  onDayClick={handleDayClick}
                  monthCount={monthCount}
                />
              ))}
            </div>
          ))}
        </div>
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
  monthCount: number;
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
  const classes = ['aspect-square', 'w-full', 'rounded-md', 'border', 'flex', 'flex-col', 'items-center', 'justify-center', 'transition-all', 'duration-150', 'relative', 'overflow-hidden'];
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

type MonthHighlight = 'current' | 'previous' | null;

type DayStyleOptions = {
  day: RetroCalendarDay;
  maxValue: number;
  accent: HabitColorTheme;
  bg: string;
  monthOpacity?: number;
  monthHighlight: MonthHighlight;
};

type BoxShadowParams = {
  completed: boolean;
  accent: HabitColorTheme;
  weekendHighlight: boolean;
  monthHighlight: MonthHighlight;
};

function buildDayBoxShadow({ completed, accent, weekendHighlight, monthHighlight }: BoxShadowParams) {
  const parts: string[] = [];
  if (completed) {
    parts.push(`0 0 10px ${accent.glow}`);
  }
  if (weekendHighlight) {
    parts.push(`0 0 0 1px ${accent.hex}40`);
  }
  if (monthHighlight) {
    parts.push(
      `0 0 ${monthHighlight === 'current' ? 6 : 4}px ${accent.hex}${monthHighlight === 'current' ? '80' : '50'}`
    );
  }
  return parts.length ? parts.join(', ') : undefined;
}

function getDayButtonStyle({
  day,
  maxValue,
  accent,
  bg,
  monthOpacity,
  monthHighlight
}: DayStyleOptions) {
  const completed = day.count >= maxValue;
  const baseBorderColor = day.scheduled ? accent.hex : 'var(--border)';
  const borderStyle = day.scheduled ? 'solid' : 'dashed';
  const weekendHighlight = day.isWeekend && !day.isFuture && !day.isEmpty;
  const boxShadow = buildDayBoxShadow({
    completed,
    accent,
    weekendHighlight,
    monthHighlight
  });
  const weekendTint: React.CSSProperties = weekendHighlight
    ? {
        backgroundImage: `linear-gradient(135deg, ${accent.dim}, transparent)`,
        filter: 'saturate(1.08)'
      }
    : {};
  const style: React.CSSProperties = {
    backgroundColor: bg,
    borderColor:
      weekendHighlight || monthHighlight ? accent.hex : baseBorderColor,
    borderStyle,
    boxShadow,
    ...(monthOpacity ? { opacity: monthOpacity } : {}),
    ...weekendTint,
    ...(day.isToday ? { '--tw-ring-color': accent.hex } as React.CSSProperties : {})
  };
  return style;
}

function getDayLabelClass(day: RetroCalendarDay, completed: boolean) {
  const classes = ['text-[9px]', 'font-mono', 'leading-none'];
  if (completed) {
    classes.push('font-bold', 'text-foreground');
  } else if (day.isToday) {
    classes.push('font-semibold');
  } else {
    classes.push('text-muted');
  }
  return classes.join(' ');
}

function getMonthMeta(day: RetroCalendarDay, monthCount: number) {
  const monthSlot = Math.min(Math.max(day.monthIndex ?? 0, 0), Math.max(monthCount - 1, 0));
  const currentMonthIndex = Math.max(monthCount - 1, 0);
  const previousMonthIndex = monthCount > 1 ? monthCount - 2 : null;
  const isCurrentMonth = !day.isFuture && monthSlot === currentMonthIndex;
  const isPreviousMonth = previousMonthIndex !== null && !day.isFuture && monthSlot === previousMonthIndex;
  const monthHighlight: MonthHighlight = isCurrentMonth ? 'current' : isPreviousMonth ? 'previous' : null;
  const monthOpacity = !day.isFuture
    ? monthHighlight === 'current'
      ? 1
      : monthHighlight === 'previous'
        ? 0.78
        : Math.max(0.5, 0.9 - monthSlot * 0.15)
    : undefined;
  return { monthOpacity, monthHighlight };
}

function RetroCalendarDayCell({ day, maxValue, accent, onDayClick, monthCount }: RetroCalendarDayCellProps) {
  if (day.isEmpty) {
    return <div className="aspect-square w-full" />;
  }

  const bg = getDayBackground(day, maxValue, accent);
  const completed = day.count >= maxValue;
  const { monthOpacity, monthHighlight } = getMonthMeta(day, monthCount);

  return (
    <button
      type="button"
      onClick={(event) => onDayClick(day, event)}
      disabled={day.isFuture}
      className={getDayButtonClasses(day)}
      style={getDayButtonStyle({ day, maxValue, accent, bg, monthOpacity, monthHighlight })}
      aria-label={`${day.date} ${day.scheduled ? 'scheduled' : 'manual'} ${day.count}/${maxValue}`}
    >
      <span className={getDayLabelClass(day, completed)} style={day.isToday && !completed ? { color: accent.hex } : undefined}>
        {day.dayOfMonth}
      </span>
      {day.count > 0 && maxValue > 1 && (
        <span className="text-[7px] font-mono text-foreground/60 leading-none">{day.count}/{maxValue}</span>
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
