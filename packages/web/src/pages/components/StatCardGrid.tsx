import { CalendarIcon, FlameIcon, TargetIcon, TrendingUpIcon } from 'lucide-react';
import type { HabitColorTheme } from '@/lib/theme/habit-colors';
import {
  getStreakHint,
  getBestHint,
  getRateHint,
  getRateColor,
  getTotalHint,
  getHabitAgeDays,
  getRateWindowLabel,
  type CardHint
} from './HabitDetailView.helpers';

type StatCardGridProps = {
  stats: {
    currentStreak: number;
    longestStreak: number;
    completionRate: number;
    completedDays: number;
  };
  accent: HabitColorTheme;
  habitCreatedAt: string;
};

function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  hint,
  hintColor,
  valueColor
}: {
  icon: React.ComponentType<{ size: number; className?: string }>;
  label: string;
  value: string | number;
  unit?: string;
  hint: CardHint;
  hintColor: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-3">
      <div className="flex items-center gap-1 mb-2">
        <Icon size={10} className={label === 'Streak' ? 'text-accent-secondary' : label === 'Best' ? '' : label === 'Rate' ? 'text-accent-secondary' : 'text-muted'} style={label === 'Best' ? { color: valueColor } : undefined} />
        <span className="text-[9px] font-mono text-muted uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-xl font-mono font-bold ${valueColor || (label === 'Streak' ? 'text-accent-secondary' : label === 'Total' ? 'text-foreground' : '')}`} style={label === 'Best' ? { color: valueColor } : undefined}>
        {value}
      </div>
      {unit && <div className="text-[9px] font-mono text-muted">{unit}</div>}
      <div className={`flex items-center gap-0.5 mt-1 ${hintColor}`}>
        <hint.icon size={8} className="flex-shrink-0" />
        <span className="text-[9px] font-mono">{hint.text}</span>
      </div>
    </div>
  );
}

export function StatCardGrid({ stats, accent, habitCreatedAt }: StatCardGridProps) {
  const habitAgeDays = getHabitAgeDays(habitCreatedAt);
  const rateWindowLabel = getRateWindowLabel(habitAgeDays);
  const streakHint = getStreakHint(stats.currentStreak, stats.longestStreak);
  const bestHint = getBestHint(stats.longestStreak);
  const rateHint = getRateHint(habitAgeDays, stats.completionRate);
  const totalHint = getTotalHint(stats.completedDays);
  const rateColor = getRateColor(habitAgeDays, stats.completionRate);

  const streakHintColor =
    stats.currentStreak === 0 ? 'text-accent-secondary' : stats.currentStreak >= stats.longestStreak ? 'text-accent' : 'text-muted';
  const bestHintColor = stats.longestStreak >= 21 ? 'text-accent' : stats.longestStreak >= 7 ? 'text-accent-secondary' : 'text-muted';
  const totalHintColor = stats.completedDays >= 100 ? 'text-accent' : 'text-muted';

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <StatCard
        icon={FlameIcon}
        label="Streak"
        value={stats.currentStreak}
        unit="days"
        hint={streakHint}
        hintColor={streakHintColor}
      />
      <StatCard
        icon={TargetIcon}
        label="Best"
        value={stats.longestStreak}
        unit="days"
        hint={bestHint}
        hintColor={bestHintColor}
        valueColor={accent.hex}
      />
      <StatCard
        icon={TrendingUpIcon}
        label="Rate"
        value={`${stats.completionRate}%`}
        unit={rateWindowLabel}
        hint={rateHint}
        hintColor={rateColor}
      />
      <StatCard
        icon={CalendarIcon}
        label="Total"
        value={stats.completedDays}
        unit="days"
        hint={totalHint}
        hintColor={totalHintColor}
      />
    </div>
  );
}
