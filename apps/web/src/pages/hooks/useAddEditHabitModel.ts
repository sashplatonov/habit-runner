import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from '@/lib/router';
import { useHabits } from '@/hooks/useHabits';
import type { Habit } from '@/types/habit';
import type { HabitColor, HabitFrequency, HabitSchedule } from '@habbit-runner/shared';
import { COLORS } from '../components/add-edit-habit.constants';
import { normalizeSchedule, scheduleFromLegacy } from '@habbit-runner/shared';
import { calculateScheduledStreak } from '@/lib/habits/schedule';
import { invokeIfFunction } from '@/lib/callback';

const TARGET_STREAK_OPTIONS = [7, 14, 21, 30, 60, 90, 180, 365];

export type HabitUpsertInput = Omit<Habit, 'id' | 'completions' | 'createdAt'> & {
  sortOrder?: number;
  reminderTime?: string | null;
  reminderEnabled?: boolean;
  schedule?: HabitSchedule;
};

export type AddEditHabitModel = {
  habitId?: string;
  isEdit: boolean;
  hasExisting: boolean;
  shouldShowLoading: boolean;
  showSoftLimitWarning: boolean;
  acknowledgeSoftLimit: () => void;
  name: string;
  setName: React.Dispatch<React.SetStateAction<string>>;
  description: string;
  setDescription: React.Dispatch<React.SetStateAction<string>>;
  color: HabitColor;
  setColor: React.Dispatch<React.SetStateAction<HabitColor>>;
  icon: string;
  setIcon: React.Dispatch<React.SetStateAction<string>>;
  frequency: HabitFrequency;
  setFrequency: React.Dispatch<React.SetStateAction<HabitFrequency>>;
  customDays: number[];
  toggleCustomDay: (day: number) => void;
  targetStreak: number;
  setTargetStreak: React.Dispatch<React.SetStateAction<number>>;
  canDecreaseStreak: boolean;
  canIncreaseStreak: boolean;
  decreaseTargetStreak: () => void;
  increaseTargetStreak: () => void;
  dailyTarget: number;
  setDailyTarget: React.Dispatch<React.SetStateAction<number>>;
  type: 'positive' | 'negative';
  setType: React.Dispatch<React.SetStateAction<'positive' | 'negative'>>;
  tags: string[];
  tagInput: string;
  setTagInput: React.Dispatch<React.SetStateAction<string>>;
  reminderTime: string;
  setReminderTime: React.Dispatch<React.SetStateAction<string>>;
  reminderEnabled: boolean;
  toggleReminderEnabled: () => void;
  selectedColor: (typeof COLORS)[number];
  schedule: HabitSchedule;
  setSchedule: React.Dispatch<React.SetStateAction<HabitSchedule>>;
  errors: Record<string, string>;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  handleSubmit: () => Promise<void>;
  handleBack: () => void;
};

export function useAddEditHabitModel(): AddEditHabitModel {
  const navigate = useNavigate();
  const params = useParams();
  const habitId = params.id;
  const { allHabits, addHabit, updateHabit } = useHabits();
  const isEdit = Boolean(habitId);
  const existing = habitId ? allHabits.find((habit) => habit.id === habitId) : undefined;
  const hasExisting = Boolean(existing);

  const formState = useHabitFormState(existing, isEdit);
  const handlers = useHabitHandlers({
    ...formState,
    existing,
    habitId,
    isEdit,
    addHabit,
    updateHabit,
    navigate
  });

  const [hasAcknowledgedLimit, setHasAcknowledgedLimit] = useState(false);
  const isOverLimitCheck = !isEdit && allHabits.length >= 3 && !allHabits.some(h => calculateScheduledStreak(h, h.completions).current >= 14);
  const showSoftLimitWarning = isOverLimitCheck && !hasAcknowledgedLimit;
  const acknowledgeSoftLimit = useCallback(() => setHasAcknowledgedLimit(true), []);

  return {
    habitId,
    isEdit,
    hasExisting,
    shouldShowLoading: shouldShowEditLoading(isEdit, hasExisting),
    showSoftLimitWarning,
    acknowledgeSoftLimit,
    ...formState,
    ...handlers
  };
}

