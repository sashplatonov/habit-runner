import React from 'react';
import type { HabitSchedule } from '@/types/habit';
import type { WeekOfMonth } from '@habbit-runner/shared';
import { describeSchedule } from '@habbit-runner/shared';
import { DAY_LABELS } from '../add-edit-habit.constants';

const DEFAULT_WEEKDAYS = [1, 2, 3, 4, 5];
const SCHEDULE_TYPE_OPTIONS: { value: HabitSchedule['type']; label: string; desc: string }[] = [
  { value: 'daily', label: 'Daily', desc: 'Every day' },
  { value: 'weekly_days', label: 'Days of week', desc: 'Pick weekdays' },
  { value: 'weekly_quota', label: 'Times per week', desc: 'Hit a weekly quota' },
  { value: 'monthly_weeks', label: 'Monthly weeks', desc: 'Weeks + weekdays' },
  { value: 'monthly_quota', label: 'Times per month', desc: 'Monthly quota' }
];
const WEEK_OF_MONTH_OPTIONS: WeekOfMonth[] = [1, 2, 3, 4, 'last'];

const scheduleBuilders: Record<HabitSchedule['type'], (current: HabitSchedule) => HabitSchedule> = {
  daily: () => ({ type: 'daily' }),
  weekly_days: (current) => ({
    type: 'weekly_days',
    weekdays: current.type === 'weekly_days' ? current.weekdays : DEFAULT_WEEKDAYS
  }),
  weekly_quota: (current) => ({
    type: 'weekly_quota',
    timesPerWeek: current.type === 'weekly_quota' ? current.timesPerWeek : 2,
    weekdays: weeksFromCurrent(current)
  }),
  monthly_weeks: (current) => ({
    type: 'monthly_weeks',
    weeksOfMonth: current.type === 'monthly_weeks' ? current.weeksOfMonth : [1],
    weekdays: current.type === 'monthly_weeks' ? current.weekdays : DEFAULT_WEEKDAYS
  }),
  monthly_quota: (current) => ({
    type: 'monthly_quota',
    timesPerMonth: current.type === 'monthly_quota' ? current.timesPerMonth : 3,
    weekdays: weeksFromCurrent(current)
  })
};

function weeksFromCurrent(schedule: HabitSchedule): number[] | undefined {
  if (schedule.type === 'weekly_quota') {
    return schedule.weekdays;
  }
  if (schedule.type === 'weekly_days' || schedule.type === 'monthly_weeks') {
    return schedule.weekdays;
  }
  if (schedule.type === 'monthly_quota') {
    return schedule.weekdays;
  }
  return undefined;
}

export function createScheduleForType(type: HabitSchedule['type'], current: HabitSchedule): HabitSchedule {
  return scheduleBuilders[type](current);
}

function toggleArray<T>(array: T[], value: T): T[] {
  if (array.includes(value)) {
    return array.filter((item) => item !== value);
  }
  return [...array, value];
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, Math.trunc(value)));

