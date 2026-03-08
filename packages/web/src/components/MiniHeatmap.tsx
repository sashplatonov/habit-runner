import React from 'react';
import { HABIT_COLOR_THEMES } from '@/lib/theme/habit-colors';
import type { HabitColor } from '@/types/habit';

interface MiniHeatmapProps {
  completions: Record<string, boolean>;
  color: HabitColor;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function MiniHeatmap({ completions, color }: MiniHeatmapProps) {
  const today = new Date();
  const days = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d);
  }

  const startDay = days[0].getDay();
  const emptyCells = Array.from({ length: startDay });
  const { hex, glow } = HABIT_COLOR_THEMES[color];

  return (
    <div className="grid grid-rows-7 grid-flow-col gap-[2px]">
      {emptyCells.map((_, i) => (
        <div
          key={`empty-${i}`}
          className="w-[4px] h-[4px] rounded-[1px] bg-transparent"
        />
      ))}
      {days.map((date) => {
        const dateStr = formatDate(date);
        const isCompleted = !!completions[dateStr];
        return (
          <div
            key={dateStr}
            className="w-[4px] h-[4px] rounded-[1px] transition-all duration-300"
            style={{
              backgroundColor: isCompleted ? hex : 'var(--border)',
              boxShadow: isCompleted ? `0 0 4px ${glow}` : 'none',
              opacity: isCompleted ? 1 : 0.5
            }}
          />
        );
      })}
    </div>
  );
}
