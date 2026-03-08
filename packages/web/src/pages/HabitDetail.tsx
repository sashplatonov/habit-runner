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

type TimeFormat = '12' | '24';
type NotificationPermissionState = 'default' | 'denied' | 'granted';

const formatTo12Hour = (value: string) => {
  if (!value) {
    return '';
  }
  const [hourStr, minuteStr] = value.split(':');
  const hourNumber = Number(hourStr);
  if (Number.isNaN(hourNumber)) {
    return value;
  }
  const period = hourNumber >= 12 ? 'PM' : 'AM';
  const normalizedHour = hourNumber % 12 === 0 ? 12 : hourNumber % 12;
  return `${normalizedHour}:${minuteStr} ${period}`;
};

const parseTwelveHourTime = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (!match) {
    return null;
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
    return null;
  }
  const suffix = match[3].toLowerCase();
  const normalizedHours =
    suffix === 'am' ? (hours === 12 ? 0 : hours) : (hours === 12 ? 12 : hours + 12);
  return `${normalizedHours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}`;
};

const parseTwentyFourHourTime = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  const match = trimmed.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) {
    return null;
  }
  return `${match[1]}:${match[2]}`;
};

const formatReminderDisplay = (value: string, format: TimeFormat) => {
  if (!value) {
    return '';
  }
  return format === '12' ? formatTo12Hour(value) : value;
};

