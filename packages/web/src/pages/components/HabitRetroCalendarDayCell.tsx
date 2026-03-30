import React from 'react';
import { SnowflakeIcon } from 'lucide-react';
import type { HabitColorTheme } from '@/lib/theme/habit-colors';

export type RetroCalendarDay = {
  date: string;
  dayOfMonth: number;
  scheduled: boolean;
  count: number;
  isToday: boolean;
  isFuture: boolean;
  isEmpty: boolean;
  dayOfWeek: number;
  isWeekend: boolean;
  monthIndex?: number;
  isFrozen: boolean;
};

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

type RetroCalendarDayCellProps = {
  day: RetroCalendarDay;
  maxValue: number;
  accent: HabitColorTheme;
  onDayClick: (day: RetroCalendarDay, event: React.MouseEvent<HTMLButtonElement>) => void;
  monthCount: number;
};

export function RetroCalendarDayCell({ day, maxValue, accent, onDayClick, monthCount }: RetroCalendarDayCellProps) {
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
      aria-label={`${day.date} ${day.scheduled ? 'scheduled' : 'manual'} ${day.count}/${maxValue}${day.isFrozen ? ' frozen' : ''}`}
    >
      <span className={getDayLabelClass(day, completed)} style={day.isToday && !completed ? { color: accent.hex } : undefined}>
        {day.dayOfMonth}
      </span>
      {day.count > 0 && maxValue > 1 && (
        <span className="text-[7px] font-mono text-foreground/60 leading-none">{day.count}/{maxValue}</span>
      )}
      {day.isFrozen && (
        <span className="absolute top-1 right-1 text-[8px] text-accent-secondary" aria-hidden>
          <SnowflakeIcon size={10} strokeWidth={2} />
        </span>
      )}
    </button>
  );
}

export default RetroCalendarDayCell;

