const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
];

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function buildCompletedDates(
  completions: Record<string, number>,
  dailyTarget: number
): string[] {
  return Object.keys(completions)
    .filter((key) => (completions[key] ?? 0) >= dailyTarget)
    .sort();
}

function countCurrentStreak(
  completedDates: Set<string>,
  referenceDate: Date
): number {
  let count = 0;
  const cursor = new Date(referenceDate);
  while (count < 365) {
    const key = formatDate(cursor);
    if (!completedDates.has(key)) {
      break;
    }
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

function countLongestStreak(completedDates: string[]): number {
  let longest = 0;
  let temp = 0;

  for (let i = 0; i < completedDates.length; i++) {
    if (i === 0) {
      temp = 1;
    } else {
      const prev = new Date(completedDates[i - 1]);
      const curr = new Date(completedDates[i]);
      if ((curr.getTime() - prev.getTime()) / MS_PER_DAY === 1) {
        temp++;
      } else {
        temp = 1;
      }
    }
    if (temp > longest) {
      longest = temp;
    }
  }

  return longest;
}

export function calculateStreak(
  completions: Record<string, number>,
  referenceDate = new Date(),
  dailyTarget = 1
): { current: number; longest: number } {
  const completedDates = buildCompletedDates(completions, dailyTarget);
  const completedSet = new Set(completedDates);
  const current = countCurrentStreak(completedSet, referenceDate);
  const longest = countLongestStreak(completedDates);
  return { current, longest };
}

export function countCompletedDays(completions: Record<string, number>, dailyTarget = 1): number {
  return Object.values(completions).filter((count) => (count ?? 0) >= dailyTarget).length;
}

export function buildWeeklyCompletionData(
  completions: Record<string, number>,
  weeks = 12,
  referenceDate = new Date(),
  dailyTarget = 1
): { week: string; count: number }[] {
  const today = new Date(referenceDate);
  const data = [];

  for (let w = weeks - 1; w >= 0; w--) {
    let count = 0;
    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() - w * 7 - d);
      const key = formatDate(date);
      if ((completions[key] ?? 0) >= dailyTarget) {count++;}
    }
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - w * 7);
    data.push({
      week: `W${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
      count
    });
  }

  return data;
}

export function buildMonthlyCompletionRates(
  completions: Record<string, number>,
  months = 6,
  referenceDate = new Date(),
  dailyTarget = 1
): { month: string; rate: number }[] {
  const today = new Date(referenceDate);
  const data = [];

  for (let m = months - 1; m >= 0; m--) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - m, 1);
    const daysInMonth = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth() + 1,
      0
    ).getDate();
    let completed = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth(),
        d
      );
      if (date > today) {break;}
      const key = formatDate(date);
      if ((completions[key] ?? 0) >= dailyTarget) {completed++;}
    }
    const daysElapsed =
      monthDate.getMonth() === today.getMonth() ? today.getDate() : daysInMonth;
    data.push({
      month: MONTH_NAMES[monthDate.getMonth()],
      rate: Math.round((completed / Math.max(1, daysElapsed)) * 100)
    });
  }

  return data;
}
