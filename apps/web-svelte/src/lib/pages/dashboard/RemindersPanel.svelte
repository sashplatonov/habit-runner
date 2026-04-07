<script lang="ts">
  import { BellRing } from 'lucide-svelte';
  import ChartGuideTooltip from '$lib/components/ChartGuideTooltip.svelte';
  import type { Habit } from '$lib/types/habit';

  type Reminder = { id: string; habitId: string; time: string; message: string };

  let {
    reminders,
    habits,
    onToggle,
    onDismissReminder,
    onDisableReminder
  }: {
    reminders: Reminder[];
    habits: Habit[];
    onToggle: (habit: Habit) => Promise<void>;
    onDismissReminder: (reminderId: string) => void;
    onDisableReminder: (habit: Habit) => Promise<void>;
  } = $props();
</script>

{#if reminders.length > 0}
  <div class="max-w-2xl mx-auto px-4 py-3 space-y-2">
    <div class="flex items-center gap-2">
      <h2 class="text-xs font-mono text-muted uppercase tracking-wider">Reminders</h2>
      <ChartGuideTooltip
        title="Reminders"
        summary="This block surfaces habits that need attention right now, so you can act without hunting through the full dashboard."
        focusPoints={['Mark done: close the habit directly from the reminder.', 'Dismiss: hide the prompt for now without changing reminder settings.', 'Disable: stop future alerts if this reminder timing is no longer useful.']}
        variant="columns"
        triggerClassName="h-7 w-7"
      />
    </div>
    {#each reminders as reminder (reminder.id)}
      {@const habit = habits.find((h) => h.id === reminder.habitId)}
      {#if habit}
        <div class="flex flex-col gap-2 rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3">
          <div class="flex items-center gap-2">
            <BellRing size={16} class="text-accent-secondary" />
            <div class="text-sm font-semibold text-foreground">{reminder.message}</div>
            <span class="text-[10px] font-mono text-muted ml-auto">{reminder.time}</span>
          </div>
          <div class="flex gap-2">
            <button
              type="button"
              onclick={() => { void onToggle(habit); onDismissReminder(reminder.id); }}
              class="flex-1 rounded-full border border-accent px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.3em] text-accent hover:bg-accent/10 transition-colors"
            >
              Mark done
            </button>
            <button
              type="button"
              onclick={() => onDismissReminder(reminder.id)}
              class="flex-1 rounded-full border border-border px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.3em] text-muted hover:text-foreground hover:border-border-hover transition-colors"
            >
              Dismiss
            </button>
            <button
              type="button"
              onclick={() => void onDisableReminder(habit)}
              class="flex-1 rounded-full border border-destructive px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.3em] text-destructive hover:bg-destructive/10 transition-colors"
            >
              Disable
            </button>
          </div>
        </div>
      {/if}
    {/each}
  </div>
{/if}