const TIME_FORMATS: TimeFormat[] = ['24', '12'];
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
  const [timeFormat, setTimeFormat] = useState<TimeFormat>('24');
  const [reminderDraft12, setReminderDraft12] = useState('');
  const [reminderDraft24, setReminderDraft24] = useState('');
  const [reminderError, setReminderError] = useState('');
  const [isReminderDirty, setIsReminderDirty] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [notificationSupported, setNotificationSupported] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermissionState>('default');
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

  useEffect(() => {
    setReminderEnabled(habit?.reminderEnabled ?? true);
  }, [habit?.reminderEnabled]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const supported = 'Notification' in window;
    setNotificationSupported(supported);
    if (supported) {
      setNotificationPermission(Notification.permission as NotificationPermissionState);
    }
  }, []);

  useEffect(() => {
    setReminderDraft12(formatTo12Hour(reminderInput));
  }, [reminderInput]);
  useEffect(() => {
    setReminderDraft24(reminderInput);
  }, [reminderInput]);

  useEffect(() => {
    setIsReminderDirty(Boolean(habit?.reminderTime !== reminderInput));
  }, [habit?.reminderTime, reminderInput]);

  useEffect(() => {
    setReminderError('');
  }, [timeFormat]);
  const handleReminderSave = useCallback(async () => {
    if (!habitId || reminderError) {
      return;
    }
    if (habit?.reminderTime === reminderInput) {
      setIsReminderDirty(false);
      return;
    }
    await updateHabit(habitId, {
      reminderTime: reminderInput || undefined,
      reminderEnabled
    });
    setIsReminderDirty(false);
    setReminderError('');
  }, [habit?.reminderTime, habitId, reminderError, reminderInput, reminderEnabled, updateHabit]);
  const handleReminderBlur = useCallback(() => {
    void handleReminderSave();
  }, [handleReminderSave]);
  const clearReminder = useCallback(async () => {
    if (!habitId) {
      return;
    }
    setReminderInput('');
    setReminderError('');
    setReminderDraft12('');
    setReminderDraft24('');
    await updateHabit(habitId, {
      reminderTime: undefined,
      reminderEnabled
    });
  }, [habitId, reminderEnabled, updateHabit]);

  const handleToggleReminderEnabled = useCallback(async () => {
    if (!habitId) {
      return;
    }
    const nextValue = !reminderEnabled;
    setReminderEnabled(nextValue);
    setReminderError('');

    if (nextValue) {
      if (notificationSupported) {
        if (
          typeof window !== 'undefined' &&
          'Notification' in window &&
          typeof Notification !== 'undefined'
        ) {
          const currentPermission =
            Notification.permission as NotificationPermissionState;
          if (currentPermission === 'default') {
            const result = await Notification.requestPermission();
            setNotificationPermission(result as NotificationPermissionState);
            if (result !== 'granted') {
              setReminderError(
                'Allow browser notifications to receive reminders'
              );
            }
          } else if (currentPermission === 'denied') {
            setNotificationPermission(currentPermission);
            setReminderError(
              'Browser notifications are blocked. Enable them in your settings'
            );
          } else {
            setNotificationPermission(currentPermission);
          }
        }
      } else {
        setReminderError('Your browser does not support notifications');
      }
    }

    await updateHabit(habitId, { reminderEnabled: nextValue });
  }, [
    habitId,
    notificationSupported,
    reminderEnabled,
    updateHabit
  ]);

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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleReminderEnabled}
                className={`px-3 py-1.5 rounded-lg border text-[9px] font-mono uppercase tracking-wider transition ${
                  reminderEnabled
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-border bg-bg-primary text-muted hover:border-border-hover'
                }`}
              >
                {reminderEnabled ? 'Notifications enabled' : 'Notifications disabled'}
              </button>
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
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-1">
                {TIME_FORMATS.map((format) => (
                  <button
                    key={format}
                    type="button"
                    onClick={() => setTimeFormat(format)}
                    className={`px-2 py-1 rounded border text-[10px] font-mono uppercase tracking-wider transition ${
                      timeFormat === format
                        ? 'border-accent/40 bg-accent/10 text-accent'
                        : 'border-border bg-bg-primary text-muted hover:border-border-hover'
                    }`}
                  >
                    {format === '24' ? '24h' : '12h'}
                  </button>
                ))}
              </div>
              <div className="flex-1 min-w-[170px]">
                {timeFormat === '24' ? (
                  <input
                    type="text"
                    value={reminderDraft24}
                    onChange={(event) => {
                      const value = event.target.value;
                      setReminderDraft24(value);
                      const parsed = parseTwentyFourHourTime(value);
                      if (parsed === null) {
                        if (value.trim()) {
                          setReminderError('Use format like 19:30');
                        }
                        return;
                      }
                      setReminderError('');
                      setReminderInput(parsed);
                    }}
                    onBlur={handleReminderBlur}
                    placeholder="HH:MM"
                    className="w-full rounded-xl border border-border bg-bg-primary px-3 py-2 text-sm font-mono focus:border-accent/60 focus:outline-none focus:shadow-[0_0_16px_var(--glow)] transition"
                  />
                ) : (
                  <input
                    type="text"
                    value={reminderDraft12}
                    onChange={(event) => {
                      const value = event.target.value;
                      setReminderDraft12(value);
                      const parsed = parseTwelveHourTime(value);
                      if (parsed === null) {
                        if (value.trim()) {
                          setReminderError('Use format like 7:30 PM');
                        }
                        return;
                      }
                      setReminderError('');
                      setReminderInput(parsed);
                    }}
                    onBlur={handleReminderBlur}
                    placeholder="e.g. 7:30 PM"
                    className="w-full rounded-xl border border-border bg-bg-primary px-3 py-2 text-sm font-mono focus:border-accent/60 focus:outline-none focus:shadow-[0_0_16px_var(--glow)] transition"
                  />
                )}
              </div>
              <button
                type="button"
                onClick={handleReminderSave}
                disabled={!isReminderDirty || Boolean(reminderError)}
                className="px-3 py-1.5 rounded-lg border border-border text-[9px] font-mono uppercase tracking-wider transition-colors disabled:opacity-40 disabled:border-border disabled:text-muted"
                style={
                  isReminderDirty && !reminderError
                    ? {
                        backgroundColor: accent.hex,
                        color: '#fff',
                        boxShadow: `0 0 12px ${accent.glow}`
                      }
                    : undefined
                }
              >
                Save changes
              </button>
            </div>
            {reminderError && (
              <p className="text-[9px] font-mono text-accent-secondary">
                {reminderError}
              </p>
            )}
            {!reminderError && (
              <p className="text-[9px] font-mono text-muted">
                {notificationSupported
                  ? notificationPermission === 'granted'
                    ? 'Browser notifications are enabled'
                    : notificationPermission === 'denied'
                      ? 'Notifications are blocked. Enable them in your browser'
                      : 'Click "Notifications enabled" to grant permission'
                  : 'Your browser does not support notifications'}
              </p>
            )}
            <p className="text-[11px] text-muted">
              {reminderInput
                ? `You will be reminded at ${formatReminderDisplay(
                    reminderInput,
                    timeFormat
                  )}`
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
