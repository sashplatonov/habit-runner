export function cellColor(value: number): string {
  switch (value) {
    case 0:
      return "bg-slate-800";
    case 1:
      return "bg-emerald-900";
    case 2:
      return "bg-emerald-700";
    case 3:
      return "bg-emerald-500";
    case 4:
      return "bg-emerald-400";
    default:
      return "bg-slate-800";
  }
}

export function cellColorWeek(value: number): string {
  // For week-level aggregated cells (year view)
  switch (value) {
    case 0:
      return "bg-slate-800";
    case 1:
      return "bg-emerald-900";
    case 2:
      return "bg-emerald-700";
    case 3:
      return "bg-emerald-500";
    case 4:
      return "bg-emerald-400";
    default:
      return "bg-slate-800";
  }
}

export function cellBorder(value: number, highlight = false): string {
  if (highlight) return "border border-emerald-400";
  if (value === 0) return "border border-slate-700";
  return "border border-transparent";
}

export function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatWeekLabel(startStr: string, endStr: string): string {
  const s = new Date(startStr);
  const e = new Date(endStr);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${s.toLocaleDateString("ru-RU", opts)} – ${e.toLocaleDateString("ru-RU", opts)}`;
}

export function getMonthName(monthIndex: number): string {
  const months = [
    "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
    "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
  ];
  return months[monthIndex] ?? "";
}

export function aggregateWeekValue(days: { value: number; completed: boolean }[]): number {
  if (days.length === 0) return 0;
  const completed = days.filter((d) => d.completed).length;
  const ratio = completed / days.length;
  if (ratio === 0) return 0;
  if (ratio < 0.3) return 1;
  if (ratio < 0.55) return 2;
  if (ratio < 0.8) return 3;
  return 4;
}
