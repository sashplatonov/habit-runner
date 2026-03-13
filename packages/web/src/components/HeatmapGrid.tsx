import React, { useMemo, useState } from 'react';
import { DEFAULT_HABIT_COLOR, HABIT_COLOR_THEMES } from '@/lib/theme/habit-colors';
import type { HabitColor } from '@/types/habit';

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

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getIntensity(completed: boolean | undefined): number {
  return completed ? 4 : 0;
}

const CELL_SIZE = 10;
const CELL_GAP = 2;
const COLUMN_WIDTH = CELL_SIZE + CELL_GAP;

function buildHeatmapCells(
  completions: Record<string, number>,
  dailyTarget: number,
  weeks: number
): HeatmapCell[][] {
  const today = new Date();
  const cells: HeatmapCell[][] = [];
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - startDate.getDay() - (weeks - 1) * 7);

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
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  return (
    <div className="flex flex-col gap-[2px] mr-1.5">
      {dayLabels.map((day, index) => (
        <div
          key={index}
          className="text-[9px] font-mono text-muted flex items-center"
          style={{ height: CELL_SIZE }}
        >
          {index % 2 === 1 ? day : ''}
        </div>
      ))}
    </div>
  );
}

function MonthLabels({ labels }: { labels: { label: string; col: number }[] }) {
  return (
    <div className="relative mb-1 ml-[18px] h-4">
      {labels.map((label) => (
        <div
          key={`${label.label}-${label.col}`}
          className="absolute text-[9px] font-mono text-muted whitespace-nowrap -translate-y-1"
          style={{ left: label.col * COLUMN_WIDTH }}
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
    <div className="flex gap-[2px]">
      {cells.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-[2px]">
          {week.map((cell, di) => {
            const intensity = getIntensity(cell.completed);
            const bg = levels[intensity];
            const isFuture = new Date(cell.date) > today;
            return (
              <div
                key={di}
                className="rounded-[2px] cursor-pointer transition-transform hover:scale-110"
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
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
      <MonthLabels labels={monthLabels} />
      <div className="flex gap-0">
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
