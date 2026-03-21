import { ChartGuideTooltip } from '@/components/ChartGuideTooltip';
import type { ActivityDay, ActivityWeek, PeriodOption } from './StatsView';

const HEATMAP_LEVELS = [0.18, 0.38, 0.62, 0.88];
const HEATMAP_MONTH_FORMATTER = new Intl.DateTimeFormat('en-US', { month: 'short' });
const HEATMAP_DAY_FORMATTER = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const HEATMAP_DAY_NUMBER_FORMATTER = new Intl.DateTimeFormat('en-US', { day: 'numeric' });
const HEATMAP_MONTH_YEAR_FORMATTER = new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit' });

const HEATMAP_ROW_LABELS: Record<PeriodOption, string[]> = {
  week: ['Week'],
  month: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  quarter: ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'],
  year: ['Mon', '', '', 'Thu', '', '', 'Sun']
};

const HEATMAP_SUMMARIES: Record<PeriodOption, string> = {
  week: '7 days across the current window',
  month: 'Daily grid grouped by week',
  quarter: 'Quarterly grid with four weekly columns per month',
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
  quarterMonthGroups?: { label: string; colSpan: number }[];
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

type MonthlyWeekGroup = {
  key: string;
  label: string;
  weeks: ActivityWeek[];
};

function groupWeeksByMonthForQuarter(weeks: ActivityWeek[]): MonthlyWeekGroup[] {
  const groups: MonthlyWeekGroup[] = [];
  weeks.forEach((week) => {
    const first = week.days[0];
    if (!first) {
      return;
    }
    const date = parseHeatmapDate(first.date);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (!groups.length || groups[groups.length - 1].key !== key) {
      groups.push({
        key,
        label: HEATMAP_MONTH_YEAR_FORMATTER.format(date),
        weeks: []
      });
    }
    groups[groups.length - 1].weeks.push(week);
  });
  return groups;
}

function buildQuarterHeatmapConfig(
  weeks: ActivityWeek[]
): { weeks: ActivityWeek[]; columnLabels: HeatmapAxisLabel[]; monthGroups: { label: string; colSpan: number }[] } {
  const groups = groupWeeksByMonthForQuarter(weeks);
  const recentGroups = groups.length > 3 ? groups.slice(-3) : groups;
  const layoutWeeks: ActivityWeek[] = [];
  const columnLabels: HeatmapAxisLabel[] = [];
  const monthGroups: { label: string; colSpan: number }[] = [];
  recentGroups.forEach((group) => {
    const trimmed = group.weeks.length <= 4 ? group.weeks : group.weeks.slice(-4);
    trimmed.forEach((week, index) => {
      layoutWeeks.push(week);
      columnLabels.push({
        label: `Week ${index + 1}`,
        sublabel: ''
      });
    });
    monthGroups.push({ label: group.label, colSpan: trimmed.length });
  });
  return { weeks: layoutWeeks, columnLabels, monthGroups };
}

function buildHeatmapLayout(weeks: ActivityWeek[], period: PeriodOption): HeatmapLayout {
  if (period === 'week') {
    return buildWeekHeatmapLayout(weeks[0]?.days ?? []);
  }
  let layoutWeeks = weeks;
  let columnLabels: HeatmapAxisLabel[];
  let quarterMonthGroups: { label: string; colSpan: number }[] | undefined;
  if (period === 'quarter') {
    const quarterConfig = buildQuarterHeatmapConfig(weeks);
    layoutWeeks = quarterConfig.weeks;
    columnLabels = quarterConfig.columnLabels;
    quarterMonthGroups = quarterConfig.monthGroups;
  } else if (period === 'month') {
    columnLabels = buildWeekColumnLabels(weeks);
  } else {
    columnLabels = buildMonthColumnLabels(weeks);
  }
  const cells = Array.from({ length: 7 }, (_, rowIndex) => layoutWeeks.map((week) => week.days[rowIndex]).filter(Boolean));
  return {
    cells,
    rowLabels: HEATMAP_ROW_LABELS[period],
    columnLabels,
    quarterMonthGroups
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
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-xs font-mono text-muted uppercase tracking-wider">Focus intensity</h2>
          <ChartGuideTooltip
            title="Focus intensity"
            summary="This heatmap spreads the selected period into a calendar grid, so you can see how concentrated or scattered your habit effort is."
            focusPoints={[
              'Brighter cells: more completions packed into that day.',
              'Frozen cells: protected days that should not count as misses.',
              'Use period switches to compare weekly rhythm versus long-window consistency.'
            ]}
            variant="grid"
            triggerClassName="h-7 w-7"
          />
        </div>
        <p className="text-[11px] font-mono text-muted">Complete habits to see activity here.</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-mono text-muted uppercase tracking-wider">Focus intensity</h2>
            <ChartGuideTooltip
              title="Focus intensity"
              summary="This heatmap spreads the selected period into a calendar grid, so you can see how concentrated or scattered your habit effort is."
              focusPoints={[
                'Brighter cells: more completions packed into that day.',
                'Frozen cells: protected days that should not count as misses.',
                'Use period switches to compare weekly rhythm versus long-window consistency.'
              ]}
              variant="grid"
              triggerClassName="h-7 w-7"
            />
          </div>
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
        {period === 'quarter' && layout.quarterMonthGroups?.length ? (
          <div
            className="grid gap-1 text-[9px] font-mono uppercase tracking-[0.2em] text-muted"
            style={{ gridTemplateColumns: `repeat(${Math.max(cols, 1)}, minmax(0, 1fr))` }}
          >
            {layout.quarterMonthGroups.map((group, index) => (
              <div
                key={`month-${index}`}
                className="flex items-center justify-center"
                style={{ gridColumn: `span ${group.colSpan}` }}
              >
                <span>{group.label}</span>
              </div>
            ))}
          </div>
        ) : null}
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
