import React from 'react';
import {
  ArrowLeftIcon,
  EditIcon,
  FlameIcon,
  TrendingUpIcon,
  CalendarIcon,
  TargetIcon,
  TrashIcon,
  ArchiveIcon,
  ArchiveRestoreIcon
} from 'lucide-react';
import { HeatmapGrid } from '@/components/HeatmapGrid';
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

type TimeFormat = '12' | '24';
type NotificationPermissionState = 'default' | 'denied' | 'granted';

const TIME_FORMATS: TimeFormat[] = ['24', '12'];

type HabitStats = {
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
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
  reminderInput: string;
  reminderDraft12: string;
  reminderDraft24: string;
  reminderError: string;
  timeFormat: TimeFormat;
  reminderEnabled: boolean;
  isReminderDirty: boolean;
  notificationSupported: boolean;
  notificationPermission: NotificationPermissionState;
  confirmDelete: boolean;
  isTodayFrozen: boolean;
  reminderDisplay: string;
  navigate: (to: string) => void;
  setTimeFormat: (format: TimeFormat) => void;
  setConfirmDelete: (value: boolean) => void;
  handleToggleArchive: () => void;
  handleToggleCompletion: () => Promise<void>;
  toggleFreezeToday: () => Promise<void>;
  handleToggleReminderEnabled: () => Promise<void>;
  clearReminder: () => Promise<void>;
  handleReminder24Change: (value: string) => void;
  handleReminder12Change: (value: string) => void;
  handleReminderBlur: () => void;
  handleReminderSave: () => Promise<void>;
  handleDelete: () => Promise<void>;
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

export function HabitDetailView({
  habitId,
  habit,
  stats,
  accent,
  completedToday,
  reminderInput,
  reminderDraft12,
  reminderDraft24,
  reminderError,
  timeFormat,
  reminderEnabled,
  isReminderDirty,
  notificationSupported,
  notificationPermission,
  confirmDelete,
  isTodayFrozen,
  reminderDisplay,
  navigate,
  setTimeFormat,
  setConfirmDelete,
  handleToggleArchive,
  handleToggleCompletion,
  toggleFreezeToday,
  handleToggleReminderEnabled,
  clearReminder,
  handleReminder24Change,
  handleReminder12Change,
  handleReminderBlur,
  handleReminderSave,
  handleDelete
}: HabitDetailViewProps) {
  return (
    <div className="min-h-screen bg-bg-primary pt-14">
      <div className="border-b border-border bg-bg-primary px-4 py-4 sticky top-14 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-muted hover:text-foreground transition-colors p-1 -ml-1">
            <ArrowLeftIcon size={16} />
          </button>
          <span className="text-xl">{habit.icon}</span>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-foreground truncate">{habit.name}</h1>
            <p className="text-[11px] text-muted truncate">{habit.description}</p>
          </div>
          <div className="flex items-center gap-2">
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
                void handleToggleCompletion();
              }}
              className={`px-3 py-1.5 rounded text-xs font-mono font-medium border transition-all duration-200 ${
                completedToday ? 'border-border text-muted bg-transparent' : 'text-bg-primary font-bold'
              }`}
              style={
                !completedToday
                  ? {
                      backgroundColor: accent.hex,
                      borderColor: accent.hex,
                      boxShadow: `0 0 16px ${accent.glow}`
                    }
                  : {}
              }
            >
              {completedToday ? '✓ Done' : 'Mark Done'}
            </button>
            <button
              type="button"
              onClick={() => {
                void toggleFreezeToday();
              }}
              className="px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-[0.3em] border border-border text-muted hover:border-accent hover:text-accent transition"
            >
              {isTodayFrozen ? 'Unfreeze today' : 'Freeze today'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-bg-secondary border border-border rounded-lg p-3">
            <div className="flex items-center gap-1 mb-2">
              <FlameIcon size={10} className="text-accent-secondary" />
              <span className="text-[9px] font-mono text-muted uppercase tracking-wider">Streak</span>
            </div>
            <div className="text-xl font-mono font-bold text-accent-secondary">{stats.currentStreak}</div>
            <div className="text-[9px] font-mono text-muted">days</div>
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
          </div>
          <div className="bg-bg-secondary border border-border rounded-lg p-3">
            <div className="flex items-center gap-1 mb-2">
              <TrendingUpIcon size={10} className="text-accent-secondary" />
              <span className="text-[9px] font-mono text-muted uppercase tracking-wider">Rate</span>
            </div>
            <div className="text-xl font-mono font-bold text-accent-secondary">{stats.completionRate}%</div>
            <div className="text-[9px] font-mono text-muted">30 days</div>
          </div>
          <div className="bg-bg-secondary border border-border rounded-lg p-3">
            <div className="flex items-center gap-1 mb-2">
              <CalendarIcon size={10} className="text-muted" />
              <span className="text-[9px] font-mono text-muted uppercase tracking-wider">Total</span>
            </div>
            <div className="text-xl font-mono font-bold text-foreground">{stats.completedDays}</div>
            <div className="text-[9px] font-mono text-muted">days</div>
          </div>
        </div>

        <div className="bg-bg-secondary border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-mono text-muted uppercase tracking-[0.5em]">Daily reminder</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  void handleToggleReminderEnabled();
                }}
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
                  onClick={() => {
                    void clearReminder();
                  }}
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
                    onChange={(event) => handleReminder24Change(event.target.value)}
                    onBlur={handleReminderBlur}
                    placeholder="HH:MM"
                    className="w-full rounded-xl border border-border bg-bg-primary px-3 py-2 text-sm font-mono focus:border-accent/60 focus:outline-none focus:shadow-[0_0_16px_var(--glow)] transition"
                  />
                ) : (
                  <input
                    type="text"
                    value={reminderDraft12}
                    onChange={(event) => handleReminder12Change(event.target.value)}
                    onBlur={handleReminderBlur}
                    placeholder="e.g. 7:30 PM"
                    className="w-full rounded-xl border border-border bg-bg-primary px-3 py-2 text-sm font-mono focus:border-accent/60 focus:outline-none focus:shadow-[0_0_16px_var(--glow)] transition"
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  void handleReminderSave();
                }}
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
            {reminderError && <p className="text-[9px] font-mono text-accent-secondary">{reminderError}</p>}
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
            <p className="text-[11px] text-muted">{reminderDisplay || 'No reminder set.'}</p>
          </div>
        </div>

        <div className="bg-bg-secondary border border-border rounded-lg p-4 flex items-center gap-4">
          <CompletionRing percentage={stats.completionRate} size={72} strokeWidth={5} color={habit.color} showText={true} />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-muted">Target streak</span>
              <span className="text-xs font-mono" style={{ color: accent.hex }}>
                {stats.currentStreak}/{habit.targetStreak}d
              </span>
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden mb-3">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, (stats.currentStreak / habit.targetStreak) * 100)}%`,
                  backgroundColor: accent.hex,
                  boxShadow: `0 0 8px ${accent.glow}`
                }}
              />
            </div>
            <div className="flex gap-2">
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

        <div className="bg-bg-secondary border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-mono text-muted uppercase tracking-wider">Activity - 26 weeks</h2>
            <span className="text-[10px] font-mono text-muted">{stats.completedDays} completions</span>
          </div>
          <div className="overflow-x-auto">
            <HeatmapGrid completions={habit.completions} color={habit.color} weeks={26} />
          </div>
        </div>

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
                activeDot={{
                  r: 5,
                  fill: accent.hex,
                  style: {
                    filter: `drop-shadow(0 0 6px ${accent.glow})`
                  }
                }}
                style={{ filter: `drop-shadow(0 0 4px ${accent.glow})` }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

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
          <div className="flex justify-between mt-1">
            <span className="text-[9px] font-mono text-muted">12w ago</span>
            <span className="text-[9px] font-mono text-muted">this week</span>
          </div>
        </div>

        <div className="border border-border rounded-lg p-4">
          <h2 className="text-xs font-mono text-muted uppercase tracking-wider mb-3">Danger zone</h2>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-2 text-xs font-mono text-accent hover:text-accent-secondary/80 border border-accent/20 hover:border-accent/40 px-3 py-2 rounded transition-colors"
            >
              <TrashIcon size={12} />
              Delete habit
            </button>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}
