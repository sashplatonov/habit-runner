<script lang="ts">
  import { onMount } from 'svelte';
  import { BellRing } from 'lucide-svelte';
  import type { Habit } from '@/types/habit';
  import ChartGuideTooltip from '$lib/components/ChartGuideTooltip.svelte';
  import { isMandatoryToday } from '$lib/habits/schedule';
  import { habitsStore } from '$lib/stores/habits';
  import {
    addPendingReminder,
    getPendingReminders,
    removePendingReminder
  } from '$lib/storage/db';

  type Reminder = {
    id: string;
    habitId: string;
    time: string;
    message: string;
  };

  let reminders = $state<Reminder[]>([]);
  let reminderTracker: Record<string, string> = {};
  let reminderLastCheck: number | null = null;

  const activeHabits = $derived($habitsStore.habits);
  const allHabits = $derived($habitsStore.allHabits);
  const habitsById = $derived.by(() => new Map(allHabits.map((habit) => [habit.id, habit])));
  const visibleReminders = $derived(reminders.filter((reminder) => habitsById.has(reminder.habitId)));

  function isHabitCompletedToday(habit: Habit, today: string): boolean {
    if (habit.type === 'negative') {
      return (habit.completions[today] ?? 0) === 0;
    }
    return (habit.completions[today] ?? 0) >= Math.max(1, habit.dailyTarget ?? 1);
  }

  function parseReminderMinutes(value: string): number | null {
    const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    if (!match) {
      return null;
    }
    return Number(match[1]) * 60 + Number(match[2]);
  }

  function buildReminderMessage(habitName: string, reminderTime: string) {
    return `Reminder: ${habitName} (${reminderTime})`;
  }

  function dismissReminder(reminderId: string) {
    void removePendingReminder(reminderId).catch(() => undefined);
    reminders = reminders.filter((reminder) => reminder.id !== reminderId);
  }

  function notifyReminder(habit: Habit, today: string) {
    if (isHabitCompletedToday(habit, today)) {
      return;
    }
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }
    try {
      new Notification('Habbit reminder', {
        body: `Time for: ${habit.name}`,
        tag: `habit-reminder-${habit.id}`
      });
    } catch {
      // ignore browser notification errors
    }
  }

  async function restorePendingReminderState() {
    try {
      const pending = await getPendingReminders();
      reminders = pending.map((reminder) => ({
        id: reminder.id,
        habitId: reminder.habitId,
        time: reminder.reminderTime,
        message: buildReminderMessage(reminder.habitName, reminder.reminderTime)
      }));
    } catch {
      reminders = [];
    }
  }

  async function handleMarkDone(reminderId: string, habit: Habit) {
    const today = $habitsStore.formatDate(new Date());
    await habitsStore.incrementCompletionCount(habit.id, today);
    dismissReminder(reminderId);
  }

  async function handleDisableReminder(habit: Habit) {
    await habitsStore.updateHabit(habit.id, { reminderEnabled: false });
    const staleIds = reminders.filter((reminder) => reminder.habitId === habit.id).map((reminder) => reminder.id);
    reminders = reminders.filter((reminder) => reminder.habitId !== habit.id);
    await Promise.all(staleIds.map((id) => removePendingReminder(id).catch(() => undefined)));
    delete reminderTracker[habit.id];
  }

  async function checkReminders() {
    const nowTimestamp = Date.now();
    const now = new Date(nowTimestamp);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const nowDayKey = $habitsStore.formatDate(now);
    const previousTimestamp = reminderLastCheck ?? nowTimestamp;
    reminderLastCheck = nowTimestamp;

    const previous = new Date(previousTimestamp);
    const previousMinutes = previous.getHours() * 60 + previous.getMinutes();
    const previousDayKey = $habitsStore.formatDate(previous);
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const scheduledHabits = activeHabits.filter((habit) => isMandatoryToday(habit, todayDate));

    for (const habit of scheduledHabits) {
      if (!habit.reminderTime || habit.archived || habit.reminderEnabled === false) {
        continue;
      }
      if (reminderTracker[habit.id] === nowDayKey) {
        continue;
      }

      const reminderMinutes = parseReminderMinutes(habit.reminderTime);
      if (reminderMinutes === null) {
        continue;
      }

      const crossedReminderTime = previousDayKey === nowDayKey
        ? reminderMinutes > previousMinutes && reminderMinutes <= nowMinutes
        : nowMinutes >= reminderMinutes;

      if (!crossedReminderTime) {
        continue;
      }

      reminderTracker[habit.id] = nowDayKey;
      if (reminders.some((item) => item.habitId === habit.id)) {
        continue;
      }

      try {
        const reminderId = await addPendingReminder(habit.id, habit.name, habit.reminderTime);
        reminders = [
          ...reminders,
          {
            id: reminderId,
            habitId: habit.id,
            time: habit.reminderTime,
            message: buildReminderMessage(habit.name, habit.reminderTime)
          }
        ];
      } catch {
        // ignore reminder persistence errors and keep dashboard usable
      }

      notifyReminder(habit, nowDayKey);
    }
  }

  onMount(() => {
    void restorePendingReminderState().then(() => checkReminders());

    if (typeof window === 'undefined') {
      return;
    }

    const interval = window.setInterval(() => {
      void checkReminders();
    }, 30_000);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void checkReminders();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  });

  $effect(() => {
    const today = $habitsStore.formatDate(new Date());
    const stale = reminders.filter((reminder) => {
      const habit = habitsById.get(reminder.habitId);
      return !habit || habit.archived || isHabitCompletedToday(habit, today);
    });
    if (stale.length === 0) {
      return;
    }

    const staleIds = new Set(stale.map((reminder) => reminder.id));
    reminders = reminders.filter((reminder) => !staleIds.has(reminder.id));
    stale.forEach((reminder) => {
      void removePendingReminder(reminder.id).catch(() => undefined);
    });
  });
</script>

{#if visibleReminders.length > 0}
  <div class="mx-auto max-w-2xl space-y-2 px-4 py-3">
    <div class="flex items-center gap-2">
      <h2 class="text-xs font-mono uppercase tracking-wider text-muted">Reminders</h2>
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

    {#each visibleReminders as reminder (reminder.id)}
      {@const habit = habitsById.get(reminder.habitId)}
      {#if habit}
        <div class="flex flex-col gap-2 rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3">
          <div class="flex items-center gap-2">
            <BellRing size={16} class="text-accent-secondary" />
            <div class="text-sm font-semibold text-foreground">{reminder.message}</div>
            <span class="ml-auto text-[10px] font-mono text-muted">{reminder.time}</span>
          </div>

          <div class="flex gap-2">
            <button
              type="button"
              onclick={() => { void handleMarkDone(reminder.id, habit); }}
              class="flex-1 rounded-full border border-accent px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.3em] text-accent transition-colors hover:bg-accent/10"
            >
              Mark done
            </button>
            <button
              type="button"
              onclick={() => { dismissReminder(reminder.id); }}
              class="flex-1 rounded-full border border-border px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.3em] text-muted transition-colors hover:border-border-hover hover:text-foreground"
            >
              Dismiss
            </button>
            <button
              type="button"
              onclick={() => { void handleDisableReminder(habit); }}
              class="flex-1 rounded-full border border-destructive px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.3em] text-destructive transition-colors hover:bg-destructive/10"
            >
              Disable
            </button>
          </div>
        </div>
      {/if}
    {/each}
  </div>
{/if}
