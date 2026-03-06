import React, { useState } from 'react';
interface HeatmapGridProps {
  completions: Record<string, boolean>;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'cyan';
  weeks?: number;
}
const colorMap = {
  blue: {
    levels: ['#0d1117', '#0d2d3d', '#0a4a6e', '#006b9f', '#00d4ff'],
    glow: 'rgba(0,212,255,0.6)'
  },
  green: {
    levels: ['#0d1117', '#0d2d1a', '#0a4a28', '#007a3d', '#00ff88'],
    glow: 'rgba(0,255,136,0.6)'
  },
  purple: {
    levels: ['#0d1117', '#1a0d2e', '#2d0a4a', '#5b1a8f', '#a855f7'],
    glow: 'rgba(168,85,247,0.6)'
  },
  orange: {
    levels: ['#0d1117', '#2d1a0d', '#4a2a0a', '#8f4a1a', '#f97316'],
    glow: 'rgba(249,115,22,0.6)'
  },
  red: {
    levels: ['#0d1117', '#2d0d0d', '#4a0a0a', '#8f1a1a', '#ef4444'],
    glow: 'rgba(239,68,68,0.6)'
  },
  cyan: {
    levels: ['#0d1117', '#0d2a2d', '#0a3d4a', '#0a6b7a', '#22d3ee'],
    glow: 'rgba(34,211,238,0.6)'
  }
};
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
function getIntensity(completed: boolean | undefined): number {
  return completed ? 4 : 0;
}
export function HeatmapGrid({
  completions,
  color = 'blue',
  weeks = 26
}: HeatmapGridProps) {
  const [tooltip, setTooltip] = useState<{
    date: string;
    completed: boolean;
    x: number;
    y: number;
  } | null>(null);
  const { levels, glow } = colorMap[color];
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
        completed: !!completions[dateStr],
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
              className="w-[11px] mr-[2px] text-[9px] font-mono text-[#64748b] overflow-visible whitespace-nowrap">

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
            className="h-[11px] text-[9px] font-mono text-[#64748b] flex items-center">

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
                    backgroundColor: isFuture ? '#0d1117' : bg,
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
        className="fixed z-50 pointer-events-none px-2 py-1 rounded bg-[#12121f] border border-[#1e1e2e] text-[10px] font-mono text-white shadow-lg"
        style={{
          left: tooltip.x + 16,
          top: tooltip.y - 28
        }}>

          <span
          className={tooltip.completed ? 'text-[#00ff88]' : 'text-[#64748b]'}>

            {tooltip.completed ? '✓' : '○'}
          </span>{' '}
          {tooltip.date}
        </div>
      }
    </div>);

}