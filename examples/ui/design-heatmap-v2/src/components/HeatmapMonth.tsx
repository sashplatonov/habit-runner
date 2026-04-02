import { DayData } from "../data/habitData";
import { cellColor, cellBorder, formatDateLabel, getMonthName } from "../utils/heatmapUtils";

interface Props {
  data: DayData[];
}

const DAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function addDays(base: Date, n: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function toStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

export default function HeatmapMonth({ data }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toStr(today);

  // Rolling 30-day window: from (today - 29) to today
  const windowStart = addDays(today, -29);

  // We need to build a full-week grid starting from the Monday
  // on or before windowStart
  let dow = windowStart.getDay(); // 0=Sun
  dow = dow === 0 ? 6 : dow - 1; // Mon=0 … Sun=6
  const gridStart = addDays(windowStart, -dow); // Monday of first week

  // Build all cells from gridStart to today (padded to full weeks)
  const cells: { date: string; inWindow: boolean }[] = [];
  let cur = new Date(gridStart);
  while (toStr(cur) <= todayStr) {
    const dateStr = toStr(cur);
    cells.push({ date: dateStr, inWindow: dateStr >= toStr(windowStart) });
    cur = addDays(cur, 1);
  }
  // Pad trailing to full week
  while (cells.length % 7 !== 0) {
    cells.push({ date: "", inWindow: false });
  }

  // Build month labels per row (week row)
  // We'll figure out which months appear in the 30-day window
  const prevMonthDate = windowStart;
  const currMonthDate = today;
  const prevMo = prevMonthDate.getMonth();
  const currMo = currMonthDate.getMonth();
  const prevYr = prevMonthDate.getFullYear();
  const currYr = currMonthDate.getFullYear();

  const spansTwoMonths = prevMo !== currMo || prevYr !== currYr;

  // Build label: if spans two months show both, else one
  let headerLabel = "";
  if (spansTwoMonths) {
    const prevName = getMonthName(prevMo);
    const currName = getMonthName(currMo);
    if (prevYr !== currYr) {
      headerLabel = `${prevName} ${prevYr} — ${currName} ${currYr}`;
    } else {
      headerLabel = `${prevName} — ${currName} ${currYr}`;
    }
  } else {
    headerLabel = `${getMonthName(currMo)} ${currYr}`;
  }

  // Stats for the 30-day window
  const windowDays = data.filter(
    (x) => x.date >= toStr(windowStart) && x.date <= todayStr
  );
  const completed = windowDays.filter((x) => x.completed).length;
  const rate = Math.round((completed / 30) * 100);

  return (
    <div className="flex flex-col gap-5">
      {/* Stats */}
      <div className="flex items-center gap-4">
        <div>
          <span className="text-sm text-slate-400 font-medium">{headerLabel}</span>
          <div className="text-2xl font-bold text-white mt-0.5">
            {completed}{" "}
            <span className="text-base font-normal text-slate-400">из 30 дней</span>
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-3xl font-bold text-emerald-400">{rate}%</div>
          <div className="text-xs text-slate-500">выполнение</div>
        </div>
      </div>

      {/* Calendar grid — same width as one Quarter column */}
      <div className="flex justify-center">
        <div className="w-[33%] flex flex-col gap-1.5">
          {/* Month label */}
          <div className="text-xs font-semibold text-slate-400 text-center mb-1 truncate">
            {headerLabel}
          </div>
          {/* Day-of-week labels */}
          <div className="grid grid-cols-7 gap-0.5 mb-0.5">
            {DAY_LABELS.map((l) => (
              <div key={l} className="text-center text-[9px] text-slate-600 font-medium">
                {l[0]}
              </div>
            ))}
          </div>
          {/* Day cells */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((cell, i) => {
              // Empty padding cell (trailing)
              if (!cell.date) {
                return <div key={`pad-${i}`} className="aspect-square rounded" />;
              }

              // Cell outside the 30-day window (leading days to fill the first week)
              if (!cell.inWindow) {
                return (
                  <div
                    key={cell.date}
                    className="aspect-square rounded bg-slate-800/20 border border-slate-800/20"
                  />
                );
              }

              const isToday = cell.date === todayStr;
              const found = data.find((x) => x.date === cell.date);
              const day: DayData = found ?? { date: cell.date, value: 0, completed: false };
              const dateObj = new Date(cell.date + "T00:00:00");

              return (
                <div
                  key={cell.date}
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
                    {dateObj.getDate()}
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
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 text-xs text-slate-500 pt-2 border-t border-slate-800">
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
