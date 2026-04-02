import React, { useMemo, useState } from 'react';
import type { Habit } from '@/types/habit';
import type { HabitColorTheme } from '@/lib/theme/habit-colors';
import { formatDate } from '@/lib/habits/habitStats';
import { completionKeyToCalendarDate } from '@/lib/completionKey';
import { describeSchedule } from '@habbit-runner/shared';
import { isScheduledForDate, resolveHabitSchedule } from '@/lib/habits/schedule';
import { MonthNavigation } from './HabitRetroCalendarNavigation';
import { DAY_HEADERS } from './HabitRetroCalendar.constants';
import { RetroCalendarDayCell, type RetroCalendarDay } from './HabitRetroCalendarDayCell';
import { RetroCalendarEditorPopover, type RetroCalendarEditor } from './HabitRetroCalendarEditorPopover';

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
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      isFrozen: false
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
    const freezeKey = completionKeyToCalendarDate(dateKey);
    const weekDay = date.getDay();
    const isFrozen = (habit.freezeDays ?? []).includes(freezeKey);
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
      monthIndex: registerMonthIndex(date.getMonth()),
      isFrozen
    });
  }

  // Chunk into weeks
  const weeks: RetroCalendarDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return { weeks, monthCount: monthIndexMap.size };
}


function RetroCalendarGrid({
  weeks,
  monthCount,
  maxValue,
  accent,
  onDayClick
}: {
  weeks: RetroCalendarDay[][];
  monthCount: number;
  maxValue: number;
  accent: HabitColorTheme;
  onDayClick: (day: RetroCalendarDay, event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <div className="w-full mx-auto lg:max-w-[248px]">
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="text-center text-[9px] font-mono text-muted uppercase tracking-wider py-0.5">
            {d}
          </div>
        ))}
      </div>
      <div className="space-y-1.5 sm:space-y-2">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {week.map((day, di) => (
              <RetroCalendarDayCell
                key={day.date + di}
                day={day}
                maxValue={maxValue}
                accent={accent}
                onDayClick={onDayClick}
                monthCount={monthCount}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
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
  const disableNextMonth = displayDate.getFullYear() > new Date().getFullYear() ||
    (displayDate.getFullYear() === new Date().getFullYear() && displayDate.getMonth() >= new Date().getMonth());

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

      <MonthNavigation
        monthYearLabel={monthYearLabel}
        isCurrentMonth={isCurrentMonth}
        onPrev={handlePrevMonth}
        onNext={handleNextMonth}
        onToday={handleToday}
        disableNext={disableNextMonth}
      />

      <RetroCalendarGrid
        weeks={weeks}
        monthCount={monthCount}
        maxValue={maxValue}
        accent={accent}
        onDayClick={handleDayClick}
      />

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

