import {
  ArrowLeftIcon,
  EditIcon,
  FlameIcon,
  TrendingUpIcon,
  CalendarIcon,
  TargetIcon,
  TrashIcon,
  ArchiveIcon,
  ArchiveRestoreIcon,
  SnowflakeIcon
} from 'lucide-react';
import { HabitHeatmap } from '@/components/HabitHeatmap';
import { HabitRetroCalendar } from './HabitRetroCalendar';
import { TodayBlock } from './HabitDetailTodayBlock';
import { CompletionRing } from '@/components/CompletionRing';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import type { Habit } from '@/types/habit';
import type { HabitColorTheme } from '@/lib/theme/habit-colors';

type HabitStats = {
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  automatismScore: number;
  completedDays: number;
  monthlyData: Array<{ month: string; rate: number }>;
  weeklyData: Array<{ count: number }>;
};

type HabitDetailViewProps = {
  habitId: string;
  habit: Habit;
  stats: HabitStats;
  accent: HabitColorTheme;
  completedToday: boolean;
  todayCompletionCount: number;
  confirmDelete: boolean;
  isTodayFrozen: boolean;
  navigate: (to: string) => void;
  setConfirmDelete: (value: boolean) => void;
  handleToggleArchive: () => void;
  handleIncrementCompletion: () => Promise<void>;
  handleDecrementCompletion: () => Promise<void>;
  toggleFreezeToday: () => Promise<void>;
  handleDelete: () => Promise<void>;
  setCompletionCount: (habitId: string, date: string, count: number) => Promise<unknown>;
};

function CustomTooltip({
  active,
  payload,
  label,
  accentHex
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  accentHex: string;
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bg-card border border-border rounded px-2 py-1.5">
        <p className="text-[10px] font-mono text-muted">{label}</p>
        <p className="text-xs font-mono font-bold" style={{ color: accentHex }}>
          {payload[0].value}%
        </p>
      </div>
    );
  }
  return null;
}

