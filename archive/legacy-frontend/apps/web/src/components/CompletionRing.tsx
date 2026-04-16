import React from 'react';
import { DEFAULT_HABIT_COLOR, HABIT_COLOR_THEMES } from '@/lib/theme/habit-colors';
import type { HabitColor } from '@habbit-runner/shared';
interface CompletionRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: HabitColor;
  showText?: boolean;
  className?: string;
}

function getProgressGlow(percentage: number, isFull: boolean, glow: string): string {
  if (percentage <= 0) {
    return 'none';
  }
  return `drop-shadow(0 0 ${isFull ? 8 : 4}px ${isFull ? 'var(--glow-secondary)' : glow})`;
}

export function CompletionRing({
  percentage,
  size = 40,
  strokeWidth = 3,
  color = DEFAULT_HABIT_COLOR,
  showText = false,
  className = ''
}: CompletionRingProps) {
  const clampedPercentage = Math.min(percentage, 100);
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - clampedPercentage / 100 * circumference;
  const { hex, glow } = HABIT_COLOR_THEMES[color];
  const isFull = percentage >= 100;
  const ringStroke = isFull ? 'var(--accent-secondary)' : hex;
  const ringFilter = getProgressGlow(percentage, isFull, glow);
  const textColor = isFull ? 'var(--accent-secondary)' : hex;
  const wrapperClassName = `relative inline-flex items-center justify-center ${isFull ? 'animate-ring-celebrate' : ''} ${className}`;

  return (
    <div className={wrapperClassName}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth} />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ringStroke}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            filter: ringFilter,
            transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s ease'
          }} />
      </svg>
      {showText ? (
        <span className="absolute text-[10px] font-mono font-bold" style={{ color: textColor }}>
          {Math.round(percentage)}
        </span>
      ) : null}
    </div>
  );
}
