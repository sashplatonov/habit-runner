import type { ActivityDay, ActivityWeek, PeriodOption } from './StatsView';

const HEATMAP_LEVELS = [0.18, 0.38, 0.62, 0.88];
const HEATMAP_MONTH_FORMATTER = new Intl.DateTimeFormat('en-US', { month: 'short' });
const HEATMAP_DAY_FORMATTER = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const HEATMAP_DAY_NUMBER_FORMATTER = new Intl.DateTimeFormat('en-US', { day: 'numeric' });

const HEATMAP_ROW_LABELS: Record<PeriodOption, string[]> = {
  week: ['Week'],
  month: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  quarter: ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'],
  year: ['Mon', '', '', 'Thu', '', '', 'Sun']
};

const HEATMAP_SUMMARIES: Record<PeriodOption, string> = {
  week: '7 days across the current window',
  month: 'Daily grid grouped by week',
  quarter: 'Three months compressed into weekly columns',
  year: 'Full-year overview with monthly anchors'
};

type HeatmapAxisLabel = {
  label: string;
  sublabel?: string;
};

type HeatmapLayout = {
  cells: ActivityDay[][];
  rowLabels: string[];
  columnLabels: HeatmapAxisLabel[];
};

function heatOpacity(intensity: number, maxIntensity: number): number {
  if (intensity <= 0 || maxIntensity <= 0) {
    return 0.12;
  }
  const r = intensity / maxIntensity;
  if (r <= 0.25) {
    return HEATMAP_LEVELS[0];
  }
  if (r <= 0.5) {
    return HEATMAP_LEVELS[1];
  }
  if (r <= 0.75) {
    return HEATMAP_LEVELS[2];
  }
  return HEATMAP_LEVELS[3];
}

function parseHeatmapDate(date: string) {
  return new Date(`${date}T00:00:00`);
}

function buildWeekHeatmapLayout(days: ActivityDay[]): HeatmapLayout {
  const visibleDays = days.filter((day) => day.inWindow);
  return {
    cells: [visibleDays],
    rowLabels: HEATMAP_ROW_LABELS.week,
    columnLabels: visibleDays.map((day, index) => ({
      label: HEATMAP_ROW_LABELS.month[index] ?? '',
      sublabel: HEATMAP_DAY_NUMBER_FORMATTER.format(parseHeatmapDate(day.date))
    }))
  };
}

function buildWeekColumnLabels(weeks: ActivityWeek[]): HeatmapAxisLabel[] {
  const cols = weeks.length;
  if (cols <= 6) {
    return weeks.map((week) => {
      const first = week.days.find((day) => day.inWindow);
      return { label: first ? HEATMAP_DAY_FORMATTER.format(parseHeatmapDate(first.date)) : '' };
    });
  }
  const every = cols <= 14 ? 2 : 4;
  return weeks.map((week, index) => {
    if (index % every !== 0 && index !== cols - 1) {
      return { label: '' };
    }
    const first = week.days.find((day) => day.inWindow);
    return { label: first ? HEATMAP_DAY_FORMATTER.format(parseHeatmapDate(first.date)) : '' };
  });
}

function buildMonthColumnLabels(weeks: ActivityWeek[]): HeatmapAxisLabel[] {
  let lastMonth = -1;
  return weeks.map((week) => {
    const first = week.days.find((day) => day.inWindow);
    if (!first) {
      return { label: '' };
    }
    const date = parseHeatmapDate(first.date);
    const month = date.getMonth();
    const showMonth = month !== lastMonth;
    lastMonth = month;
    return {
      label: showMonth ? HEATMAP_MONTH_FORMATTER.format(date) : '',
      sublabel: showMonth ? HEATMAP_DAY_NUMBER_FORMATTER.format(date) : ''
    };
  });
}

