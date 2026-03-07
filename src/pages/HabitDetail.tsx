import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeftIcon,
  EditIcon,
  FlameIcon,
  TrendingUpIcon,
  CalendarIcon,
  TargetIcon,
  TrashIcon,
  ArchiveIcon,
  ArchiveRestoreIcon } from
'lucide-react';
import { HeatmapGrid } from '@/components/HeatmapGrid';
import { CompletionRing } from '@/components/CompletionRing';
import { useHabits } from '@/hooks/useHabits';
import { HABIT_COLOR_THEMES } from '@/lib/theme/habit-colors';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid } from
'recharts';
import { useNavigate, useParams } from '@/lib/router';
import { useUndo } from '@/lib/undo';
export function HabitDetail() {
  const navigate = useNavigate();
  const params = useParams();
  const habitId = params.id;
  const {
    allHabits,
    toggleCompletion,
    getHabitStats,
    deleteHabit,
    restoreHabit,
    updateHabit,
    formatDate
  } = useHabits();
  const { push } = useUndo();
  const habit = habitId ? allHabits.find((h) => h.id === habitId) : undefined;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reminderInput, setReminderInput] = useState('');
  const today = formatDate(new Date());
  const isTodayFrozen = habit ? habit.freezeDays.includes(today) : false;
  const handleDelete = useCallback(async () => {
    if (!habitId) {
      return;
    }
    const deleted = await deleteHabit(habitId);
    if (deleted) {
      push({
        message: `Habit "${deleted.name}" was deleted`,
        actionLabel: 'Restore',
        onUndo: async () => {
          await restoreHabit(deleted);
        }
      });
    }
    navigate('/');
  }, [deleteHabit, habitId, navigate, push, restoreHabit]);
  const handleToggleArchive = useCallback(() => {
    if (!habitId || !habit) {
      return;
    }
    updateHabit(habitId, {
      archived: !habit.archived
    });
  }, [habit, habitId, updateHabit]);
  const toggleFreezeToday = useCallback(async () => {
    if (!habitId || !habit) {
      return;
    }
    const nextFreezeDays = isTodayFrozen
      ? habit.freezeDays.filter((date) => date !== today)
      : [...habit.freezeDays, today];
    await updateHabit(habitId, { freezeDays: nextFreezeDays });
  }, [habit, habitId, isTodayFrozen, today, updateHabit]);
  useEffect(() => {
    setReminderInput(habit?.reminderTime ?? '');
  }, [habit?.reminderTime]);
  const handleReminderBlur = useCallback(async () => {
    if (!habitId) {
      return;
    }
    if (habit?.reminderTime === reminderInput) {
      return;
    }
    await updateHabit(habitId, {
      reminderTime: reminderInput || undefined
    });
  }, [habit, habitId, reminderInput, updateHabit]);
  const clearReminder = useCallback(async () => {
    if (!habitId) {
      return;
    }
    setReminderInput('');
    await updateHabit(habitId, { reminderTime: undefined });
  }, [habitId, updateHabit]);

  const handleToggleCompletion = useCallback(async () => {
    if (!habitId || !habit) {
      return;
    }
    const wasDone = habit.completions[today];
    await toggleCompletion(habitId, today);
    push({
      message: wasDone ? `Unchecked: ${habit.name}` : `Checked: ${habit.name}`,
      actionLabel: 'Undo',
      onUndo: async () => {
        await toggleCompletion(habitId, today);
      }
    });
  }, [habit, habitId, push, today, toggleCompletion]);
  if (!habit) {
    return (
      <div className="min-h-screen bg-bg-primary pt-14 flex items-center justify-center">
        <div className="text-muted font-mono">Habit not found</div>
      </div>);

  }
  const stats = getHabitStats(habitId);
  const accent = HABIT_COLOR_THEMES[habit.color];
  const completedToday = !!habit.completions[today];
  const CustomTooltip = ({
    active,
    payload,
    label






  }: {active?: boolean;payload?: {value: number;}[];label?: string;}) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg-card border border-border rounded px-2 py-1.5">
          <p className="text-[10px] font-mono text-muted">{label}</p>
          <p
            className="text-xs font-mono font-bold"
            style={{
              color: accent.hex
            }}>

            {payload[0].value}%
          </p>
        </div>);

    }
    return null;
  };
  return (
    <div className="min-h-screen bg-bg-primary pt-14">
      {/* Header */}
      <div className="border-b border-border bg-bg-primary px-4 py-4 sticky top-14 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-muted hover:text-foreground transition-colors p-1 -ml-1">

            <ArrowLeftIcon size={16} />
          </button>
          <span className="text-xl">{habit.icon}</span>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-foreground truncate">
              {habit.name}
            </h1>
            <p className="text-[11px] text-muted truncate">
              {habit.description}
            </p>
          </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleArchive}
                className={`p-1.5 rounded border transition-colors ${habit.archived ? 'border-accent-secondary/30 text-accent-secondary bg-accent-secondary/10 hover:bg-accent-secondary/20' : 'border-border text-muted hover:text-foreground hover:border-border-hover'}`}
              title={habit.archived ? 'Unarchive' : 'Archive'}>

              {habit.archived ?
              <ArchiveRestoreIcon size={13} /> :

              <ArchiveIcon size={13} />
              }
            </button>
            <button
              onClick={() => habitId && navigate(`/habit/${habitId}/edit`)}
              className="p-1.5 rounded border border-border text-muted hover:text-foreground hover:border-border-hover transition-colors">

              <EditIcon size={13} />
            </button>
            <button
              onClick={handleToggleCompletion}
              className={`px-3 py-1.5 rounded text-xs font-mono font-medium border transition-all duration-200 ${completedToday ? 'border-border text-muted bg-transparent' : 'text-bg-primary font-bold'}`}
              style={
              !completedToday ?
              {
                backgroundColor: accent.hex,
                borderColor: accent.hex,
                boxShadow: `0 0 16px ${accent.glow}`
              } :
              {}
              }>

              {completedToday ? '✓ Done' : 'Mark Done'}
            </button>
            <button
              type="button"
              onClick={toggleFreezeToday}
              className="px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-[0.3em] border border-border text-muted hover:border-accent hover:text-accent transition"
            >
              {isTodayFrozen ? 'Unfreeze today' : 'Freeze today'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-bg-secondary border border-border rounded-lg p-3">
            <div className="flex items-center gap-1 mb-2">
              <FlameIcon size={10} className="text-accent-secondary" />
              <span className="text-[9px] font-mono text-muted uppercase tracking-wider">
                Streak
              </span>
            </div>
            <div className="text-xl font-mono font-bold text-accent-secondary">
              {stats.currentStreak}
            </div>
            <div className="text-[9px] font-mono text-muted">days</div>
          </div>
          <div className="bg-bg-secondary border border-border rounded-lg p-3">
            <div className="flex items-center gap-1 mb-2">
              <TargetIcon
                size={10}
                style={{
                  color: accent.hex
                }} />

              <span className="text-[9px] font-mono text-muted uppercase tracking-wider">
                Best
              </span>
            </div>
            <div
              className="text-xl font-mono font-bold"
              style={{
                color: accent.hex
              }}>

              {stats.longestStreak}
            </div>
            <div className="text-[9px] font-mono text-muted">days</div>
          </div>
          <div className="bg-bg-secondary border border-border rounded-lg p-3">
            <div className="flex items-center gap-1 mb-2">
              <TrendingUpIcon size={10} className="text-accent-secondary" />
              <span className="text-[9px] font-mono text-muted uppercase tracking-wider">
                Rate
              </span>
            </div>
            <div className="text-xl font-mono font-bold text-accent-secondary">
              {stats.completionRate}%
            </div>
            <div className="text-[9px] font-mono text-muted">30 days</div>
          </div>
          <div className="bg-bg-secondary border border-border rounded-lg p-3">
            <div className="flex items-center gap-1 mb-2">
              <CalendarIcon size={10} className="text-muted" />
              <span className="text-[9px] font-mono text-muted uppercase tracking-wider">
                Total
              </span>
            </div>
            <div className="text-xl font-mono font-bold text-foreground">
              {stats.completedDays}
            </div>
            <div className="text-[9px] font-mono text-muted">days</div>
          </div>
        </div>

        <div className="bg-bg-secondary border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-mono text-muted uppercase tracking-[0.5em]">
              Daily reminder
            </div>
            {reminderInput && (
              <button
                type="button"
                onClick={clearReminder}
                className="text-[9px] font-mono uppercase tracking-wider text-muted hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="time"
              value={reminderInput}
              onChange={(event) => setReminderInput(event.target.value)}
              onBlur={handleReminderBlur}
              className="rounded-xl border border-border bg-bg-primary px-3 py-2 text-sm font-mono focus:border-accent/60 focus:outline-none focus:shadow-[0_0_16px_var(--glow)] transition"
            />
            <p className="text-[11px] text-muted">
              {reminderInput
                ? `You will be reminded at ${reminderInput}`
                : 'No reminder set.'}
            </p>
          </div>
        </div>

        {/* Completion ring + progress */}
        <div className="bg-bg-secondary border border-border rounded-lg p-4 flex items-center gap-4">
          <CompletionRing
            percentage={stats.completionRate}
            size={72}
            strokeWidth={5}
            color={habit.color}
            showText={true} />

          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-muted">
                Target streak
              </span>
              <span
                className="text-xs font-mono"
                style={{
                  color: accent.hex
                }}>

                {stats.currentStreak}/{habit.targetStreak}d
              </span>
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden mb-3">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, stats.currentStreak / habit.targetStreak * 100)}%`,
                  backgroundColor: accent.hex,
                  boxShadow: `0 0 8px ${accent.glow}`
                }} />

            </div>
            <div className="flex gap-2">
              {habit.tags.map((tag) =>
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border border-border bg-bg-card text-foreground">
                  <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: accent.hex }} />
                  {tag}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Heatmap */}
        <div className="bg-bg-secondary border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-mono text-muted uppercase tracking-wider">
              Activity — 26 weeks
            </h2>
            <span className="text-[10px] font-mono text-muted">
              {stats.completedDays} completions
            </span>
          </div>
          <div className="overflow-x-auto">
            <HeatmapGrid
              completions={habit.completions}
              color={habit.color}
              weeks={26} />

          </div>
        </div>

        {/* Trend chart */}
        <div className="bg-bg-secondary border border-border rounded-lg p-4">
          <h2 className="text-xs font-mono text-muted uppercase tracking-wider mb-4">
            Monthly completion rate
          </h2>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart
              data={stats.monthlyData}
              margin={{
                top: 4,
                right: 4,
                bottom: 0,
                left: -20
              }}>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false} />

              <XAxis
                dataKey="month"
                tick={{
                  fill: 'var(--text-muted)',
                  fontSize: 10,
                  fontFamily: 'JetBrains Mono'
                }}
                axisLine={false}
                tickLine={false} />

              <YAxis
                tick={{
                  fill: 'var(--text-muted)',
                  fontSize: 10,
                  fontFamily: 'JetBrains Mono'
                }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`} />

              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="rate"
                stroke={accent.hex}
                strokeWidth={2}
                dot={{
                  fill: accent.hex,
                  r: 3,
                  strokeWidth: 0
                }}
                activeDot={{
                  r: 5,
                  fill: accent.hex,
                  style: {
                    filter: `drop-shadow(0 0 6px ${accent.glow})`
                  }
                }}
                style={{
                  filter: `drop-shadow(0 0 4px ${accent.glow})`
                }} />

            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly bars */}
        <div className="bg-bg-secondary border border-border rounded-lg p-4">
          <h2 className="text-xs font-mono text-muted uppercase tracking-wider mb-3">
            Weekly completions
          </h2>
          <div className="flex items-end gap-1 h-16">
            {stats.weeklyData.map((w, i) =>
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                className="w-full rounded-sm transition-all"
                style={{
                  height: `${w.count / 7 * 100}%`,
                  minHeight: 2,
                  backgroundColor: accent.hex,
                  opacity: 0.4 + i / stats.weeklyData.length * 0.6,
                  boxShadow:
                  i === stats.weeklyData.length - 1 ?
                  `0 0 8px ${accent.glow}` :
                  'none'
                }} />

              </div>
            )}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] font-mono text-muted">12w ago</span>
            <span className="text-[9px] font-mono text-muted">
              this week
            </span>
          </div>
        </div>

        {/* Danger zone */}
        <div className="border border-border rounded-lg p-4">
          <h2 className="text-xs font-mono text-muted uppercase tracking-wider mb-3">
            Danger zone
          </h2>
          {!confirmDelete ?
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-2 text-xs font-mono text-accent hover:text-accent-secondary/80 border border-accent/20 hover:border-accent/40 px-3 py-2 rounded transition-colors">

              <TrashIcon size={12} />
              Delete habit
            </button> :

          <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-muted">
                Are you sure?
              </span>
              <button
              onClick={handleDelete}
              className="text-xs font-mono text-accent border border-accent/40 px-3 py-1.5 rounded hover:bg-accent/10 transition-colors">

                Delete
              </button>
              <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs font-mono text-muted border border-border px-3 py-1.5 rounded hover:text-foreground transition-colors">

                Cancel
              </button>
            </div>
          }
        </div>
      </div>
    </div>);

}
