<script lang="ts">
  let {
    reminderTime = $bindable(''),
    reminderEnabled = $bindable(true)
  }: {
    reminderTime: string;
    reminderEnabled: boolean;
  } = $props();
</script>

<div class="rounded-[1.75rem] border border-border bg-bg-card/92 p-5 shadow-[0_20px_54px_rgba(15,23,42,0.08)]">
  <label class="mb-2 block text-[10px] font-mono uppercase tracking-wider text-muted" for="habit-reminder">Reminder</label>
  <div class="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
    <input
      id="habit-reminder"
      type="time"
      bind:value={reminderTime}
      class="min-h-11 rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm font-mono transition focus:border-accent/60 focus:shadow-[0_0_12px_var(--glow)]"
    />
    <button
      type="button"
      class={`min-h-11 rounded-lg border px-3 py-2 text-[9px] font-mono uppercase tracking-wider transition ${reminderEnabled ? 'border-accent/40 bg-accent/10 text-accent' : 'border-border bg-bg-secondary text-muted hover:border-border-hover'}`}
      onclick={() => {
        reminderEnabled = !reminderEnabled;
      }}
    >
      {reminderEnabled ? 'Reminders enabled' : 'Reminders disabled'}
    </button>
    <span class="text-[11px] font-mono text-muted">{reminderTime ? `Daily at ${reminderTime}` : 'No reminder yet'}</span>
  </div>
  <p class="mt-1 text-[9px] font-mono text-muted">
    {reminderEnabled
      ? 'Reminder calls appear on the dashboard when the app is open.'
      : 'Notifications are disabled. Enable them to receive reminders.'}
  </p>
</div>
