import { PlusIcon } from 'lucide-react';
import type { AddEditHabitModel } from '@/pages/hooks/useAddEditHabitModel';

export function SoftLimitWarningModal({
  visible,
  onBack,
  onConfirm
}: {
  visible: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-bg-primary/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-bg-secondary border border-border rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
          <PlusIcon className="text-accent" size={24} />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Focus is key</h3>
        <p className="text-sm text-muted mb-6 leading-relaxed">
          Research shows that starting with more than 3 habits simultaneously reduces the success rate by 80%.
          <br /><br />
          We recommend reaching a <span className="text-accent font-bold">14-day streak</span> with your current habits before adding more.
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onBack}
            className="w-full py-3 rounded-2xl bg-bg-primary border border-border text-sm font-semibold hover:bg-bg-card transition"
          >
            Go back & focus
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="w-full py-3 rounded-2xl text-[10px] font-mono uppercase tracking-widest text-muted hover:text-foreground transition"
          >
            I understand, add anyway
          </button>
        </div>
      </div>
    </div>
  );
}

export function ReminderSection({
  reminderEnabled,
  toggleReminderEnabled,
  reminderTime,
  setReminderTime
}: {
  reminderEnabled: boolean;
  toggleReminderEnabled: () => void;
  reminderTime: string;
  setReminderTime: AddEditHabitModel['setReminderTime'];
}) {
  return (
    <div>
      <label className="block text-[10px] font-mono text-muted uppercase tracking-wider mb-2">Reminder</label>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="time"
          value={reminderTime}
          onChange={(event) => setReminderTime(event.target.value)}
          className="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm font-mono focus:border-accent/60 focus:outline-none focus:shadow-[0_0_12px_var(--glow)] transition"
        />
        <button
          type="button"
          onClick={toggleReminderEnabled}
          className={`px-3 py-1.5 rounded-lg border text-[9px] font-mono uppercase tracking-wider transition ${
            reminderEnabled
              ? 'border-accent/40 bg-accent/10 text-accent'
              : 'border-border bg-bg-secondary text-muted hover:border-border-hover'
          }`}
        >
          {reminderEnabled ? 'Reminders enabled' : 'Reminders disabled'}
        </button>
        <span className="text-[11px] font-mono text-muted">{reminderTime ? `Daily at ${reminderTime}` : 'No reminder yet'}</span>
      </div>
      <p className="text-[9px] font-mono text-muted mt-1">
        {reminderEnabled
          ? 'Reminder calls appear on the dashboard when the app is open.'
          : 'Notifications are disabled. Enable them to receive reminders.'}
      </p>
    </div>
  );
}
