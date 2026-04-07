export type CardHint = { iconName: string; text: string };

export function getStreakHint(currentStreak: number, longestStreak: number): CardHint {
  if (currentStreak === 0) return { iconName: 'flame', text: 'Start today' };
  if (currentStreak >= longestStreak && longestStreak > 0) return { iconName: 'trophy', text: 'Personal best!' };
  return { iconName: 'flame', text: `${longestStreak - currentStreak}d to record` };
}

export function getBestHint(longestStreak: number): CardHint {
  if (longestStreak >= 21) return { iconName: 'check-circle-2', text: 'Habit established' };
  if (longestStreak >= 7) return { iconName: 'dumbbell', text: 'Good foundation' };
  return { iconName: 'target', text: 'Target: 7 days' };
}

export function getRateHint(habitAgeDays: number, completionRate: number): CardHint {
  if (habitAgeDays < 7) return { iconName: 'sprout', text: 'Just started' };
  if (habitAgeDays < 14) {
    return completionRate >= 60
      ? { iconName: 'check-circle-2', text: 'Strong start!' }
      : { iconName: 'dumbbell', text: 'Keep building' };
  }
  if (completionRate >= 80) return { iconName: 'check-circle-2', text: 'Excellent' };
  if (completionRate >= 60) return { iconName: 'lightbulb', text: 'Aim for 80%+' };
  if (completionRate >= 40) return { iconName: 'trending-up', text: 'Room to grow' };
  return { iconName: 'alert-triangle', text: 'Needs focus' };
}

export function getRateColor(habitAgeDays: number, completionRate: number): string {
  if (habitAgeDays < 14) return completionRate >= 60 ? 'text-accent' : 'text-accent-secondary';
  if (completionRate >= 80) return 'text-accent';
  if (completionRate >= 50) return 'text-accent-secondary';
  return 'text-muted';
}

export function getTotalHint(completedDays: number): CardHint {
  if (completedDays >= 100) return { iconName: 'trophy', text: '100+ milestone!' };
  return { iconName: 'calendar', text: `${100 - completedDays} to 100` };
}

export function getHabitAgeDays(habitCreatedAt: string): number {
  return Math.floor((Date.now() - new Date(habitCreatedAt).getTime()) / (1000 * 60 * 60 * 24));
}

export function getRateWindowLabel(habitAgeDays: number): string {
  const rateWindowDays = Math.min(30, habitAgeDays);
  return rateWindowDays < 30 ? `${rateWindowDays}d` : '30 days';
}

export function buildMonthlyInsight(monthlyData: Array<{ month: string; rate: number }>, habitCreatedAt: string): { iconName: string; text: string; color: string } {
  const habitAgeDays = Math.floor((Date.now() - new Date(habitCreatedAt).getTime()) / (1000 * 60 * 60 * 24));
  if (monthlyData.length < 2 || habitAgeDays < 14) return { iconName: 'bar-chart-2', text: 'Complete more weeks to see monthly trends.', color: 'var(--text-muted)' };
  const last = monthlyData[monthlyData.length - 1].rate;
  const prev = monthlyData[monthlyData.length - 2].rate;
  const trend = last - prev;
  if (last >= 80 && trend >= 0) return { iconName: 'check-circle-2', text: `${last}% last month — excellent, keep this up.`, color: 'var(--accent)' };
  if (trend >= 15) return { iconName: 'trending-up', text: `Up ${trend}% from last month — great momentum!`, color: 'var(--accent)' };
  if (trend <= -15) return { iconName: 'trending-down', text: `Down ${Math.abs(trend)}% this month. What changed in your routine?`, color: 'var(--accent-secondary)' };
  if (last < 40) return { iconName: 'alert-triangle', text: 'Low rate. Try habit stacking or reduce the daily target.', color: 'var(--accent-secondary)' };
  return { iconName: 'lightbulb', text: `${last}% this month. Consistent effort adds up over time.`, color: 'var(--text-muted)' };
}

export function buildWeeklyInsight(weeklyData: Array<{ count: number }>, habitCreatedAt: string): { iconName: string; text: string; color: string } {
  const habitAgeDays = Math.floor((Date.now() - new Date(habitCreatedAt).getTime()) / (1000 * 60 * 60 * 24));
  if (weeklyData.length < 4 || habitAgeDays < 14) return { iconName: 'lightbulb', text: '', color: '' };
  const lastWeek = weeklyData[weeklyData.length - 1].count;
  const recentAvg = weeklyData.slice(-3).reduce((s, w) => s + w.count, 0) / 3;
  const earlierAvg = weeklyData.slice(-6, -3).reduce((s, w) => s + w.count, 0) / 3;
  const trend = recentAvg - earlierAvg;
  if (lastWeek === 7) return { iconName: 'flame', text: 'Perfect last week — all 7 days completed!', color: 'var(--accent)' };
  if (trend > 1.5) return { iconName: 'trending-up', text: 'Weekly completions trending up — great momentum.', color: 'var(--accent)' };
  if (trend < -1.5) return { iconName: 'trending-down', text: 'Completions dropping recently. Try pairing with an existing habit.', color: 'var(--accent-secondary)' };
  if (lastWeek === 0) return { iconName: 'alert-triangle', text: 'No completions last week. Start fresh today.', color: 'var(--accent-secondary)' };
  return { iconName: 'lightbulb', text: `${lastWeek}/7 days last week. Aim for one more next week.`, color: 'var(--text-muted)' };
}

export const RETRO_CALENDAR_DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export const RETRO_POPOVER_WIDTH = 200;
export const RETRO_POPOVER_HEIGHT = 120;