// This hook intentionally centralizes form hydration and field defaults in one place.
// eslint-disable-next-line complexity
function useHabitFormState(existing?: Habit, isEdit?: boolean) {
  const [name, setName] = useState(existing?.name || '');
  const [description, setDescription] = useState(existing?.description || '');
  const [color, setColor] = useState<HabitColor>(existing?.color || 'blue');
  const [icon, setIcon] = useState(existing?.icon || '⚡');
  const [frequency, setFrequency] = useState<HabitFrequency>(existing?.frequency || 'daily');
  const [customDays, setCustomDays] = useState<number[]>(existing?.customDays || [1, 2, 3, 4, 5]);
  const [schedule, setSchedule] = useState<HabitSchedule>(
    normalizeSchedule(existing?.schedule) ??
      scheduleFromLegacy(existing?.frequency ?? 'daily', existing?.customDays)
  );
  const [targetStreak, setTargetStreak] = useState(getClosestStreakTick(existing?.targetStreak ?? 21));
  const [dailyTarget, setDailyTarget] = useState(existing?.dailyTarget ?? 1);
  const [type, setType] = useState<'positive' | 'negative'>(existing?.type || 'positive');
  const [tags, setTags] = useState<string[]>(existing?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [reminderTime, setReminderTime] = useState(existing?.reminderTime || '');
  const [reminderEnabled, setReminderEnabled] = useState(existing?.reminderEnabled ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isEdit || !existing) {
      return;
    }
    setName(existing.name);
    setDescription(existing.description ?? '');
    setColor(existing.color);
    setIcon(existing.icon);
    setFrequency(existing.frequency);
    setCustomDays(existing.customDays ?? [1, 2, 3, 4, 5]);
    setSchedule(
      normalizeSchedule(existing.schedule) ??
        scheduleFromLegacy(existing.frequency, existing.customDays)
    );
    setTargetStreak(getClosestStreakTick(existing.targetStreak));
    setDailyTarget(existing.dailyTarget ?? 1);
    setType(existing.type || 'positive');
    setTags(existing.tags ?? []);
    setTagInput('');
    setReminderTime(existing.reminderTime ?? '');
    setReminderEnabled(existing.reminderEnabled ?? true);
  }, [existing, isEdit]);

  const selectedColor = useMemo(
    () => getColorOption(color),
    [color]
  );

  const currentStreakIndex = Math.max(0, TARGET_STREAK_OPTIONS.indexOf(targetStreak));
  const canDecreaseStreak = currentStreakIndex > 0;
  const canIncreaseStreak = currentStreakIndex < TARGET_STREAK_OPTIONS.length - 1;

  const decreaseTargetStreak = useCallback(() => {
    if (!canDecreaseStreak) {
      return;
    }
    setTargetStreak(TARGET_STREAK_OPTIONS[currentStreakIndex - 1]);
  }, [canDecreaseStreak, currentStreakIndex]);

  const increaseTargetStreak = useCallback(() => {
    if (!canIncreaseStreak) {
      return;
    }
    setTargetStreak(TARGET_STREAK_OPTIONS[currentStreakIndex + 1]);
  }, [canIncreaseStreak, currentStreakIndex]);

  return {
    name,
    setName,
    description,
    setDescription,
    color,
    setColor,
    icon,
    setIcon,
    frequency,
    setFrequency,
    customDays,
    setCustomDays,
    targetStreak,
    setTargetStreak,
    type,
    setType,
    canDecreaseStreak,
    canIncreaseStreak,
    decreaseTargetStreak,
    increaseTargetStreak,
    dailyTarget,
    setDailyTarget,
    tags,
    setTags,
    tagInput,
    setTagInput,
    reminderTime,
    setReminderTime,
    reminderEnabled,
    setReminderEnabled,
    schedule,
    setSchedule,
    errors,
    setErrors,
    selectedColor
  };
}

