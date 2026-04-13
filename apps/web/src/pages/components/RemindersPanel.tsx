import { BellRingIcon } from 'lucide-react';
import { ChartGuideTooltip } from '@/components/ChartGuideTooltip';
import type { DashboardViewProps } from './DashboardHero';

export function RemindersPanel({
  reminders,
  habits,
  handleToggle,
  handleDismissReminder,
  handleDisableReminder
}: Pick<DashboardViewProps, 'reminders' | 'habits' | 'handleToggle' | 'handleDismissReminder' | 'handleDisableReminder'>) {
  if (!reminders.length) {
    return null;
  }
  return (
    <div className="max-w-2xl mx-auto px-4 py-3 space-y-2">
      <div className="flex items-center gap-2">
        <h2 className="text-xs font-mono text-muted uppercase tracking-wider">Reminders</h2>
        <ChartGuideTooltip
          title="Reminders"
          summary="This block surfaces habits that need attention right now, so you can act without hunting through the full dashboard."
          focusPoints={[
            'Mark done: close the habit directly from the reminder.',
            'Dismiss: hide the prompt for now without changing reminder settings.',
            'Disable: stop future alerts if this reminder timing is no longer useful.'
          ]}
          variant="columns"
          triggerClassName="h-7 w-7"
        />
      </div>
      {reminders.map((reminder) => {
        const habit = habits.find((item) => item.id === reminder.habitId);
        if (!habit) {
          return null;
        }
        return (
          <div key={reminder.id} className="flex flex-col gap-2 rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <BellRingIcon size={16} className="text-accent-secondary" />
              <div className="text-sm font-semibold text-foreground">{reminder.message}</div>
              <span className="text-[10px] font-mono text-muted ml-auto">{reminder.time}</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  void handleToggle(habit);
                  handleDismissReminder(reminder.id);
                }}
                className="flex-1 rounded-full border border-accent px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.3em] text-accent hover:bg-accent/10 transition-colors"
              >
                Mark done
              </button>
              <button
                type="button"
                onClick={() => handleDismissReminder(reminder.id)}
                className="flex-1 rounded-full border border-border px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.3em] text-muted hover:text-foreground hover:border-border-hover transition-colors"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => void handleDisableReminder(habit)}
                className="flex-1 rounded-full border border-destructive px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.3em] text-destructive hover:bg-destructive/10 transition-colors"
              >
                Disable
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