function HabitDetailHeader({
  habit,
  habitId,
  accent,
  completedToday,
  todayCompletionCount,
  canIncrement,
  isTodayFrozen,
  navigate,
  handleToggleArchive,
  handleIncrementCompletion,
  handleDecrementCompletion,
  toggleFreezeToday
}: Pick<
  HabitDetailViewProps,
  | 'habit'
  | 'habitId'
  | 'accent'
  | 'completedToday'
  | 'todayCompletionCount'
  | 'navigate'
  | 'handleToggleArchive'
  | 'handleIncrementCompletion'
  | 'handleDecrementCompletion'
  | 'toggleFreezeToday'
> & { canIncrement: boolean; isTodayFrozen: boolean }) {
  return (
    <div
      className="border-b border-border bg-bg-primary px-4 sticky top-0 z-10"
      style={{
        top: 'var(--safe-area-inset-top, 0px)',
        paddingTop: 'calc(var(--safe-area-inset-top, 0px) + 1rem)',
        paddingBottom: '1rem'
      }}
    >
      <div className="max-w-2xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button onClick={() => navigate('/')} className="text-muted hover:text-foreground transition-colors p-1 -ml-1 flex-shrink-0">
            <ArrowLeftIcon size={16} />
          </button>
          <span className="text-xl flex-shrink-0">{habit.icon}</span>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-foreground break-words sm:truncate">{habit.name}</h1>
            <p className="text-[11px] text-muted break-words sm:truncate">{habit.description}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <button
            onClick={handleToggleArchive}
            className={`p-1.5 rounded border transition-colors ${
              habit.archived
                ? 'border-accent-secondary/30 text-accent-secondary bg-accent-secondary/10 hover:bg-accent-secondary/20'
                : 'border-border text-muted hover:text-foreground hover:border-border-hover'
            }`}
            title={habit.archived ? 'Unarchive' : 'Archive'}
          >
            {habit.archived ? <ArchiveRestoreIcon size={13} /> : <ArchiveIcon size={13} />}
          </button>
          <button
            onClick={() => navigate(`/habit/${habitId}/edit`)}
            className="p-1.5 rounded border border-border text-muted hover:text-foreground hover:border-border-hover transition-colors"
          >
            <EditIcon size={13} />
          </button>
          <button
            onClick={() => {
              void handleIncrementCompletion();
            }}
            disabled={!canIncrement}
            className={`px-3 py-1.5 rounded text-xs font-mono font-medium border transition-all duration-200 ${
              completedToday ? 'border-border text-muted bg-transparent' : 'text-bg-primary font-bold'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            style={
              !completedToday
                ? {
                    backgroundColor: accent.hex,
                    borderColor: accent.hex,
                    boxShadow: `0 0 16px ${accent.glow}`
                  }
                : undefined
            }
          >
            {completedToday ? 'Done' : 'Add +1'}
          </button>
          <button
            type="button"
            onClick={() => {
              void handleDecrementCompletion();
            }}
            disabled={todayCompletionCount <= 0}
            className="px-3 py-1.5 rounded text-xs font-mono font-medium border border-border text-muted transition disabled:opacity-40 disabled:cursor-not-allowed hover:border-border-hover hover:text-foreground"
          >
            -1
          </button>
          <button
            type="button"
            onClick={() => {
              void toggleFreezeToday();
            }}
            className={`inline-flex h-[34px] w-[34px] flex-none items-center justify-center rounded border transition-colors ${
              isTodayFrozen
                ? 'border-accent text-accent bg-accent/15 shadow-[0_0_12px_rgba(255,255,255,0.08)]'
                : 'border-border text-muted hover:text-foreground hover:border-border-hover'
            }`}
            aria-label={isTodayFrozen ? 'Unfreeze today' : 'Freeze today'}
            title={isTodayFrozen ? 'Unfreeze today' : 'Freeze today'}
          >
            <SnowflakeIcon size={11} strokeWidth={2.2} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCardGrid({ stats, accent }: Pick<HabitDetailViewProps, 'stats' | 'accent'>) {
  const streakHint =
    stats.currentStreak === 0
      ? 'Start today'
      : stats.currentStreak >= stats.longestStreak && stats.longestStreak > 0
        ? 'Personal best!'
        : `${stats.longestStreak - stats.currentStreak}d to record`;

  const bestHint =
    stats.longestStreak >= 21 ? 'Habit established' : stats.longestStreak >= 7 ? 'Good foundation' : 'Target: 7 days';

  const rateHint =
    stats.completionRate >= 80
      ? 'Excellent'
      : stats.completionRate >= 60
        ? 'Aim for 80%+'
        : stats.completionRate >= 40
          ? 'Room to grow'
          : 'Needs focus';

  const totalHint = stats.completedDays >= 100 ? '100+ milestone!' : `${100 - stats.completedDays} to 100`;

  const rateColor =
    stats.completionRate >= 80 ? 'text-accent' : stats.completionRate >= 50 ? 'text-accent-secondary' : 'text-muted';

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <div className="bg-bg-secondary border border-border rounded-lg p-3">
        <div className="flex items-center gap-1 mb-2">
          <FlameIcon size={10} className="text-accent-secondary" />
          <span className="text-[9px] font-mono text-muted uppercase tracking-wider">Streak</span>
        </div>
        <div className="text-xl font-mono font-bold text-accent-secondary">{stats.currentStreak}</div>
        <div className="text-[9px] font-mono text-muted">days</div>
        <p className={`text-[9px] font-mono mt-1 ${stats.currentStreak === 0 ? 'text-accent-secondary' : stats.currentStreak >= stats.longestStreak ? 'text-accent' : 'text-muted'}`}>
          {streakHint}
        </p>
      </div>
      <div className="bg-bg-secondary border border-border rounded-lg p-3">
        <div className="flex items-center gap-1 mb-2">
          <TargetIcon size={10} style={{ color: accent.hex }} />
          <span className="text-[9px] font-mono text-muted uppercase tracking-wider">Best</span>
        </div>
        <div className="text-xl font-mono font-bold" style={{ color: accent.hex }}>
          {stats.longestStreak}
        </div>
        <div className="text-[9px] font-mono text-muted">days</div>
        <p className={`text-[9px] font-mono mt-1 ${stats.longestStreak >= 21 ? 'text-accent' : stats.longestStreak >= 7 ? 'text-accent-secondary' : 'text-muted'}`}>
          {bestHint}
        </p>
      </div>
      <div className="bg-bg-secondary border border-border rounded-lg p-3">
        <div className="flex items-center gap-1 mb-2">
          <TrendingUpIcon size={10} className="text-accent-secondary" />
          <span className="text-[9px] font-mono text-muted uppercase tracking-wider">Rate</span>
        </div>
        <div className="text-xl font-mono font-bold text-accent-secondary">{stats.completionRate}%</div>
        <div className="text-[9px] font-mono text-muted">30 days</div>
        <p className={`text-[9px] font-mono mt-1 ${rateColor}`}>{rateHint}</p>
      </div>
      <div className="bg-bg-secondary border border-border rounded-lg p-3">
        <div className="flex items-center gap-1 mb-2">
          <CalendarIcon size={10} className="text-muted" />
          <span className="text-[9px] font-mono text-muted uppercase tracking-wider">Total</span>
        </div>
        <div className="text-xl font-mono font-bold text-foreground">{stats.completedDays}</div>
        <div className="text-[9px] font-mono text-muted">days</div>
        <p className={`text-[9px] font-mono mt-1 ${stats.completedDays >= 100 ? 'text-accent' : 'text-muted'}`}>
          {totalHint}
        </p>
      </div>
    </div>
  );
}

function AutomatismSection({ score, accent }: { score: number; accent: HabitColorTheme }) {
  const getLevel = (s: number) => {
    if (s >= 85) {return { label: 'Infallible', color: accent.hex };}
    if (s >= 66) {return { label: 'Established', color: accent.hex };}
    if (s >= 40) {return { label: 'Growing', color: 'var(--text-foreground)' };}
    return { label: 'Fragile', color: 'var(--text-muted)' };
  };

  const level = getLevel(score);
  return (
    <div className="bg-bg-secondary border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-muted uppercase tracking-widest">Habit Strength</span>
          <span className="text-lg font-bold text-foreground">Automatism: {score}%</span>
        </div>
        <div 
          className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border"
          style={{ borderColor: level.color, color: level.color }}
        >
          {level.label}
        </div>
      </div>
      <div className="h-2 bg-border rounded-full overflow-hidden">
        <div 
          className="h-full transition-all duration-1000 ease-out"
          style={{ 
            width: `${score}%`, 
            backgroundColor: accent.hex,
            boxShadow: `0 0 10px ${accent.glow}`
          }}
        />
      </div>
      <div className="mt-2 text-[10px] leading-relaxed font-mono" style={{ color: score >= 66 ? 'var(--accent)' : score >= 40 ? 'var(--accent-secondary)' : 'var(--text-muted)' }}>
        {score >= 85
          ? 'This habit runs on autopilot — your routine is locked in.'
          : score >= 66
            ? 'Habit is established. Keep consistent to push it further.'
            : score >= 40
              ? `${Math.max(1, 66 - Math.round(score * 0.66))} more active days to reach "automatic" state.`
              : 'Habit is still fragile. Daily repetition is critical right now.'}
      </div>
    </div>
  );
}

function TargetRingSection({ stats, habit, accent }: Pick<HabitDetailViewProps, 'stats' | 'habit' | 'accent'>) {
  const remaining = habit.targetStreak - stats.currentStreak;
  const streakHint =
    stats.currentStreak >= habit.targetStreak
      ? `Target reached! Set a new challenge.`
      : stats.currentStreak === 0
        ? `Start today — ${habit.targetStreak} days to reach your target.`
        : `${remaining} more day${remaining === 1 ? '' : 's'} to hit your ${habit.targetStreak}-day target.`;

  const hintColor =
    stats.currentStreak >= habit.targetStreak
      ? 'text-accent'
      : stats.currentStreak > habit.targetStreak * 0.5
        ? 'text-accent-secondary'
        : 'text-muted';

  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-4 flex items-center gap-4">
      <CompletionRing percentage={stats.completionRate} size={72} strokeWidth={5} color={habit.color} showText />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-muted">Target streak</span>
          <span className="text-xs font-mono" style={{ color: accent.hex }}>
            {stats.currentStreak}/{habit.targetStreak}d
          </span>
        </div>
        <div className="h-1.5 bg-border rounded-full overflow-hidden mb-2">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(100, (stats.currentStreak / habit.targetStreak) * 100)}%`,
              backgroundColor: accent.hex,
              boxShadow: `0 0 8px ${accent.glow}`
            }}
          />
        </div>
        <p className={`text-[9px] font-mono mb-2 ${hintColor}`}>{streakHint}</p>
        <div className="flex gap-2 flex-wrap">
          {habit.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border border-border bg-bg-card text-foreground"
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent.hex }} />
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function HeatmapSection({
  habit,
  dailyTarget
}: Pick<HabitDetailViewProps, 'habit'> & { dailyTarget: number }) {
  const completedCount = habit.completions ? Object.keys(habit.completions).length : 0;
  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-mono text-muted uppercase tracking-wider">Activity - 90 days</h2>
        <span className="text-[10px] font-mono text-muted">{completedCount} completions</span>
      </div>
      <div className="w-full mx-auto lg:max-w-[560px]">
        <HabitHeatmap completions={habit.completions} dailyTarget={dailyTarget} color={habit.color} />
      </div>
    </div>
  );
}

