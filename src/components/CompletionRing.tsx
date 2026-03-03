import React from 'react';
interface CompletionRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'cyan';
  showText?: boolean;
  className?: string;
}
const colorMap = {
  blue: {
    stroke: '#00d4ff',
    glow: 'rgba(0,212,255,0.5)'
  },
  green: {
    stroke: '#00ff88',
    glow: 'rgba(0,255,136,0.5)'
  },
  purple: {
    stroke: '#a855f7',
    glow: 'rgba(168,85,247,0.5)'
  },
  orange: {
    stroke: '#f97316',
    glow: 'rgba(249,115,22,0.5)'
  },
  red: {
    stroke: '#ef4444',
    glow: 'rgba(239,68,68,0.5)'
  },
  cyan: {
    stroke: '#22d3ee',
    glow: 'rgba(34,211,238,0.5)'
  }
};
export function CompletionRing({
  percentage,
  size = 40,
  strokeWidth = 3,
  color = 'blue',
  showText = false,
  className = ''
}: CompletionRingProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset =
  circumference - Math.min(percentage, 100) / 100 * circumference;
  const { stroke, glow } = colorMap[color];
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
          stroke="#1e1e2e"
          strokeWidth={strokeWidth} />

        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke}
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
          color: stroke
        }}>

          {Math.round(percentage)}
        </span>
      }
    </div>);

}