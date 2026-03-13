import React, { useMemo, useState } from 'react';
import { DEFAULT_HABIT_COLOR, HABIT_COLOR_THEMES } from '@/lib/theme/habit-colors';
import type { HabitColor } from '@/types/habit';
import { formatDate } from '@/lib/habits/habitStats';

interface HeatmapGridProps {
  completions: Record<string, number>;
  dailyTarget?: number;
  color?: HabitColor;
  weeks?: number;
}

type HeatmapCell = {
  date: string;
  completed: boolean;
  isToday: boolean;
};

function getIntensity(completed: boolean | undefined): number {
  return completed ? 4 : 0;
}

const DAY_LABEL_WIDTH = 16;

function buildHeatmapCells(
  completions: Record<string, number>,
  dailyTarget: number,
  weeks: number
): HeatmapCell[][] {
  const today = new Date();
  const cells: HeatmapCell[][] = [];
  const startDate = new Date(today);
  const weekStartOffset = (startDate.getDay() + 6) % 7;
  startDate.setDate(startDate.getDate() - weekStartOffset - (weeks - 1) * 7);

  for (let w = 0; w < weeks; w++) {
    const week: HeatmapCell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + w * 7 + d);
      const dateStr = formatDate(date);
      week.push({
        date: dateStr,
        completed: (completions[dateStr] ?? 0) >= dailyTarget,
        isToday: dateStr === formatDate(today)
      });
    }
    cells.push(week);
  }
  return cells;
}

function buildMonthLabels(cells: HeatmapCell[][]): { label: string; col: number }[] {
  const labels: { label: string; col: number }[] = [];
  let lastMonth = -1;

  cells.forEach((week, index) => {
    const month = new Date(week[0].date).getMonth();
    if (month !== lastMonth) {
      labels.push({
        label: new Date(week[0].date).toLocaleString('default', { month: 'short' }),
        col: index
      });
      lastMonth = month;
    }
  });

  return labels;
}

function DayLabels() {
  const dayLabels = ['M', 'W', 'F'];
  return (
    <div className="grid shrink-0 gap-1 sm:gap-1.5 mr-1.5" style={{ width: DAY_LABEL_WIDTH, gridTemplateRows: 'repeat(7, minmax(0, 1fr))' }}>
      {Array.from({ length: 7 }, (_, index) => (
        <div
          key={index}
          className="text-[9px] font-mono text-muted flex items-center"
        >
          {index === 0 ? dayLabels[0] : index === 2 ? dayLabels[1] : index === 4 ? dayLabels[2] : ''}
        </div>
      ))}
    </div>
  );
}

function MonthLabels({ labels, weeks }: { labels: { label: string; col: number }[]; weeks: number }) {
  return (
    <div className="relative mb-1 ml-[18px] h-4">
      {labels.map((label) => (
        <div
          key={`${label.label}-${label.col}`}
          className="absolute text-[9px] font-mono text-muted whitespace-nowrap -translate-y-1"
          style={{ left: `${(label.col / weeks) * 100}%` }}
        >
          {label.label}
        </div>
      ))}
    </div>
  );
}

function HeatmapCells({
  cells,
  levels,
  glow,
  today,
  onHover,
  onLeave
}: {
  cells: HeatmapCell[][];
  levels: string[];
  glow: string;
  today: Date;
  onHover: (cell: HeatmapCell, event: React.MouseEvent<HTMLDivElement>) => void;
  onLeave: () => void;
}) {
  return (
    <div className="grid flex-1 gap-1 sm:gap-1.5" style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}>
      {cells.map((week, wi) => (
        <div key={wi} className="grid gap-1 sm:gap-1.5" style={{ gridTemplateRows: 'repeat(7, minmax(0, 1fr))' }}>
          {week.map((cell, di) => {
            const intensity = getIntensity(cell.completed);
            const bg = levels[intensity];
            const isFuture = new Date(cell.date) > today;
            return (
              <div
                key={di}
                className="aspect-square w-full rounded-[2px] cursor-pointer transition-transform hover:scale-110"
                style={{
                  backgroundColor: isFuture ? 'var(--bg-secondary)' : intensity === 0 ? 'var(--border)' : bg,
                  opacity: isFuture ? 0.3 : 1,
                  boxShadow:
                    cell.completed && !isFuture ? `0 0 4px ${glow}` : 'none',
                  outline: cell.isToday ? `1px solid ${levels[4]}` : 'none',
                  outlineOffset: '1px'
                }}
                onMouseEnter={(event) => onHover(cell, event)}
                onMouseLeave={onLeave}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function HeatmapTooltip({ tooltip }: { tooltip: { x: number; y: number; completed: boolean; date: string } | null }) {
  if (!tooltip) {
    return null;
  }
  return (
    <div
      className="fixed z-50 pointer-events-none px-2 py-1 rounded bg-bg-card border border-border text-[10px] font-mono text-foreground shadow-lg"
      style={{ left: tooltip.x + 16, top: tooltip.y - 28 }}>
      <span className={tooltip.completed ? 'text-accent-secondary' : 'text-muted'}>
        {tooltip.completed ? '✓' : '○'}
      </span>{' '}
      {tooltip.date}
    </div>
  );
}

export function HeatmapGrid({
  completions,
  dailyTarget = 1,
  color = DEFAULT_HABIT_COLOR,
  weeks = 26
}: HeatmapGridProps) {
  const [tooltip, setTooltip] = useState<{
    date: string;
    completed: boolean;
    x: number;
    y: number;
  } | null>(null);
  const today = useMemo(() => new Date(), []);
  const cells = useMemo(
    () => buildHeatmapCells(completions, dailyTarget, weeks),
    [completions, dailyTarget, weeks]
  );
  const monthLabels = useMemo(() => buildMonthLabels(cells), [cells]);
  const { heatmapLevels: levels, glow } = HABIT_COLOR_THEMES[color];

  const handleHover = (cell: HeatmapCell, event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      date: cell.date,
      completed: cell.completed,
      x: rect.left,
      y: rect.top
    });
  };

  return (
    <div className="relative select-none">
      <MonthLabels labels={monthLabels} weeks={weeks} />
      <div className="flex w-full gap-0">
        <DayLabels />
        <HeatmapCells
          cells={cells}
          levels={levels}
          glow={glow}
          today={today}
          onHover={handleHover}
          onLeave={() => setTooltip(null)}
        />
      </div>
      <HeatmapTooltip tooltip={tooltip} />
    </div>
  );
}
