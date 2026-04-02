// Generate realistic mock habit data for the past 2 years
export interface DayData {
  date: string; // YYYY-MM-DD
  value: number; // 0-4 intensity level
  completed: boolean;
}

function getDaysBetween(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

export function generateHabitData(): DayData[] {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setFullYear(start.getFullYear() - 2);

  const days = getDaysBetween(start, end);

  return days.map((date, i) => {
    const r = seededRandom(i * 7 + 13);
    const r2 = seededRandom(i * 3 + 77);

    // Simulate streaks and gaps
    const streak = Math.sin(i / 14) * 0.5 + 0.5;
    const base = streak * 0.65 + r * 0.25;
    const noise = r2 * 0.1;
    const final = Math.min(1, base + noise);

    const completed = final > 0.35;
    let value = 0;
    if (completed) {
      if (final > 0.85) value = 4;
      else if (final > 0.7) value = 3;
      else if (final > 0.55) value = 2;
      else value = 1;
    }

    return {
      date: formatDate(date),
      value,
      completed,
    };
  });
}

export type Period = "week" | "month" | "quarter" | "year";

export const PERIODS: { key: Period; label: string }[] = [
  { key: "week", label: "Неделя" },
  { key: "month", label: "Месяц" },
  { key: "quarter", label: "Квартал" },
  { key: "year", label: "Год" },
];
