import { useCallback, useEffect, useRef, useState } from 'react';
import type { Habit } from '@/types/habit';

export interface Reminder {
  habitId: string;
  time: string;
  message: string;
}

export function useReminderTracker(
  habits: Habit[],
  formatDate: (date: Date) => string,
  notify: (habit: Habit) => void
) {
  const reminderTracker = useRef<Record<string, string>>({});
  const reminderLastCheckRef = useRef<number | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const handleDismissReminder = useCallback((habitId: string) => {
    setReminders((prev) => prev.filter((reminder) => reminder.habitId !== habitId));
  }, []);

  useEffect(() => {
    setReminders((prev) => prev.filter((reminder) => habits.some((habit) => habit.id === reminder.habitId)));
  }, [habits]);

  useEffect(() => {
    const checkReminders = () => {
      const nowTs = Date.now();
      const now = new Date(nowTs);
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const nowDayKey = formatDate(now);
      const previousTs = reminderLastCheckRef.current ?? nowTs;
      reminderLastCheckRef.current = nowTs;
      const previous = new Date(previousTs);
      const previousMinutes = previous.getHours() * 60 + previous.getMinutes();
      const previousDayKey = formatDate(previous);

      habits.forEach((habit) => {
        if (!habit.reminderTime || habit.archived || habit.reminderEnabled === false) {
          return;
        }
        if (reminderTracker.current[habit.id] === nowDayKey) {
          return;
        }

        const reminderMinutes = parseReminderMinutes(habit.reminderTime);
        if (reminderMinutes === null) {
          return;
        }

        const crossedReminderTime =
          previousDayKey === nowDayKey
            ? reminderMinutes > previousMinutes && reminderMinutes <= nowMinutes
            : nowMinutes >= reminderMinutes;

        if (!crossedReminderTime) {
          return;
        }

        reminderTracker.current[habit.id] = nowDayKey;
        setReminders((prev) =>
          prev.some((item) => item.habitId === habit.id)
            ? prev
            : [
                ...prev,
                {
                  habitId: habit.id,
                  time: habit.reminderTime!,
                  message: `Reminder: ${habit.name} (${habit.reminderTime})`
                }
              ]
        );
        notify(habit);
      });
    };

    checkReminders();
    if (typeof window === 'undefined') {
      return;
    }

    const interval = window.setInterval(checkReminders, 30_000);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkReminders();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [formatDate, habits, notify]);

  return {
    reminders,
    handleDismissReminder
  };
}

function parseReminderMinutes(value: string): number | null {
  const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) {
    return null;
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours * 60 + minutes;
}
