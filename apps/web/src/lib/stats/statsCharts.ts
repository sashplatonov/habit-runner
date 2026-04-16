export type QuarterTickMeta = {
  isMonthStart: boolean;
  monthLabel: string;
  weekLabel: string;
};

export type DailyInsightTone = 'success' | 'up' | 'down' | 'alert' | 'neutral';

export function parseQuarterPeriodLabel(label: string): { monthLabel: string; weekLabel: string } {
  const parts = label.split(' · ');
  return {
    monthLabel: parts[0] || '',
    weekLabel: parts[1] || ''
  };
}

export function formatQuarterWeekLabel(weekLabel: string): string {
  const match = weekLabel.match(/Week (\d+)/);
  return match ? `W${match[1]}` : weekLabel;
}

export function buildQuarterTickMeta(labels: string[]): Map<number, QuarterTickMeta> {
  const meta = new Map<number, QuarterTickMeta>();
  let lastMonthLabel = '';

  for (let index = 0; index < labels.length; index += 1) {
    const parsed = parseQuarterPeriodLabel(labels[index]);
    const isMonthStart = parsed.monthLabel !== lastMonthLabel;
    if (isMonthStart) {
      lastMonthLabel = parsed.monthLabel;
    }
    meta.set(index, {
      isMonthStart,
      monthLabel: parsed.monthLabel,
      weekLabel: parsed.weekLabel
    });
  }

  return meta;
}

export function buildDailyChartInsight(
  avgRate: number,
  dailyData: Array<{ day: string; rate: number }>
): { tone: DailyInsightTone; text: string; color: string } {
  if (dailyData.length < 3) {
    return { tone: 'neutral', text: 'Track more days to see patterns.', color: 'var(--text-muted)' };
  }

  const recent3 = dailyData.slice(-3).map((entry) => entry.rate);
  const avg3 = recent3.reduce((sum, rate) => sum + rate, 0) / 3;
  const overall = dailyData.map((entry) => entry.rate).reduce((sum, rate) => sum + rate, 0) / dailyData.length;
  const trend = avg3 - overall;

  if (avgRate >= 80) {
    return { tone: 'success', text: 'Consistency is excellent - keep this pace.', color: 'var(--accent)' };
  }
  if (trend > 5) {
    return { tone: 'up', text: 'Recent days trending up - great momentum.', color: 'var(--accent)' };
  }
  if (trend < -5) {
    return { tone: 'down', text: 'Recent dip - try habit stacking or a reminder.', color: 'var(--accent-secondary)' };
  }
  if (avgRate < 40) {
    return { tone: 'alert', text: 'Low overall rate. Focus on one keystone habit.', color: 'var(--accent-secondary)' };
  }

  return { tone: 'neutral', text: 'Steady progress. Consistency compounds over time.', color: 'var(--text-muted)' };
}

export function habitStatusLabel(
  completionRate: number,
  currentStreak: number,
  longestStreak: number
): { label: string; color: string } {
  if (completionRate >= 80) {
    return { label: 'Excellent', color: 'var(--accent)' };
  }
  if (currentStreak >= longestStreak && longestStreak > 0) {
    return { label: 'Personal best', color: 'var(--accent)' };
  }
  if (longestStreak >= 21) {
    return { label: 'Established', color: 'var(--accent)' };
  }
  if (currentStreak >= 7) {
    return { label: 'Building', color: 'var(--accent-secondary)' };
  }
  if (completionRate >= 50) {
    return { label: 'Consistent', color: 'var(--accent-secondary)' };
  }
  return { label: 'Starting', color: 'var(--text-muted)' };
}