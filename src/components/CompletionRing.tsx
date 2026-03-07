import React from 'react';
import { DEFAULT_HABIT_COLOR, HABIT_COLOR_THEMES } from '@/lib/theme/habit-colors';
import type { HabitColor } from '@/types/habit';
interface CompletionRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: HabitColor;
  showText?: boolean;
  className?: string;
}
export function CompletionRing({
  percentage,
  size = 40,
  strokeWidth = 3,
  color = DEFAULT_HABIT_COLOR,
  showText = false,
  className = ''
}: CompletionRingProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset =
  circumference - Math.min(percentage, 100) / 100 * circumference;
  const { hex, glow } = HABIT_COLOR_THEMES[color];
  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}>

      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth} />

        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={hex}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            filter: percentage > 0 ? `drop-shadow(0 0 4px ${glow})` : 'none',
            transition: 'stroke-dashoffset 0.5s ease'
          }} />

      </svg>
      {showText &&
      <span
        className="absolute text-[10px] font-mono font-bold"
        style={{
          color: hex
        }}>

          {Math.round(percentage)}
        </span>
      }
    </div>);

}
