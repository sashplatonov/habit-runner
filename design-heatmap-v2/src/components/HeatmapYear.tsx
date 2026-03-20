import { DayData } from "../data/habitData";
import { cellColor, cellBorder, aggregateWeekValue, formatWeekLabel, getMonthName } from "../utils/heatmapUtils";

interface Props {
  data: DayData[];
}

interface WeekCell {
  weekStart: string;
  weekEnd: string;
  value: number;
  completed: number;
  total: number;
  monthLabel?: string;
}

export default function HeatmapYear({ data }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  // Rolling window: today-364 → today (365 days)
  const windowStart = new Date(today);
  windowStart.setDate(windowStart.getDate() - 364);
  const windowStartStr = windowStart.toISOString().split("T")[0];

  // Align cursor to Monday of the week containing windowStart
  let cursor = new Date(windowStart);
  const dow = cursor.getDay();
  const offsetToMon = dow === 0 ? -6 : 1 - dow;
  cursor.setDate(cursor.getDate() + offsetToMon);

  const weeks: WeekCell[] = [];
  let lastMonth = -1;

  while (cursor <= today) {
    const weekStart = new Date(cursor);
    const weekEnd = new Date(cursor);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const startStr = weekStart.toISOString().split("T")[0];
    const endStr = weekEnd.toISOString().split("T")[0];

    // Collect days in this week that fall within our rolling window
    const weekDays: DayData[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      // Only count days within our 365-day window and not in the future
      if (dateStr < windowStartStr || dateStr > todayStr) continue;
      const found = data.find((x) => x.date === dateStr);
      weekDays.push(found ?? { date: dateStr, value: 0, completed: false });
    }

    // Determine month label (show when month changes)
    // Use the first day of the week that's inside the window
    const repDay = weekDays[0];
    if (repDay) {
      const repMonth = new Date(repDay.date).getMonth();
      if (repMonth !== lastMonth) {
        const value = aggregateWeekValue(weekDays);
        weeks.push({
          weekStart: startStr,
          weekEnd: endStr,
          value,
          completed: weekDays.filter((d) => d.completed).length,
          total: weekDays.length,
          monthLabel: getMonthName(repMonth),
        });
        lastMonth = repMonth;
      } else {
        const value = aggregateWeekValue(weekDays);
        weeks.push({
          weekStart: startStr,
          weekEnd: endStr,
          value,
          completed: weekDays.filter((d) => d.completed).length,
          total: weekDays.length,
        });
      }
    } else if (weeks.length > 0) {
      // partial week at start with no days in window — skip
    }

    cursor.setDate(cursor.getDate() + 7);
  }

  // Stats
  const windowDays = data.filter((d) => d.date >= windowStartStr && d.date <= todayStr);
  const completedDays = windowDays.filter((d) => d.completed).length;
  const totalElapsed = 365;
  const rate = Math.round((completedDays / totalElapsed) * 100);

  // Best streak in window
  let bestStreak = 0;
  let curStreak = 0;
  for (const d of windowDays) {
    if (d.completed) {
      curStreak++;
      bestStreak = Math.max(bestStreak, curStreak);
    } else {
      curStreak = 0;
    }
  }

  const startLabel = windowStart.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
  const endLabel = today.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="flex flex-col gap-5">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
          <div className="text-xs text-slate-500 mb-1">Выполнено</div>
          <div className="text-xl font-bold text-white">{completedDays}</div>
          <div className="text-xs text-slate-500">дней</div>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
          <div className="text-xs text-slate-500 mb-1">Выполнение</div>
          <div className="text-xl font-bold text-emerald-400">{rate}%</div>
          <div className="text-xs text-slate-500">за год</div>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
          <div className="text-xs text-slate-500 mb-1">Лучшая серия</div>
          <div className="text-xl font-bold text-amber-400">{bestStreak}</div>
          <div className="text-xs text-slate-500">дней</div>
        </div>
      </div>

      {/* Date range */}
      <div className="text-sm text-slate-500 font-medium">
        {startLabel} — {endLabel}
      </div>

      {/* Heatmap — week cells, no scroll */}
      <div className="w-full overflow-hidden">
        {/* Month labels */}
        <div className="flex gap-1 mb-1">
          {weeks.map((w, i) => (
            <div
              key={`ml-${i}`}
              className="flex-1 text-center text-[9px] font-semibold text-slate-500 truncate min-w-0"
            >
              {w.monthLabel ?? ""}
            </div>
          ))}
        </div>

        {/* Week squares */}
        <div className="flex gap-1">
          {weeks.map((w, i) => {
            const isCurrent = w.weekStart <= todayStr && todayStr <= w.weekEnd;
            return (
              <div
                key={`w-${i}`}
                className="flex-1 group relative cursor-pointer"
                style={{ minWidth: 0 }}
              >
                <div
                  className={`w-full rounded-md transition-all duration-200 group-hover:brightness-125 ${cellColor(w.value)} ${cellBorder(w.value, isCurrent)}`}
                  style={{ aspectRatio: "1 / 1" }}
                />
                {isCurrent && (
                  <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-1 ring-slate-900 z-10" />
                )}
                {/* Tooltip */}
                <div
                  className={`absolute ${i > weeks.length / 2 ? "right-0" : "left-0"} -top-14 bg-slate-700 text-white text-xs rounded-lg px-2.5 py-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-xl`}
                >
                  <div className="text-slate-300">{formatWeekLabel(w.weekStart, w.weekEnd)}</div>
                  <div className="text-emerald-400 font-semibold mt-0.5">
                    {w.completed}/{w.total} дней выполнено
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800">
        <span>Каждый квадрат = 1 неделя</span>
        <div className="flex gap-1.5 items-center">
          <span>Меньше</span>
          {[0, 1, 2, 3, 4].map((v) => (
            <div key={v} className={`w-4 h-4 rounded-md ${cellColor(v)}`} />
          ))}
          <span>Больше</span>
        </div>
      </div>
    </div>
  );
}