function buildMonthlyInsight(monthlyData: Array<{ month: string; rate: number }>): { text: string; color: string } {
  if (monthlyData.length < 2) return { text: 'Complete a full month to see trends.', color: 'var(--text-muted)' };
  const last = monthlyData[monthlyData.length - 1].rate;
  const prev = monthlyData[monthlyData.length - 2].rate;
  const trend = last - prev;
  if (last >= 80 && trend >= 0) return { text: `${last}% last month — excellent, keep this up.`, color: 'var(--accent)' };
  if (trend >= 15) return { text: `Up ${trend}% from last month — great momentum!`, color: 'var(--accent)' };
  if (trend <= -15) return { text: `Down ${Math.abs(trend)}% this month. What changed in your routine?`, color: 'var(--accent-secondary)' };
  if (last < 40) return { text: 'Low rate. Try habit stacking or reduce the daily target.', color: 'var(--accent-secondary)' };
  return { text: `${last}% this month. Consistent effort adds up over time.`, color: 'var(--text-muted)' };
}

function MonthlyRateSection({ stats, accent }: Pick<HabitDetailViewProps, 'stats' | 'accent'>) {
  const insight = buildMonthlyInsight(stats.monthlyData);
  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-4">
      <h2 className="text-xs font-mono text-muted uppercase tracking-wider mb-4">Monthly completion rate</h2>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={stats.monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            axisLine={false}
            tickLine={false}
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip accentHex={accent.hex} />} />
          <Line
            type="monotone"
            dataKey="rate"
            stroke={accent.hex}
            strokeWidth={2}
            dot={{ fill: accent.hex, r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: accent.hex, style: { filter: `drop-shadow(0 0 6px ${accent.glow})` } }}
            style={{ filter: `drop-shadow(0 0 4px ${accent.glow})` }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-[10px] font-mono mt-3" style={{ color: insight.color }}>{insight.text}</p>
    </div>
  );
}