function buildHeatmapLayout(weeks: ActivityWeek[], period: PeriodOption): HeatmapLayout {
  if (period === 'week') {
    return buildWeekHeatmapLayout(weeks[0]?.days ?? []);
  }
  return {
    cells: Array.from({ length: 7 }, (_, rowIndex) => weeks.map((week) => week.days[rowIndex]).filter(Boolean)),
    rowLabels: HEATMAP_ROW_LABELS[period],
    columnLabels: period === 'month' ? buildWeekColumnLabels(weeks) : buildMonthColumnLabels(weeks)
  };
}

function heatmapCellColor(day: ActivityDay, maxIntensity: number) {
  const baseColor = day.isFrozen ? 'rgb(96 165 250)' : 'var(--accent)';
  return {
    backgroundColor: day.inWindow ? baseColor : 'var(--bg-card)',
    opacity: day.inWindow ? heatOpacity(day.intensity ?? 0, maxIntensity) : 0.16
  };
}

export function ActivityHeatmap({ weeks, period }: { weeks: ActivityWeek[]; period: PeriodOption }) {
  const allDays = weeks.flatMap((week) => week.days);
  const inWindow = allDays.filter((day) => day.inWindow);
  const maxIntensity = inWindow.length > 0 ? Math.max(0, ...inWindow.map((day) => day.intensity ?? 0)) : 0;
  const layout = buildHeatmapLayout(weeks, period);
  const rows = layout.cells.length;
  const cols = layout.cells[0]?.length ?? 0;

  if (inWindow.length === 0) {
    return (
      <div className="bg-bg-secondary border border-border rounded-lg p-3">
        <h2 className="text-xs font-mono text-muted uppercase tracking-wider mb-2">Focus intensity</h2>
        <p className="text-[11px] font-mono text-muted">Complete habits to see activity here.</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xs font-mono text-muted uppercase tracking-wider">Focus intensity</h2>
          <p className="text-[10px] font-mono text-muted">{HEATMAP_SUMMARIES[period]}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-muted">
          <div className="flex items-center gap-2">
            <span>low</span>
            {HEATMAP_LEVELS.map((lvl, i) => (
              <span key={i} className="block aspect-square w-3 rounded-[3px] bg-accent" style={{ opacity: lvl }} />
            ))}
            <span>high</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="block aspect-square w-3 rounded-[3px] bg-blue-400 opacity-40" />
            <span>frozen</span>
          </div>
          <span>{maxIntensity > 0 ? `peak ${maxIntensity}` : 'no data'}</span>
        </div>
      </div>
      <div className="grid grid-cols-[auto,minmax(0,1fr)] gap-x-3 gap-y-2">
        <div />
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.max(cols, 1)}, minmax(0, 1fr))` }}>
          {layout.columnLabels.map((entry, index) => (
            <div key={`col-${index}`} className="min-w-0 text-center">
              <p className="truncate text-[8px] font-mono uppercase tracking-[0.16em] text-muted">{entry.label}</p>
              {entry.sublabel ? <p className="text-[9px] font-mono text-muted/80">{entry.sublabel}</p> : null}
            </div>
          ))}
        </div>
        <div className="grid gap-1" style={{ gridTemplateRows: `repeat(${Math.max(rows, 1)}, minmax(0, 1fr))` }}>
          {layout.rowLabels.map((label, index) => (
            <div key={`row-${index}`} className="flex items-center justify-end pr-1">
              <span className="text-[9px] font-mono uppercase tracking-[0.16em] text-muted">{label}</span>
            </div>
          ))}
        </div>
        <div
          className="grid w-full gap-1"
          style={{ gridTemplateColumns: `repeat(${Math.max(cols, 1)}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${Math.max(rows, 1)}, minmax(0, 1fr))` }}
        >
          {layout.cells.flatMap((row, rowIndex) =>
            row.map((day, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}-${day.date}`}
                title={`${HEATMAP_DAY_FORMATTER.format(parseHeatmapDate(day.date))}: ${day.intensity} completed${day.isFrozen ? ' • frozen' : ''}`}
                className="aspect-square w-full rounded-[4px] transition-opacity"
                style={heatmapCellColor(day, maxIntensity)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
