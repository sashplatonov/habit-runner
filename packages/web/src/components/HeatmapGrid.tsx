import React, { useState } from 'react';
import { DEFAULT_HABIT_COLOR, HABIT_COLOR_THEMES } from '@/lib/theme/habit-colors';
import type { HabitColor } from '@/types/habit';
interface HeatmapGridProps {
  completions: Record<string, number>;
  dailyTarget?: number;
  color?: HabitColor;
  weeks?: number;
}
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
function getIntensity(completed: boolean | undefined): number {
  return completed ? 4 : 0;
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
  const { heatmapLevels: levels, glow } = HABIT_COLOR_THEMES[color];
  // Build grid: weeks columns, 7 rows (Sun-Sat)
  const today = new Date();
  const cells: {
    date: string;
    completed: boolean;
    isToday: boolean;
  }[][] = [];
  // Find the Sunday of the current week
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - startDate.getDay() - (weeks - 1) * 7);
  for (let w = 0; w < weeks; w++) {
    const week: {
      date: string;
      completed: boolean;
      isToday: boolean;
    }[] = [];
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
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const monthLabels: {
    label: string;
    col: number;
  }[] = [];
  let lastMonth = -1;
  cells.forEach((week, i) => {
    const month = new Date(week[0].date).getMonth();
    if (month !== lastMonth) {
      monthLabels.push({
        label: new Date(week[0].date).toLocaleString('default', {
          month: 'short'
        }),
        col: i
      });
      lastMonth = month;
    }
  });
  return (
    <div className="relative select-none">
      {/* Month labels */}
      <div className="flex mb-1 ml-6">
        {cells.map((_, i) => {
          const label = monthLabels.find((m) => m.col === i);
          return (
            <div
              key={i}
              className="w-[11px] mr-[2px] text-[9px] font-mono text-muted overflow-visible whitespace-nowrap">

              {label ? label.label : ''}
            </div>);

        })}
      </div>

      <div className="flex gap-0">
        {/* Day labels */}
        <div className="flex flex-col gap-[2px] mr-1.5">
          {dayLabels.map((d, i) =>
          <div
            key={i}
            className="h-[11px] text-[9px] font-mono text-muted flex items-center">

              {i % 2 === 1 ? d : ''}
            </div>
          )}
        </div>

        {/* Grid */}
        <div className="flex gap-[2px]">
          {cells.map((week, wi) =>
          <div key={wi} className="flex flex-col gap-[2px]">
              {week.map((cell, di) => {
              const intensity = getIntensity(cell.completed);
              const bg = levels[intensity];
              const isFuture = new Date(cell.date) > today;
              return (
                <div
                  key={di}
                  className="w-[11px] h-[11px] rounded-[2px] cursor-pointer transition-transform hover:scale-125"
                  style={{
                    backgroundColor: isFuture ? 'var(--bg-secondary)' : bg,
                    opacity: isFuture ? 0.3 : 1,
                    boxShadow:
                    cell.completed && !isFuture ?
                    `0 0 4px ${glow}` :
                    'none',
                    outline: cell.isToday ? `1px solid ${levels[4]}` : 'none',
                    outlineOffset: '1px'
                  }}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTooltip({
                      date: cell.date,
                      completed: cell.completed,
                      x: rect.left,
                      y: rect.top
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)} />);


            })}
            </div>
          )}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip &&
      <div
        className="fixed z-50 pointer-events-none px-2 py-1 rounded bg-bg-card border border-border text-[10px] font-mono text-foreground shadow-lg"
        style={{
          left: tooltip.x + 16,
          top: tooltip.y - 28
        }}>

          <span
          className={tooltip.completed ? 'text-accent-secondary' : 'text-muted'}>

            {tooltip.completed ? '✓' : '○'}
          </span>{' '}
          {tooltip.date}
        </div>
      }
    </div>);

}