function buildWeeklyInsight(weeklyData: Array<{ count: number }>): { text: string; color: string } {
  if (weeklyData.length < 4) return { text: '', color: '' };
  const lastWeek = weeklyData[weeklyData.length - 1].count;
  const recentAvg = (weeklyData.slice(-3).reduce((s, w) => s + w.count, 0)) / 3;
  const earlierAvg = (weeklyData.slice(-6, -3).reduce((s, w) => s + w.count, 0)) / 3;
  const trend = recentAvg - earlierAvg;
  if (lastWeek === 7) return { text: 'Perfect last week — all 7 days completed!', color: 'var(--accent)' };
  if (trend > 1.5) return { text: 'Weekly completions trending up — great momentum.', color: 'var(--accent)' };
  if (trend < -1.5) return { text: 'Completions dropping recently. Try pairing with an existing habit.', color: 'var(--accent-secondary)' };
  if (lastWeek === 0) return { text: 'No completions last week. Start fresh today.', color: 'var(--accent-secondary)' };
  return { text: `${lastWeek}/7 days last week. Aim for one more next week.`, color: 'var(--text-muted)' };
}

function WeeklyCompletionsSection({ stats, accent }: Pick<HabitDetailViewProps, 'stats' | 'accent'>) {
  const insight = buildWeeklyInsight(stats.weeklyData);
  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-4">
      <h2 className="text-xs font-mono text-muted uppercase tracking-wider mb-3">Weekly completions</h2>
      <div className="flex items-end gap-1 h-16">
        {stats.weeklyData.map((w, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-sm transition-all"
              style={{
                height: `${(w.count / 7) * 100}%`,
                minHeight: 2,
                backgroundColor: accent.hex,
                opacity: 0.4 + (i / stats.weeklyData.length) * 0.6,
                boxShadow: i === stats.weeklyData.length - 1 ? `0 0 8px ${accent.glow}` : 'none'
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1 mb-2">
        <span className="text-[9px] font-mono text-muted">12w ago</span>
        <span className="text-[9px] font-mono text-muted">this week</span>
      </div>
      {insight.text && (
        <p className="text-[10px] font-mono" style={{ color: insight.color }}>{insight.text}</p>
      )}
    </div>
  );
}

function DangerZone({
  confirmDelete,
  setConfirmDelete,
  handleDelete
}: Pick<HabitDetailViewProps, 'confirmDelete' | 'setConfirmDelete' | 'handleDelete'>) {
  if (!confirmDelete) {
    return (
      <div className="border border-border rounded-lg p-4">
        <h2 className="text-xs font-mono text-muted uppercase tracking-wider mb-3">Danger zone</h2>
        <button
          onClick={() => setConfirmDelete(true)}
          className="flex items-center gap-2 text-xs font-mono text-accent hover:text-accent-secondary/80 border border-accent/20 hover:border-accent/40 px-3 py-2 rounded transition-colors"
        >
          <TrashIcon size={12} />
          Delete habit
        </button>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg p-4">
      <h2 className="text-xs font-mono text-muted uppercase tracking-wider mb-3">Danger zone</h2>
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-muted">Are you sure?</span>
        <button
          onClick={() => {
            void handleDelete();
          }}
          className="text-xs font-mono text-accent border border-accent/40 px-3 py-1.5 rounded hover:bg-accent/10 transition-colors"
        >
          Delete
        </button>
        <button
          onClick={() => setConfirmDelete(false)}
          className="text-xs font-mono text-muted border border-border px-3 py-1.5 rounded hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function HabitDetailView({
  habitId,
  habit,
  stats,
  accent,
  completedToday,
  todayCompletionCount,
  confirmDelete,
  isTodayFrozen,
  navigate,
  setConfirmDelete,
  handleToggleArchive,
  handleIncrementCompletion,
  handleDecrementCompletion,
  toggleFreezeToday,
  handleDelete,
  setCompletionCount
}: HabitDetailViewProps) {
  const dailyTarget = Math.max(1, habit.dailyTarget ?? 1);
  const canIncrement = todayCompletionCount < dailyTarget;

  return (
    <div className="min-h-screen bg-bg-primary">
      <HabitDetailHeader
        habit={habit}
        habitId={habitId}
        accent={accent}
        completedToday={completedToday}
        todayCompletionCount={todayCompletionCount}
        canIncrement={canIncrement}
        navigate={navigate}
        handleToggleArchive={handleToggleArchive}
        handleIncrementCompletion={handleIncrementCompletion}
        handleDecrementCompletion={handleDecrementCompletion}
        isTodayFrozen={isTodayFrozen}
        toggleFreezeToday={toggleFreezeToday}
      />
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <StatCardGrid stats={stats} accent={accent} />
        <AutomatismSection score={stats.automatismScore} accent={accent} />
        <TodayBlock dailyTarget={dailyTarget} todayCompletionCount={todayCompletionCount} accent={accent} />
        <HeatmapSection habit={habit} dailyTarget={dailyTarget} />
        <TargetRingSection stats={stats} habit={habit} accent={accent} />
        <MonthlyRateSection stats={stats} accent={accent} />
        <WeeklyCompletionsSection stats={stats} accent={accent} />
        <HabitRetroCalendar habit={habit} dailyTarget={dailyTarget} accent={accent} setCompletionCount={setCompletionCount} />
        <DangerZone confirmDelete={confirmDelete} setConfirmDelete={setConfirmDelete} handleDelete={handleDelete} />
      </div>
    </div>
  );
}
