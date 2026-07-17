import {
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckCircle2,
  Flame,
  Lightbulb,
  Target,
  TrendingDown,
  TrendingUp
} from 'lucide-svelte';

type HintIcon = typeof Flame;

export type CardHint = {
  icon: HintIcon;
  text: string;
};

export type DetailInsight = {
  icon: HintIcon;
  text: string;
  color: string;
};

export function getHabitAgeDays(createdAt: string): number {
  const createdAtTime = new Date(createdAt).getTime();
  if (!Number.isFinite(createdAtTime)) {
    return 0;
  }

  return Math.max(0, Math.floor((Date.now() - createdAtTime) / 86_400_000));
}

export function getRateWindowLabel(habitAgeDays: number): string {
  if (habitAgeDays < 7) {
    return 'first days';
  }
  if (habitAgeDays < 30) {
    return 'first month';
  }
  if (habitAgeDays < 90) {
    return 'last 90d';
  }
  return 'all time';
}

export function getStreakHint(currentStreak: number, longestStreak: number): CardHint {
  if (currentStreak <= 0) {
    return { icon: AlertTriangle, text: 'Continue with today’s scheduled step' };
  }
  if (currentStreak >= longestStreak && currentStreak >= 7) {
    return { icon: TrendingUp, text: 'Personal best pace' };
  }
  if (currentStreak >= 21) {
    return { icon: Flame, text: 'Strong live streak' };
  }
  if (currentStreak >= 7) {
    return { icon: Flame, text: 'Building consistency' };
  }
  return { icon: Lightbulb, text: 'Early momentum' };
}

export function getBestHint(longestStreak: number): CardHint {
  if (longestStreak <= 0) {
    return { icon: Lightbulb, text: 'No personal best yet' };
  }
  if (longestStreak < 7) {
    return { icon: Flame, text: 'First wins are stacking up' };
  }
  if (longestStreak < 21) {
    return { icon: TrendingUp, text: 'Momentum is building' };
  }
  if (longestStreak < 66) {
    return { icon: CheckCircle2, text: 'Strong run to beat' };
  }
  return { icon: Target, text: 'Elite baseline already set' };
}

export function getRateHint(habitAgeDays: number, completionRate: number): CardHint {
  if (habitAgeDays < 7) {
    return { icon: Lightbulb, text: 'Starting sample, keep logging' };
  }
  if (completionRate >= 80) {
    return { icon: CheckCircle2, text: 'Reliable completion pattern' };
  }
  if (completionRate >= 60) {
    return { icon: TrendingUp, text: 'On pace, keep it steady' };
  }
  if (completionRate >= 40) {
    return { icon: Lightbulb, text: 'Needs more consistency' };
  }
  return { icon: AlertTriangle, text: 'Simplify the next scheduled step' };
}

export function getRateColor(habitAgeDays: number, completionRate: number): string {
  if (habitAgeDays < 7) {
    return 'text-muted';
  }
  if (completionRate >= 80) {
    return 'text-accent';
  }
  if (completionRate >= 60) {
    return 'text-accent-secondary';
  }
  if (completionRate >= 40) {
    return 'text-muted';
  }
  return 'text-accent-secondary';
}

export function getTotalHint(completedDays: number): CardHint {
  if (completedDays <= 0) {
    return { icon: Calendar, text: 'Start today' };
  }
  if (completedDays < 7) {
    return { icon: Calendar, text: 'First wins recorded' };
  }
  if (completedDays < 30) {
    return { icon: TrendingUp, text: 'Repetition is compounding' };
  }
  if (completedDays < 100) {
    return { icon: CheckCircle2, text: 'Serious volume already built' };
  }
  return { icon: Target, text: 'Century club' };
}

export function getAutomatismLevel(score: number, accentHex: string) {
  if (score >= 85) {
    return { label: 'Automatic', color: accentHex };
  }
  if (score >= 66) {
    return { label: 'Established', color: accentHex };
  }
  if (score >= 40) {
    return { label: 'Growing', color: 'var(--text-foreground)' };
  }
  return { label: 'Fragile', color: 'var(--text-muted)' };
}