function WeekdayGrid({
  selected,
  onToggle
}: {
  selected: number[];
  onToggle: (day: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {DAY_LABELS.map((day, index) => (
        <button
          key={day}
          type="button"
          onClick={() => onToggle(index)}
          className={`flex-1 rounded-lg border px-2 py-1 text-xs font-mono transition ${
            selected.includes(index)
              ? 'border-accent text-accent bg-accent/10'
              : 'border-border text-muted hover:border-border-hover'
          }`}
        >
          {day[0]}
        </button>
      ))}
    </div>
  );
}

function WeeklyQuotaControls({
  schedule,
  onQuotaChange
}: {
  schedule: Extract<HabitSchedule, { type: 'weekly_quota' }>;
  onQuotaChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="number"
        min={1}
        max={7}
        value={schedule.timesPerWeek}
        onChange={(event) => onQuotaChange(Number(event.target.value))}
        className="w-16 rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm font-mono focus:border-accent/60 focus:outline-none"
      />
      <span className="text-sm font-semibold text-foreground">{`${schedule.timesPerWeek} times per week`}</span>
    </div>
  );
}

function MonthlyWeeksControls({
  schedule,
  onToggleWeek
}: {
  schedule: Extract<HabitSchedule, { type: 'monthly_weeks' }>;
  onToggleWeek: (week: WeekOfMonth) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-mono text-muted uppercase tracking-[0.3em]">Weeks</p>
      <div className="flex flex-wrap gap-1">
        {WEEK_OF_MONTH_OPTIONS.map((week) => (
          <button
            key={week.toString()}
            type="button"
            onClick={() => onToggleWeek(week)}
            className={`rounded-full border px-3 py-1 text-[10px] font-mono transition ${
              schedule.weeksOfMonth.includes(week)
                ? 'border-accent text-accent bg-accent/10'
                : 'border-border text-muted hover:border-border-hover'
            }`}
          >
            {week === 'last' ? 'Last' : `${week}th`}
          </button>
        ))}
      </div>
    </div>
  );
}

function MonthlyQuotaControls({
  schedule,
  onQuotaChange
}: {
  schedule: Extract<HabitSchedule, { type: 'monthly_quota' }>;
  onQuotaChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="number"
        min={1}
        max={31}
        value={schedule.timesPerMonth}
        onChange={(event) => onQuotaChange(Number(event.target.value))}
        className="w-20 rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm font-mono focus:border-accent/60 focus:outline-none"
      />
      <span className="text-sm font-semibold text-foreground">{`${schedule.timesPerMonth} times per month`}</span>
    </div>
  );
}

export function ScheduleSection({
  schedule,
  setSchedule
}: {
  schedule: HabitSchedule;
  setSchedule: React.Dispatch<React.SetStateAction<HabitSchedule>>;
}) {
  const activeWeekdays =
    schedule.type === 'weekly_days' || schedule.type === 'monthly_weeks'
      ? schedule.weekdays
      : schedule.type === 'weekly_quota' || schedule.type === 'monthly_quota'
        ? schedule.weekdays ?? []
        : [];

  const toggleWeekday = (day: number) => {
    setSchedule((prev) => {
      if (prev.type === 'weekly_days' || prev.type === 'monthly_weeks') {
        return { ...prev, weekdays: toggleArray(prev.weekdays, day) };
      }
      if (prev.type === 'weekly_quota' || prev.type === 'monthly_quota') {
        return { ...prev, weekdays: toggleArray(prev.weekdays ?? [], day) };
      }
      return prev;
    });
  };

  const toggleWeekOfMonth = (week: WeekOfMonth) => {
    setSchedule((prev) => {
      if (prev.type !== 'monthly_weeks') {
        return prev;
      }
      return { ...prev, weeksOfMonth: toggleArray(prev.weeksOfMonth, week) };
    });
  };

  const setWeekQuota = (value: number) => {
    setSchedule((prev) => {
      if (prev.type !== 'weekly_quota') {
        return prev;
      }
      return { ...prev, timesPerWeek: clamp(value, 1, 7) };
    });
  };

  const setMonthQuota = (value: number) => {
    setSchedule((prev) => {
      if (prev.type !== 'monthly_quota') {
        return prev;
      }
      return { ...prev, timesPerMonth: clamp(value, 1, 31) };
    });
  };

  return (
    <div>
      <label className="block text-[10px] font-mono text-muted uppercase tracking-wider mb-2">Schedule</label>
      <div className="grid grid-cols-2 gap-2">
        {SCHEDULE_TYPE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setSchedule(createScheduleForType(option.value, schedule))}
            className={`rounded-lg border px-3 py-2 text-xs font-mono text-left transition ${
              schedule.type === option.value
                ? 'border-accent text-accent bg-accent/10'
                : 'border-border text-muted hover:border-border-hover'
            }`}
          >
            <div className="font-semibold uppercase tracking-[0.2em]">{option.label}</div>
            <div className="text-[9px] text-muted">{option.desc}</div>
          </button>
        ))}
      </div>
      <div className="mt-3 space-y-3">
        {schedule.type === 'weekly_days' && <WeekdayGrid selected={activeWeekdays} onToggle={toggleWeekday} />}
        {schedule.type === 'weekly_quota' && (
          <WeeklyQuotaControls schedule={schedule} onQuotaChange={setWeekQuota} />
        )}
        {schedule.type === 'monthly_weeks' && (
          <MonthlyWeeksControls schedule={schedule} onToggleWeek={toggleWeekOfMonth} />
        )}
        {schedule.type === 'monthly_quota' && (
          <MonthlyQuotaControls schedule={schedule} onQuotaChange={setMonthQuota} />
        )}
      </div>
      <p className="text-[11px] font-mono text-muted mt-2">{describeSchedule(schedule)}</p>
    </div>
  );
}
