import React from 'react';
import type { HabitColor } from '@/types/habit';

interface MiniHeatmapProps {
  completions: Record<string, boolean>;
  color: HabitColor;
}

const colorMap = {
  blue: {
    filled: '#00d4ff',
    glow: 'rgba(0,212,255,0.6)'
  },
  green: {
    filled: '#00ff88',
    glow: 'rgba(0,255,136,0.6)'
  },
  purple: {
    filled: '#a855f7',
    glow: 'rgba(168,85,247,0.6)'
  },
  orange: {
    filled: '#f97316',
    glow: 'rgba(249,115,22,0.6)'
  },
  red: {
    filled: '#ef4444',
    glow: 'rgba(239,68,68,0.6)'
  },
  cyan: {
    filled: '#22d3ee',
    glow: 'rgba(34,211,238,0.6)'
  }
};

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
  const { filled, glow } = colorMap[color];

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
              backgroundColor: isCompleted ? filled : '#1e1e2e',
              boxShadow: isCompleted ? `0 0 4px ${glow}` : 'none',
              opacity: isCompleted ? 1 : 0.5
            }}
          />
        );
      })}
    </div>
  );
}
