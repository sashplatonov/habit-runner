import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { HABIT_COLOR_THEMES, DEFAULT_HABIT_COLOR } from '@/lib/theme/habit-colors';
import type { HabitColor } from '@/types/habit';
import { formatDate } from '@/lib/habits/habitStats';

// Opacity levels for intensity 0–4. Level 0 uses a neutral CSS var instead.
const FILL_OPACITIES = [0, 0.22, 0.46, 0.72, 1.0] as const;

const DAYS = 90;

interface HabitHeatmapProps {
  completions: Record<string, number>;
  dailyTarget?: number;
  color?: HabitColor;
  compact?: boolean;
}

type Cell = {
  date: string;
  intensity: number; // 0–4
  isToday: boolean;
  isOutOfRange: boolean;
};

function getIntensity(count: number, target: number): number {
  if (count <= 0) { return 0; }
  const ratio = count / Math.max(1, target);
  if (ratio >= 1) { return 4; }
  if (ratio >= 0.75) { return 3; }
  if (ratio >= 0.5) { return 2; }
  return 1;
}

function buildWeeks(completions: Record<string, number>, dailyTarget: number): Cell[][] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = formatDate(today);

  const rangeStart = new Date(today);
  rangeStart.setDate(today.getDate() - (DAYS - 1));
  const rangeStartStr = formatDate(rangeStart);

  const dayOfWeek = (rangeStart.getDay() + 6) % 7;
  const gridStart = new Date(rangeStart);
  gridStart.setDate(rangeStart.getDate() - dayOfWeek);

  const weeks: Cell[][] = [];
  const cursor = new Date(gridStart);

  while (formatDate(cursor) <= todayStr) {
    const week: Cell[] = [];
    for (let d = 0; d < 7; d += 1) {
      const dateStr = formatDate(cursor);
      week.push({
        date: dateStr,
        intensity: getIntensity(completions[dateStr] ?? 0, dailyTarget),
        isToday: dateStr === todayStr,
        isOutOfRange: dateStr > todayStr || dateStr < rangeStartStr,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  return weeks;
}

function buildMonthMarkers(weeks: Cell[][]): { label: string; index: number }[] {
  const markers: { label: string; index: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, idx) => {
    const m = new Date(week[0].date).getMonth();
    if (m !== lastMonth) {
      markers.push({ label: new Date(week[0].date).toLocaleString('default', { month: 'short' }), index: idx });
      lastMonth = m;
    }
  });
  return markers;
}

function cellStyle(cell: Cell, accentHex: string, glow: string): CSSProperties {
  if (cell.isOutOfRange) {
    return { backgroundColor: 'transparent', opacity: 0 };
  }
  if (cell.intensity === 0) {
    return { backgroundColor: 'var(--border)', opacity: 0.5 };
  }
  return {
    backgroundColor: accentHex,
    opacity: FILL_OPACITIES[cell.intensity],
    boxShadow: `0 0 4px ${glow}`,
  };
}

const TOOLTIP_WIDTH = 80;

function tooltipLeft(rectLeft: number): number {
  const max = window.innerWidth - TOOLTIP_WIDTH - 8;
  return Math.min(rectLeft + 8, max);
}

export function HabitHeatmap({
  completions,
  dailyTarget = 1,
  color = DEFAULT_HABIT_COLOR,
  compact = false,
}: HabitHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const weeks = useMemo(() => buildWeeks(completions, dailyTarget), [completions, dailyTarget]);
  const { hex: accentHex, glow } = HABIT_COLOR_THEMES[color];
  const n = weeks.length;

  if (compact) {
    return (
      <div
        className="grid gap-[2px]"
        style={{
          gridTemplateColumns: `repeat(${n}, 4px)`,
          gridTemplateRows: 'repeat(7, 4px)',
          gridAutoFlow: 'column',
        }}
      >
        {weeks.flat().map((cell, i) => (
          <div
            key={i}
            className="w-[4px] h-[4px] rounded-[1px]"
            style={{
              ...cellStyle(cell, accentHex, glow),
              outline: cell.isToday && !cell.isOutOfRange ? `1px solid ${accentHex}` : 'none',
              outlineOffset: '1px',
            }}
          />
        ))}
      </div>
    );
  }

  const markers = buildMonthMarkers(weeks);

  return (
    <div className="relative select-none sm:max-w-[320px] sm:mx-auto">
      <div className="flex w-full gap-0">
        {/* Day labels */}
        <div
          className="grid shrink-0 gap-1 sm:gap-1.5 mr-1.5"
          style={{ width: 16, gridTemplateRows: 'repeat(7, minmax(0, 1fr))' }}
        >
          {['M', '', 'W', '', 'F', '', ''].map((label, i) => (
            <div key={i} className="text-[9px] font-mono text-muted flex items-center">
              {label}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div
          className="grid flex-1 gap-1 sm:gap-1.5"
          style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
        >
          {weeks.map((week, wi) => (
            <div key={wi} className="grid gap-1 sm:gap-1.5" style={{ gridTemplateRows: 'repeat(7, minmax(0, 1fr))' }}>
              {week.map((cell, di) => (
                <div
                  key={di}
                  className="aspect-square w-full rounded-[2px] transition-transform hover:scale-110"
                  style={{
                    ...cellStyle(cell, accentHex, glow),
                    cursor: cell.isOutOfRange ? 'default' : 'pointer',
                    outline: cell.isToday && !cell.isOutOfRange ? `1px solid ${accentHex}` : 'none',
                    outlineOffset: '1px',
                  }}
                  onMouseEnter={(e) => {
                    if (cell.isOutOfRange) { return; }
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTooltip({ x: tooltipLeft(rect.left), y: rect.top - 28, text: cell.date.slice(0, 10) });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Month markers — overflow-hidden prevents last label from bleeding out */}
      {markers.length > 0 && (
        <div className="relative mt-1 h-4 ml-[18px] overflow-hidden">
          {markers.map((m) => (
            <span
              key={`${m.label}-${m.index}`}
              className="absolute text-[9px] font-mono text-muted"
              style={{ left: `${(m.index / n) * 100}%` }}
            >
              {m.label}
            </span>
          ))}
        </div>
      )}

      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none px-2 py-1 rounded bg-bg-card border border-border text-[10px] font-mono text-foreground shadow-lg"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
