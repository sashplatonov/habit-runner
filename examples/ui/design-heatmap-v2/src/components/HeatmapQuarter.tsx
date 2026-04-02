import { DayData } from "../data/habitData";
import { cellColor, cellBorder, formatDateLabel, getMonthName } from "../utils/heatmapUtils";

interface Props {
  data: DayData[];
}

const DAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

interface MonthBlock {
  monthIndex: number;
  year: number;
  weeks: (DayData | null)[][];
  completed: number;
  daysElapsed: number;
}

export default function HeatmapQuarter({ data }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  // Rolling 90-day window
  const windowStart = new Date(today);
  windowStart.setDate(windowStart.getDate() - 89);

  // Build all 90 days
  const allDays: DayData[] = [];
  for (let i = 0; i < 90; i++) {
    const d = new Date(windowStart);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const found = data.find((x) => x.date === dateStr);
    allDays.push(found ?? { date: dateStr, value: 0, completed: false });
  }

  // Group days by calendar month
  const monthMap = new Map<string, DayData[]>();
  for (const day of allDays) {
    const d = new Date(day.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!monthMap.has(key)) monthMap.set(key, []);
    monthMap.get(key)!.push(day);
  }

  // Build month blocks preserving order
  const monthKeys = Array.from(monthMap.keys());
  const monthBlocks: MonthBlock[] = monthKeys.map((key) => {
    const [yr, mo] = key.split("-").map(Number);
    const monthDays = monthMap.get(key)!;

    // Build a full calendar grid for this month (only days within our window)
    const firstOfMonth = new Date(yr, mo, 1);
    const lastOfMonth = new Date(yr, mo + 1, 0);

    let startDow = firstOfMonth.getDay();
    startDow = startDow === 0 ? 6 : startDow - 1;

    const cells: (DayData | null)[] = Array(startDow).fill(null);
    for (let d = 1; d <= lastOfMonth.getDate(); d++) {
      const dateStr = `${yr}-${String(mo + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      // Only include if within our rolling window
      const inWindow = dateStr >= windowStart.toISOString().split("T")[0] && dateStr <= todayStr;
      if (inWindow) {
        const found = data.find((x) => x.date === dateStr);
        cells.push(found ?? { date: dateStr, value: 0, completed: false });
      } else {
        // Days outside window are empty placeholders
        cells.push(null);
      }
    }
    while (cells.length % 7 !== 0) cells.push(null);

    const weeks: (DayData | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }

    const completed = monthDays.filter((d) => d.completed).length;

    return {
      monthIndex: mo,
      year: yr,
      weeks,
      completed,
      daysElapsed: monthDays.length,
    };
  });

  const totalCompleted = monthBlocks.reduce((s, m) => s + m.completed, 0);
  const totalDays = 90;
  const rate = Math.round((totalCompleted / totalDays) * 100);

  const startLabel = windowStart.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  const endLabel = today.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });

  return (
    <div className="flex flex-col gap-5">
      {/* Stats */}
      <div className="flex items-center gap-4">
        <div>
          <span className="text-sm text-slate-400 font-medium">
            {startLabel} — {endLabel}
          </span>
          <div className="text-2xl font-bold text-white mt-0.5">
            {totalCompleted}{" "}
            <span className="text-base font-normal text-slate-400">из {totalDays} дней</span>
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-3xl font-bold text-emerald-400">{rate}%</div>
          <div className="text-xs text-slate-500">выполнение</div>
        </div>
      </div>

      {/* 3 months side by side */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${monthBlocks.length}, 1fr)` }}>
        {monthBlocks.map(({ monthIndex, year: yr, weeks }) => (
          <div key={`${yr}-${monthIndex}`} className="flex flex-col gap-1.5">
            <div className="text-xs font-semibold text-slate-400 text-center mb-1">
              {getMonthName(monthIndex)}
            </div>
            {/* Day labels */}
            <div className="grid grid-cols-7 gap-0.5 mb-0.5">
              {DAY_LABELS.map((l) => (
                <div key={l} className="text-center text-[9px] text-slate-600 font-medium">
                  {l[0]}
                </div>
              ))}
            </div>
            {/* Days */}
            <div className="grid grid-cols-7 gap-0.5">
              {weeks.flat().map((day, i) => {
                if (!day) {
                  return <div key={`e-${monthIndex}-${i}`} className="aspect-square rounded" />;
                }
                const isToday = day.date === todayStr;
                const date = new Date(day.date);
                return (
                  <div
                    key={day.date}
                    className={`relative aspect-square rounded flex items-center justify-center group cursor-pointer transition-all duration-200 ${cellColor(day.value)} ${cellBorder(day.value, isToday)} hover:brightness-125`}
                  >
                    <span
                      className={`text-[8px] font-medium select-none leading-none ${
                        day.value >= 3
                          ? "text-white"
                          : day.value >= 1
                          ? "text-emerald-300"
                          : isToday
                          ? "text-emerald-400"
                          : "text-slate-600"
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {isToday && (
                      <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-1 ring-slate-900" />
                    )}
                    {/* Tooltip */}
                    <div className="absolute -top-11 left-1/2 -translate-x-1/2 bg-slate-700 text-white text-xs rounded-lg px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-lg">
                      {formatDateLabel(day.date)}
                      <br />
                      <span className="text-emerald-400 font-semibold">
                        {day.value === 0 ? "Пропущено" : `Уровень ${day.value}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800">
        <span>Меньше</span>
        <div className="flex gap-1.5 items-center">
          {[0, 1, 2, 3, 4].map((v) => (
            <div key={v} className={`w-4 h-4 rounded-md ${cellColor(v)}`} />
          ))}
        </div>
        <span>Больше</span>
      </div>
    </div>
  );
}
