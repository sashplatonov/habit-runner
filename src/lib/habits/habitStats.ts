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

export function calculateStreak(
  completions: Record<string, boolean>,
  referenceDate = new Date()
): { current: number; longest: number } {
  const today = new Date(referenceDate);
  let current = 0;
  let longest = 0;
  let temp = 0;

  for (let i = 0; i < 365; i++) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const key = formatDate(day);
    if (completions[key]) {
      if (i === 0 || current > 0) {current++;}
    } else {
      if (i === 0) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (!completions[formatDate(yesterday)]) {break;}
      } else {
        break;
      }
    }
  }

  const sortedDates = Object.keys(completions)
    .filter((k) => completions[k])
    .sort();

  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      temp = 1;
    } else {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diff = (curr.getTime() - prev.getTime()) / MS_PER_DAY;
      if (diff === 1) {
        temp++;
      } else {
        temp = 1;
      }
    }
    if (temp > longest) {longest = temp;}
  }

  return { current, longest };
}

export function countCompletedDays(completions: Record<string, boolean>): number {
  return Object.values(completions).filter(Boolean).length;
}

export function buildWeeklyCompletionData(
  completions: Record<string, boolean>,
  weeks = 12,
  referenceDate = new Date()
): { week: string; count: number }[] {
  const today = new Date(referenceDate);
  const data = [];

  for (let w = weeks - 1; w >= 0; w--) {
    let count = 0;
    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() - w * 7 - d);
      const key = formatDate(date);
      if (completions[key]) {count++;}
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
  completions: Record<string, boolean>,
  months = 6,
  referenceDate = new Date()
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
      if (completions[key]) {completed++;}
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
