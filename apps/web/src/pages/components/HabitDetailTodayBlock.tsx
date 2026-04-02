import { ChartGuideTooltip } from '@/components/ChartGuideTooltip';
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
      <div className="mb-2 flex items-center gap-2">
        <div className="text-[11px] font-mono text-muted uppercase tracking-[0.5em]">Today</div>
        <ChartGuideTooltip
          title="Today progress"
          summary="This block tells you how much of today's quota is already complete for this habit and whether you still need more repetitions."
          focusPoints={[
            'Current count versus target: how far you are from done today.',
            'Use the +1 and -1 controls above to correct today instantly.',
            'If the target is higher than 1, keep logging until the quota is filled.'
          ]}
          variant="bars"
          triggerClassName="h-7 w-7"
        />
      </div>
      <p className="text-sm text-foreground">
        Completed <span className="font-mono font-bold" style={{ color: accent.hex }}>{todayCompletionCount}</span> / {dailyTarget} today.
      </p>
      <p className="text-[11px] text-muted mt-1">Reminder settings are available on the edit screen.</p>
    </div>
  );
}
