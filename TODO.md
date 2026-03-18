Plan: Focus Intensity Heatmap Redesign for Different Periods

Context

The ActivityHeatmap in the Stats page currently renders a one-size-fits-all 14×14px CSS grid for all four time periods (week/month/quarter/year). The period selector shows single-letter W/M/Q/Y pill buttons with no context. The task is to redesign both to be period-adaptive and visually richer.

 ---
Critical Files

- packages/web/src/pages/components/StatsView.tsx — primary file: PeriodSelector (lines 483–504) and ActivityHeatmap (lines 783–912)
- packages/web/src/index.css — add fade-in keyframe for heatmap transitions

 ---
Implementation Plan

1. CSS Animation (index.css)

Add a heatmap-enter keyframe after the existing micro-animation block:

@keyframes heatmap-enter {
from { opacity: 0; transform: translateY(6px); }
to   { opacity: 1; transform: translateY(0); }
}
.animate-heatmap-enter {
animation: heatmap-enter 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
}

2. Module-level constants (StatsView.tsx)

After line 84 (existing HEATMAP_MONTH_FORMATTER), add:

const PERIOD_FULL_LABELS: Record<PeriodOption, string> = {
week: 'Week', month: 'Month', quarter: 'Quarter', year: 'Year'
};
const PERIOD_DAYS: Record<PeriodOption, number> = {
week: 7, month: 30, quarter: 90, year: 365
};
const SHORT_DATE_FMT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const WEEK_DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function periodDateRange(period: PeriodOption): string {
const end = new Date(); end.setHours(0,0,0,0);
const start = new Date(end);
start.setDate(end.getDate() - (PERIOD_DAYS[period] - 1));
return `${SHORT_DATE_FMT.format(start)} – ${SHORT_DATE_FMT.format(end)}`;
}
function formatDayDate(dateStr: string): string {
return SHORT_DATE_FMT.format(new Date(`${dateStr}T00:00:00`));
}
function getISOWeekNumber(dateStr?: string): number {
if (!dateStr) return 0;
const d = new Date(`${dateStr}T00:00:00`);
d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
const y = new Date(d.getFullYear(), 0, 4);
return 1 + Math.round(((d.getTime() - y.getTime()) / 86400000 - 3 + ((y.getDay() + 6) % 7)) / 7);
}
function partitionWeeksIntoMonths(weeks: ActivityWeek[]) {
const groups = new Map<string, { monthLabel: string; weeks: ActivityWeek[] }>();
for (const week of weeks) {
const anchor = week.days.find(d => d.inWindow);
if (!anchor) continue;
const d = new Date(`${anchor.date}T00:00:00`);
const key = `${d.getFullYear()}-${d.getMonth()}`;
if (!groups.has(key)) groups.set(key, { monthLabel: HEATMAP_MONTH_FORMATTER.format(d), weeks: [] });
groups.get(key)!.weeks.push(week);
}
return Array.from(groups.values());
}

3. New PeriodSelector (replace lines 483–504)

Animated sliding pill with full period labels and date-range subtitle:

function PeriodSelector({ period, setPeriod }: { period: PeriodOption; setPeriod: (v: PeriodOption) => void }) {
const containerRef = useRef<HTMLDivElement>(null);
const buttonRefs = useRef<Record<PeriodOption, HTMLButtonElement | null>>({ week: null, month: null, quarter: null, year: null });
const [pillStyle, setPillStyle] = useState<{ left: number; width: number }>({ left: 3, width: 0 });

useEffect(() => {
const btn = buttonRefs.current[period];
const container = containerRef.current;
if (!btn || !container) return;
const cr = container.getBoundingClientRect();
const br = btn.getBoundingClientRect();
setPillStyle({ left: br.left - cr.left, width: br.width });
}, [period]);

return (
<div className="flex flex-col items-end gap-1">
<div ref={containerRef} className="relative flex items-center gap-0 rounded-full border border-border bg-bg-card p-[3px]">
<div
className="absolute top-[3px] bottom-[3px] rounded-full bg-foreground transition-[left,width] duration-200 ease-out pointer-events-none"
style={{ left: pillStyle.left, width: pillStyle.width }}
/>
{PERIOD_OPTIONS.map((opt) => (
<button
key={opt.id}
ref={(el) => { buttonRefs.current[opt.id] = el; }}
onClick={() => setPeriod(opt.id)}
className={`relative z-10 px-3 h-8 rounded-full text-xs font-mono whitespace-nowrap transition-colors ${
               period === opt.id ? 'text-bg-primary' : 'text-muted hover:text-foreground'
             }`}
>
{PERIOD_FULL_LABELS[opt.id]}
</button>
))}
</div>
<span className="text-[10px] font-mono text-muted pr-1">{periodDateRange(period)}</span>
</div>
);
}

4. Four heatmap sub-components (add before ActivityHeatmap)

WeekHeatmap — 7 large vertical fill bars, one per day (h-28 container):
- Tall bars, filled bottom-up by intensity percentage
- Day label (Mon-Sun) + short date below each bar
- Accent glow on non-empty bars

MonthHeatmap — Calendar grid: 5 rows × 7 cols (20px cells):
- Day-of-week header row (M T W T F S S)
- ISO week numbers on left margin
- Same opacity logic as current heatmap

QuarterHeatmap — 3 side-by-side month blocks (13px cells):
- partitionWeeksIntoMonths() splits the weeks data
- Month name header above each block
- Compact day-of-week labels within each block

YearHeatmap — Dense contribution graph (11px cells, 2px gap):
- Same column-flow grid as current but smaller + refined
- Improved hover titles

5. Updated ActivityHeatmap dispatcher (replace lines 813–912)

function ActivityHeatmap({ weeks, period }: { weeks: ActivityWeek[]; period: PeriodOption }) {
// ... existing empty-state check ...

const summaryMap: Record<PeriodOption, string> = {
week: '7-day view — each bar = 1 day',
month: 'Calendar view — 5 weeks',
quarter: '3-month blocks',
year: 'GitHub-style — 52 weeks',
};

return (
<div className="bg-bg-secondary border border-border rounded-lg p-3 space-y-3">
{/* Header with period-aware summary + legend */}
<div className="flex flex-wrap items-center justify-between gap-2">
<div>
<h2 className="text-xs font-mono text-muted uppercase tracking-wider">Focus intensity</h2>
<p className="text-[10px] font-mono text-muted">{summaryMap[period]}</p>
</div>
{/* Legend: less [░▒▓█] max  [■] frozen */}
</div>

       {/* key={period} = remount on switch = clean fade-in enter animation */}
       <div key={period} className="animate-heatmap-enter">
         {period === 'week'    && <WeekHeatmap    weeks={safeWeeks} maxIntensity={maxIntensity} />}
         {period === 'month'   && <MonthHeatmap   weeks={safeWeeks} maxIntensity={maxIntensity} />}
         {period === 'quarter' && <QuarterHeatmap weeks={safeWeeks} maxIntensity={maxIntensity} />}
         {period === 'year'    && <YearHeatmap    weeks={safeWeeks} maxIntensity={maxIntensity} />}
       </div>
     </div>
);
}

 ---
Verification

1. npm run dev:web — open stats page, switch through all 4 periods
2. Verify period selector pill slides smoothly between tabs
3. Verify date range subtitle updates correctly
4. Verify each heatmap variant renders without JS errors
5. Verify the month=default view (Stats.tsx line 30) shows a proper calendar grid on page load
6. Check a light theme (sakura/lavender) to confirm pill text contrast