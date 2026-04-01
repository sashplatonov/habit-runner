import { useState, useMemo } from "react";
import { generateHabitData, PERIODS, Period } from "./data/habitData";
import HeatmapWeek from "./components/HeatmapWeek";
import HeatmapMonth from "./components/HeatmapMonth";
import HeatmapQuarter from "./components/HeatmapQuarter";
import HeatmapYear from "./components/HeatmapYear";

const HABIT_EXAMPLES = [
  { name: "Спорт", emoji: "🏃", color: "from-emerald-500 to-teal-600" },
  { name: "Чтение", emoji: "📚", color: "from-violet-500 to-purple-600" },
  { name: "Медитация", emoji: "🧘", color: "from-amber-500 to-orange-600" },
];

export default function App() {
  const [period, setPeriod] = useState<Period>("year");
  const [activeHabit, setActiveHabit] = useState(0);

  const data = useMemo(() => generateHabitData(), []);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8 flex flex-col items-center justify-start">
      <div className="w-full max-w-2xl flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col gap-1 pt-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-900/40">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white">Трекер привычек</h1>
          </div>
          <p className="text-sm text-slate-500 pl-10">Тепловая карта активности</p>
        </div>

        {/* Habit selector */}
        <div className="flex gap-2">
          {HABIT_EXAMPLES.map((h, i) => (
            <button
              key={h.name}
              onClick={() => setActiveHabit(i)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                activeHabit === i
                  ? `bg-gradient-to-r ${h.color} border-transparent text-white shadow-lg`
                  : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-600"
              }`}
            >
              <span>{h.emoji}</span>
              <span>{h.name}</span>
            </button>
          ))}
        </div>

        {/* Main card */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">

          {/* Period tabs */}
          <div className="flex border-b border-slate-800">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`flex-1 py-3.5 text-sm font-semibold transition-all duration-200 relative ${
                  period === p.key
                    ? "text-white"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {p.label}
                {period === p.key && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-400 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Heatmap content */}
          <div className="p-5 transition-all duration-300">
            {period === "week" && <HeatmapWeek data={data} />}
            {period === "month" && <HeatmapMonth data={data} />}
            {period === "quarter" && <HeatmapQuarter data={data} />}
            {period === "year" && <HeatmapYear data={data} />}
          </div>
        </div>

        {/* Bottom info */}
        <div className="flex items-center justify-center gap-6 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Сегодня</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm bg-slate-800 border border-slate-700" />
            <span>Пропущено</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm bg-emerald-400" />
            <span>Выполнено</span>
          </div>
        </div>
      </div>
    </div>
  );
}