// eslint-disable-next-line max-lines-per-function
function useHabitHandlers({
  name,
  description,
  color,
  icon,
  frequency,
  customDays,
  targetStreak,
  dailyTarget,
  tags,
  tagInput,
  reminderTime,
  reminderEnabled,
  type,
  setErrors,
  setTags,
  setTagInput,
  setCustomDays,
  setReminderEnabled,
  schedule,
  existing,
  habitId,
  isEdit,
  addHabit,
  updateHabit,
  navigate
}: ReturnType<typeof useHabitFormState> & {
  existing?: Habit;
  habitId?: string;
  isEdit: boolean;
  addHabit: (data: HabitUpsertInput) => Promise<string>;
  updateHabit: (id: string, data: Partial<Habit>) => Promise<void>;
  navigate: (path: string) => void;
}) {
  const validate = useCallback(() => validateForm(name, frequency, customDays), [name, frequency, customDays]);
  const handleSubmit = useCallback(async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      invokeIfFunction(setErrors, validationErrors);
      return;
    }
    const normalizedTags = normalizeTags(tagInput, tags);
    const payload = buildHabitPayload({
      name,
      description,
      color,
      icon,
      tags: normalizedTags,
      frequency,
      customDays: frequency === 'custom' ? customDays : undefined,
      schedule,
      targetStreak,
      dailyTarget,
      existing,
      reminderTime,
      reminderEnabled,
      type
    });
    if (isEdit && habitId) {
      await updateHabit(habitId, payload);
      navigate(`/habit/${habitId}`);
    } else {
      const newId = await addHabit(payload);
      navigate(`/habit/${newId}`);
    }
  }, [
    addHabit,
    color,
    customDays,
    dailyTarget,
    description,
    existing,
    frequency,
    habitId,
    icon,
    isEdit,
    name,
    navigate,
    reminderEnabled,
    reminderTime,
    tags,
    targetStreak,
    type,
    updateHabit,
    validate,
    schedule,
    setErrors,
    tagInput
  ]);
  const addTag = useCallback(
    (tag: string) => {
      const sanitized = tag.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (sanitized && !tags.includes(sanitized) && tags.length < 5) {
        if (typeof setTags === 'function') {
          setTags((prev) => [...prev, sanitized]);
        }
      }
      invokeIfFunction(setTagInput, '');
    },
    [tags, setTags, setTagInput]
  );
  const removeTag = useCallback((tag: string) => {
    if (typeof setTags === 'function') {
      setTags((prev) => prev.filter((item) => item !== tag));
    }
  }, [setTags]);
  const toggleCustomDay = useCallback((day: number) => {
    if (typeof setCustomDays === 'function') {
      setCustomDays((prev) =>
        prev.includes(day) ? prev.filter((value) => value !== day) : [...prev, day]
      );
    }
  }, [setCustomDays]);
  const toggleReminderEnabled = useCallback(() => {
    if (typeof setReminderEnabled === 'function') {
      setReminderEnabled((value) => !value);
    }
  }, [setReminderEnabled]);
  const handleBack = useCallback(() => {
    const destination = isEdit && habitId ? `/habit/${habitId}` : '/';
    navigate(destination);
  }, [habitId, isEdit, navigate]);

  return {
    addTag,
    removeTag,
    toggleCustomDay,
    toggleReminderEnabled,
    handleSubmit,
    handleBack,
    // errors setters forwarded for validation use
  } as const;
}

function shouldShowEditLoading(isEdit: boolean, hasExisting: boolean): boolean {
  if (!isEdit) {
    return false;
  }
  return !hasExisting;
}

function getClosestStreakTick(value: number): number {
  return TARGET_STREAK_OPTIONS.reduce((closest, option) =>
    Math.abs(option - value) < Math.abs(closest - value) ? option : closest
  , TARGET_STREAK_OPTIONS[0]);
}

function getColorOption(color: HabitColor) {
  return COLORS.find((option) => option.value === color) ?? COLORS[0];
}

function validateForm(name: string, frequency: HabitFrequency, customDays: number[]) {
  const errors: Record<string, string> = {};
  if (!name.trim()) {
    errors.name = 'Name is required';
  }
  if (name.length > 40) {
    errors.name = 'Max 40 characters';
  }
  if (frequency === 'custom' && customDays.length === 0) {
    errors.customDays = 'Select at least one day';
  }
  return errors;
}

function normalizeTags(tagInput: string, tags: string[]) {
  const normalized = tagInput.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (normalized && !tags.includes(normalized) && tags.length < 5) {
    return [...tags, normalized];
  }
  return tags;
}

function buildHabitPayload({
  name,
  description,
  color,
  icon,
  tags,
  frequency,
  customDays,
  schedule,
  targetStreak,
  dailyTarget,
  existing,
  reminderTime,
  reminderEnabled,
  type
}: {
  name: string;
  description: string;
  color: HabitColor;
  icon: string;
  tags: string[];
  frequency: HabitFrequency;
  customDays?: number[];
  schedule?: HabitSchedule;
  targetStreak: number;
  dailyTarget: number;
  existing?: Habit;
  reminderTime: string;
  reminderEnabled: boolean;
  type: 'positive' | 'negative';
}): HabitUpsertInput {
  return {
    name: name.trim(),
    description: description.trim(),
    color,
    icon,
    tags,
    frequency,
    customDays,
    targetStreak,
    dailyTarget: Math.max(1, Math.trunc(dailyTarget)),
    type,
    archived: existing?.archived ?? false,
    schedule: schedule ?? scheduleFromLegacy(frequency, customDays),
    reminderTime: reminderTime || undefined,
    reminderEnabled,
    freezeDays: existing?.freezeDays ?? [],
    sortOrder: existing?.sortOrder ?? 0
  };
}
