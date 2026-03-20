import { DayData } from "../data/habitData";
import { cellColor, cellBorder, formatDateLabel } from "../utils/heatmapUtils";

interface Props {
  data: DayData[];
}

const DOW_LABELS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

export default function HeatmapWeek({ data }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  // Rolling last 7 days: today-6 → today
  const week: DayData[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const found = data.find((x) => x.date === dateStr);
    week.push(found ?? { date: dateStr, value: 0, completed: false });
  }

  const completedCount = week.filter((d) => d.completed).length;
  const rate = Math.round((completedCount / 7) * 100);

  const startLabel = new Date(week[0].date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  const endLabel = new Date(week[6].date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="text-sm text-slate-400 font-medium">
            {startLabel} — {endLabel}
          </span>
          <span className="text-2xl font-bold text-white">
            {completedCount}/7{" "}
            <span className="text-base font-normal text-slate-400">дней</span>
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="text-right">
            <div className="text-3xl font-bold text-emerald-400">{rate}%</div>
            <div className="text-xs text-slate-500">выполнение</div>
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex gap-3 items-end justify-center">
        {week.map((day) => {
          const date = new Date(day.date);
          const isToday = day.date === todayStr;
          const dowLabel = DOW_LABELS[date.getDay()];
          return (
            <div key={day.date} className="flex flex-col items-center gap-2 flex-1">
              <span className="text-xs text-slate-500 font-medium">{dowLabel}</span>
              <div
                className={`relative w-full rounded-xl transition-all duration-200 group cursor-pointer ${cellBorder(day.value, isToday)}`}
                style={{ height: `${40 + day.value * 18}px` }}
              >
                <div
                  className={`absolute inset-0 rounded-xl ${cellColor(day.value)} transition-all duration-300 group-hover:brightness-125`}
                />
                {isToday && (
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
                )}
                {/* Tooltip */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-700 text-white text-xs rounded-lg px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-lg">
                  {formatDateLabel(day.date)}
                  <br />
                  <span className="text-emerald-400 font-semibold">
                    {day.value === 0 ? "Пропущено" : `Уровень ${day.value}`}
                  </span>
                </div>
              </div>
              <span className="text-xs text-slate-600">{date.getDate()}</span>
            </div>
          );
        })}
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