export function getAutomatismMessage(score: number): string {
  if (score >= 85) {
    return 'This habit feels automatic now. Keep the context stable.';
  }
  if (score >= 66) {
    return 'Habit is established. Keep the context steady to protect it.';
  }
  if (score >= 40) {
    return `${Math.max(1, 66 - Math.round(score * 0.66))} more active days to reach the automatic range.`;
  }
  return 'Habit is still early. Repetition in the same context will help it settle.';
}

export function getAutomatismColor(score: number): string {
  if (score >= 66) {
    return 'var(--accent)';
  }
  if (score >= 40) {
    return 'var(--accent-secondary)';
  }
  return 'var(--text-muted)';
}

export function buildMonthlyInsight(
  monthlyData: Array<{ month: string; rate: number }>,
  habitCreatedAt: string
): DetailInsight {
  const habitAgeDays = getHabitAgeDays(habitCreatedAt);
  if (monthlyData.length < 2 || habitAgeDays < 14) {
    return {
      icon: BarChart3,
      text: 'Complete more weeks to see monthly trends.',
      color: 'var(--text-muted)'
    };
  }

  const last = monthlyData[monthlyData.length - 1]?.rate ?? 0;
  const previous = monthlyData[monthlyData.length - 2]?.rate ?? 0;
  const trend = last - previous;

  if (last >= 80 && trend >= 0) {
    return {
      icon: CheckCircle2,
      text: `${last}% last month - excellent, keep this up.`,
      color: 'var(--accent)'
    };
  }
  if (trend >= 15) {
    return {
      icon: TrendingUp,
      text: `Up ${trend}% from last month - great momentum!`,
      color: 'var(--accent)'
    };
  }
  if (trend <= -15) {
    return {
      icon: TrendingDown,
      text: `Down ${Math.abs(trend)}% this month. What changed in your routine?`,
      color: 'var(--accent-secondary)'
    };
  }
  if (last < 40) {
    return {
      icon: AlertTriangle,
      text: 'Low rate. Try habit stacking or reduce the daily target.',
      color: 'var(--accent-secondary)'
    };
  }
  return {
    icon: Lightbulb,
    text: `${last}% this month. Consistent effort adds up over time.`,
    color: 'var(--text-muted)'
  };
}

export function buildWeeklyInsight(
  weeklyData: Array<{ count: number }>,
  habitCreatedAt: string
): DetailInsight {
  const habitAgeDays = getHabitAgeDays(habitCreatedAt);
  if (weeklyData.length < 4 || habitAgeDays < 14) {
    return { icon: Lightbulb, text: '', color: '' };
  }

  const lastWeek = weeklyData[weeklyData.length - 1]?.count ?? 0;
  const recentAverage = weeklyData.slice(-3).reduce((sum, week) => sum + week.count, 0) / 3;
  const previousAverage = weeklyData.slice(-6, -3).reduce((sum, week) => sum + week.count, 0) / 3;
  const trend = recentAverage - previousAverage;

  if (lastWeek === 7) {
    return {
      icon: Flame,
      text: 'Perfect last week - all 7 days completed!',
      color: 'var(--accent)'
    };
  }
  if (trend > 1.5) {
    return {
      icon: TrendingUp,
      text: 'Weekly completions trending up - great momentum.',
      color: 'var(--accent)'
    };
  }
  if (trend < -1.5) {
    return {
      icon: TrendingDown,
      text: 'Completions dropping recently. Try pairing with an existing habit.',
      color: 'var(--accent-secondary)'
    };
  }
  if (lastWeek === 0) {
    return {
      icon: AlertTriangle,
      text: 'No completions last week. Start fresh today.',
      color: 'var(--accent-secondary)'
    };
  }
  return {
    icon: Lightbulb,
    text: `${lastWeek}/7 days last week. Aim for one more next week.`,
    color: 'var(--text-muted)'
  };
}
