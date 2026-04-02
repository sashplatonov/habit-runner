import type { LucideIcon } from 'lucide-react';
import { AlertTriangleIcon, LightbulbIcon, TrendingDownIcon, TrendingUpIcon, CheckCircle2Icon } from 'lucide-react';

type QuarterTickMeta = {
  isMonthStart: boolean;
  monthLabel: string;
};

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
  for (let i = 0; i < labels.length; i++) {
    const { monthLabel } = parseQuarterPeriodLabel(labels[i]);
    const isMonthStart = monthLabel !== lastMonthLabel;
    if (isMonthStart) {
      lastMonthLabel = monthLabel;
    }
    meta.set(i, { isMonthStart, monthLabel });
  }
  return meta;
}

export function buildDailyChartInsight(
  avgRate: number,
  dailyData: { day: string; rate: number }[]
): { icon: LucideIcon; text: string; color: string } {
  if (dailyData.length < 3) {
    return { icon: LightbulbIcon, text: 'Track more days to see patterns.', color: 'var(--text-muted)' };
  }
  const recent3 = dailyData.slice(-3).map((d) => d.rate);
  const avg3 = recent3.reduce((s, r) => s + r, 0) / 3;
  const overall = dailyData.map((d) => d.rate).reduce((s, r) => s + r, 0) / dailyData.length;
  const trend = avg3 - overall;
  if (avgRate >= 80) {
    return { icon: CheckCircle2Icon, text: 'Consistency is excellent — keep this pace.', color: 'var(--accent)' };
  }
  if (trend > 5) {
    return { icon: TrendingUpIcon, text: 'Recent days trending up — great momentum.', color: 'var(--accent)' };
  }
  if (trend < -5) {
    return { icon: TrendingDownIcon, text: 'Recent dip — try habit stacking or a reminder.', color: 'var(--accent-secondary)' };
  }
  if (avgRate < 40) {
    return { icon: AlertTriangleIcon, text: 'Low overall rate. Focus on one keystone habit.', color: 'var(--accent-secondary)' };
  }
  return { icon: LightbulbIcon, text: 'Steady progress. Consistency compounds over time.', color: 'var(--text-muted)' };
}

export function habitStatusLabel(completionRate: number, currentStreak: number, longestStreak: number): { label: string; color: string } {
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
