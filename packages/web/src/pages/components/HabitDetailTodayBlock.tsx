import type { HabitColorTheme } from '@/lib/theme/habit-colors';

export function TodayBlock({
  dailyTarget,
  todayCompletionCount,
  accent
}: {
  dailyTarget: number;
  todayCompletionCount: number;
  accent: HabitColorTheme;
}) {
  return (
    <div className="bg-bg-secondary border border-border rounded-2xl p-4">
      <div className="text-[11px] font-mono text-muted uppercase tracking-[0.5em] mb-2">Today</div>
      <p className="text-sm text-foreground">
        Completed <span className="font-mono font-bold" style={{ color: accent.hex }}>{todayCompletionCount}</span> / {dailyTarget} today.
      </p>
      <p className="text-[11px] text-muted mt-1">Reminder settings are available on the edit screen.</p>
    </div>
  );
}
