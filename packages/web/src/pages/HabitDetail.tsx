import React, { useCallback, useEffect, useState } from 'react';
import { useHabits } from '@/hooks/useHabits';
import { HABIT_COLOR_THEMES } from '@/lib/theme/habit-colors';
import { useNavigate, useParams } from '@/lib/router';
import { useUndo } from '@/lib/undo';
import { HabitDetailView } from './components/HabitDetailView';

type TimeFormat = '12' | '24';
type NotificationPermissionState = 'default' | 'denied' | 'granted';

const formatTo12Hour = (value: string) => {
  if (!value) {
    return '';
  }
  const [hourStr, minuteStr] = value.split(':');
  const hourNumber = Number(hourStr);
  if (Number.isNaN(hourNumber)) {
    return value;
  }
  const period = hourNumber >= 12 ? 'PM' : 'AM';
  const normalizedHour = hourNumber % 12 === 0 ? 12 : hourNumber % 12;
  return `${normalizedHour}:${minuteStr} ${period}`;
};

const parseTwelveHourTime = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (!match) {
    return null;
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
    return null;
  }
  const suffix = match[3].toLowerCase();
  const normalizedHours = suffix === 'am' ? (hours === 12 ? 0 : hours) : hours === 12 ? 12 : hours + 12;
  return `${normalizedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const parseTwentyFourHourTime = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  const match = trimmed.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) {
    return null;
  }
  return `${match[1]}:${match[2]}`;
};

const formatReminderDisplay = (value: string, format: TimeFormat) => {
  if (!value) {
    return '';
  }
  return format === '12' ? formatTo12Hour(value) : value;
};

export function HabitDetail() {
  const navigate = useNavigate();
  const params = useParams();
  const habitId = params.id;
  const { allHabits, toggleCompletion, getHabitStats, deleteHabit, restoreHabit, updateHabit, formatDate } = useHabits();
  const { push } = useUndo();
  const habit = habitId ? allHabits.find((h) => h.id === habitId) : undefined;

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reminderInput, setReminderInput] = useState('');
  const [timeFormat, setTimeFormat] = useState<TimeFormat>('24');
  const [reminderDraft12, setReminderDraft12] = useState('');
  const [reminderDraft24, setReminderDraft24] = useState('');
  const [reminderError, setReminderError] = useState('');
  const [isReminderDirty, setIsReminderDirty] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [notificationSupported, setNotificationSupported] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermissionState>('default');

  const today = formatDate(new Date());
  const isTodayFrozen = habit ? habit.freezeDays.includes(today) : false;

  const handleDelete = useCallback(async () => {
    if (!habitId) {
      return;
    }
    const deleted = await deleteHabit(habitId);
    if (deleted) {
      push({
        message: `Habit "${deleted.name}" was deleted`,
        actionLabel: 'Restore',
        onUndo: async () => {
          await restoreHabit(deleted);
        }
      });
    }
    navigate('/');
  }, [deleteHabit, habitId, navigate, push, restoreHabit]);

  const handleToggleArchive = useCallback(() => {
    if (!habitId || !habit) {
      return;
    }
    updateHabit(habitId, { archived: !habit.archived });
  }, [habit, habitId, updateHabit]);

  const toggleFreezeToday = useCallback(async () => {
    if (!habitId || !habit) {
      return;
    }
    const nextFreezeDays = isTodayFrozen
      ? habit.freezeDays.filter((date) => date !== today)
      : [...habit.freezeDays, today];
    await updateHabit(habitId, { freezeDays: nextFreezeDays });
  }, [habit, habitId, isTodayFrozen, today, updateHabit]);

  useEffect(() => {
    setReminderInput(habit?.reminderTime ?? '');
  }, [habit?.reminderTime]);

  useEffect(() => {
    setReminderEnabled(habit?.reminderEnabled ?? true);
  }, [habit?.reminderEnabled]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const supported = 'Notification' in window;
    setNotificationSupported(supported);
    if (supported) {
      setNotificationPermission(Notification.permission as NotificationPermissionState);
    }
  }, []);

  useEffect(() => {
    setReminderDraft12(formatTo12Hour(reminderInput));
    setReminderDraft24(reminderInput);
    setIsReminderDirty(Boolean(habit?.reminderTime !== reminderInput));
  }, [habit?.reminderTime, reminderInput]);

  useEffect(() => {
    setReminderError('');
  }, [timeFormat]);

  const handleReminderSave = useCallback(async () => {
    if (!habitId || reminderError) {
      return;
    }
    if (habit?.reminderTime === reminderInput) {
      setIsReminderDirty(false);
      return;
    }
    await updateHabit(habitId, {
      reminderTime: reminderInput || undefined,
      reminderEnabled
    });
    setIsReminderDirty(false);
    setReminderError('');
  }, [habit?.reminderTime, habitId, reminderError, reminderInput, reminderEnabled, updateHabit]);

  const handleReminderBlur = useCallback(() => {
    void handleReminderSave();
  }, [handleReminderSave]);

  const clearReminder = useCallback(async () => {
    if (!habitId) {
      return;
    }
    setReminderInput('');
    setReminderError('');
    setReminderDraft12('');
    setReminderDraft24('');
    await updateHabit(habitId, {
      reminderTime: undefined,
      reminderEnabled
    });
  }, [habitId, reminderEnabled, updateHabit]);

  const handleToggleReminderEnabled = useCallback(async () => {
    if (!habitId) {
      return;
    }
    const nextValue = !reminderEnabled;
    setReminderEnabled(nextValue);
    setReminderError('');

    if (nextValue) {
      if (notificationSupported) {
        if (typeof window !== 'undefined' && 'Notification' in window && typeof Notification !== 'undefined') {
          const currentPermission = Notification.permission as NotificationPermissionState;
          if (currentPermission === 'default') {
            const result = await Notification.requestPermission();
            setNotificationPermission(result as NotificationPermissionState);
            if (result !== 'granted') {
              setReminderError('Allow browser notifications to receive reminders');
            }
          } else if (currentPermission === 'denied') {
            setNotificationPermission(currentPermission);
            setReminderError('Browser notifications are blocked. Enable them in your settings');
          } else {
            setNotificationPermission(currentPermission);
          }
        }
      } else {
        setReminderError('Your browser does not support notifications');
      }
    }

    await updateHabit(habitId, { reminderEnabled: nextValue });
  }, [habitId, notificationSupported, reminderEnabled, updateHabit]);

  const handleReminder24Change = useCallback((value: string) => {
    setReminderDraft24(value);
    const parsed = parseTwentyFourHourTime(value);
    if (parsed === null) {
      if (value.trim()) {
        setReminderError('Use format like 19:30');
      }
      return;
    }
    setReminderError('');
    setReminderInput(parsed);
  }, []);

  const handleReminder12Change = useCallback((value: string) => {
    setReminderDraft12(value);
    const parsed = parseTwelveHourTime(value);
    if (parsed === null) {
      if (value.trim()) {
        setReminderError('Use format like 7:30 PM');
      }
      return;
    }
    setReminderError('');
    setReminderInput(parsed);
  }, []);

  const handleToggleCompletion = useCallback(async () => {
    if (!habitId || !habit) {
      return;
    }
    const wasDone = habit.completions[today];
    await toggleCompletion(habitId, today);
    push({
      message: wasDone ? `Unchecked: ${habit.name}` : `Checked: ${habit.name}`,
      actionLabel: 'Undo',
      onUndo: async () => {
        await toggleCompletion(habitId, today);
      }
    });
  }, [habit, habitId, push, today, toggleCompletion]);

  if (!habit || !habitId) {
    return (
      <div className="min-h-screen bg-bg-primary pt-14 flex items-center justify-center">
        <div className="text-muted font-mono">Habit not found</div>
      </div>
    );
  }

  const stats = getHabitStats(habitId);
  const accent = HABIT_COLOR_THEMES[habit.color];
  const completedToday = !!habit.completions[today];
  const reminderDisplay = reminderInput
    ? `You will be reminded at ${formatReminderDisplay(reminderInput, timeFormat)}`
    : '';

  return (
    <HabitDetailView
      habitId={habitId}
      habit={habit}
      stats={stats}
      accent={accent}
      completedToday={completedToday}
      reminderInput={reminderInput}
      reminderDraft12={reminderDraft12}
      reminderDraft24={reminderDraft24}
      reminderError={reminderError}
      timeFormat={timeFormat}
      reminderEnabled={reminderEnabled}
      isReminderDirty={isReminderDirty}
      notificationSupported={notificationSupported}
      notificationPermission={notificationPermission}
      confirmDelete={confirmDelete}
      isTodayFrozen={isTodayFrozen}
      reminderDisplay={reminderDisplay}
      navigate={navigate}
      setTimeFormat={setTimeFormat}
      setConfirmDelete={setConfirmDelete}
      handleToggleArchive={handleToggleArchive}
      handleToggleCompletion={handleToggleCompletion}
      toggleFreezeToday={toggleFreezeToday}
      handleToggleReminderEnabled={handleToggleReminderEnabled}
      clearReminder={clearReminder}
      handleReminder24Change={handleReminder24Change}
      handleReminder12Change={handleReminder12Change}
      handleReminderBlur={handleReminderBlur}
      handleReminderSave={handleReminderSave}
      handleDelete={handleDelete}
    />
  );
}
