<script lang="ts">
  import { Bell, Clock } from 'lucide-svelte';

  let {
    reminderTime = $bindable(''),
    reminderEnabled = $bindable(true)
  }: {
    reminderTime: string;
    reminderEnabled: boolean;
  } = $props();

  const timeSummary = $derived(reminderTime ? `Daily at ${reminderTime}` : 'No reminder time configured');
  const stateSummary = $derived(reminderEnabled ? 'Reminder currently enabled' : 'Reminder currently disabled');
  const notice = $derived(reminderEnabled
    ? 'Reminder calls appear on the dashboard when the app is open. Enable notifications in app or system settings to receive reminders.'
    : 'Notifications are disabled. Enable them in app or system settings to receive reminders.');
</script>

<section
  class="rounded-surface border border-border bg-bg-card shadow-surface p-4 sm:p-5"
  aria-labelledby="habit-reminder-title"
  data-editor-reminder
  data-testid="habit-reminder-panel"
>
  <div class="flex items-start justify-between gap-3">
    <div class="min-w-0">
      <h2 id="habit-reminder-title" class="text-[10px] font-mono uppercase tracking-[0.18em] text-muted">Reminder</h2>
      <p class="mt-1 text-[13px] leading-5 text-muted">Optional time to prompt the habit.</p>
    </div>
    <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-500">
      <Bell size={18} strokeWidth={1.8} aria-hidden="true" />
    </span>
  </div>

  <div class="mt-4 space-y-2">
    <label id="habit-reminder-time-label" for="habit-reminder" class="text-[10px] font-mono uppercase tracking-[0.18em] text-muted">Reminder time</label>
    <div class="flex items-center gap-2">
      <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-bg-primary text-muted" aria-hidden="true">
        <Clock size={16} strokeWidth={1.8} />
      </span>
      <input
        id="habit-reminder"
        type="time"
        name="habit-reminder"
        autocomplete="off"
        aria-labelledby="habit-reminder-time-label"
        bind:value={reminderTime}
        class="min-h-11 flex-1 rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm font-mono text-foreground transition focus:border-accent/60"
        data-editor-reminder-time
      />
    </div>
  </div>

  <div class="mt-3 space-y-2">
    <div class="flex items-center gap-2 rounded-lg border border-border bg-bg-secondary px-3 py-2 text-[11px] leading-4 text-muted" data-editor-reminder-summary data-testid="habit-reminder-summary">
      <div class="min-w-0 flex-1">
        <span class="block font-semibold text-foreground">{timeSummary}</span>
        <span class="mt-0.5 block">{stateSummary}</span>
      </div>
      <button
        type="button"
        class={`min-h-11 shrink-0 rounded-lg border px-2 text-[10px] font-mono uppercase tracking-wider transition ${reminderEnabled ? 'border-accent/40 bg-accent/10 text-accent' : 'border-border bg-bg-primary text-muted hover:border-border-hover'}`}
        aria-pressed={reminderEnabled}
        data-editor-reminder-toggle
        onclick={() => {
          reminderEnabled = !reminderEnabled;
        }}
      >
        {reminderEnabled ? 'Reminders enabled' : 'Reminders disabled'}
      </button>
    </div>
    <p class="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-[11px] leading-4 text-muted" data-editor-reminder-notice data-testid="habit-reminder-notice">
      {notice}
    </p>
  </div>
</section>
