import { render, screen } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import ScheduledCompletionSummary from '$lib/components/dashboard/ScheduledCompletionSummary.svelte';
import type { Habit } from '../../src/types/habit.js';
import { buildScheduledCompletionSummary } from '../../src/lib/dashboard/scheduledCompletionSummary.js';
import type { ScheduledCompletionSummary as SummaryModel } from '../../src/lib/dashboard/scheduledCompletionSummary.js';

function habit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit', name: 'Habit', description: '', color: 'blue', icon: '⚡', tags: [],
    frequency: 'daily', schedule: { type: 'daily' }, targetStreak: 21, dailyTarget: 1,
    completions: {}, freezeDays: [], createdAt: '2026-03-01T09:00:00Z', archived: false,
    sortOrder: 0, type: 'positive', ...overrides
  };
}

describe('buildScheduledCompletionSummary', () => {
  test('builds 30 ordered days and neutral days without required habits', () => {
    const summary = buildScheduledCompletionSummary([habit({ id: 'daily', completions: { '2026-03-20T00:00:00Z': 1 } })], new Date('2026-03-20T12:00:00Z'), 'UTC');
    expect(summary.days).toHaveLength(30);
    expect(summary.days[0].calendarDate).toBe('2026-02-19');
    expect(summary.days.at(-1)?.calendarDate).toBe('2026-03-20');
    expect(summary.days.find((day) => day.calendarDate === '2026-02-19')).toMatchObject({ state: 'neutral', required: 0, ratio: null, brightnessLevel: null });
    expect(summary.perfectDays).toBe(1);
    expect(summary.periodPercentage).toBe(5);
  });

  test('uses schedule and completion semantics for partial targets, negatives, and today segments', () => {
    const summary = buildScheduledCompletionSummary([
      habit({ id: 'targeted', dailyTarget: 2, completions: { '2026-03-20T00:00:00Z': 1 } }),
      habit({ id: 'negative', type: 'negative', sortOrder: 1 }),
      habit({ id: 'friday', schedule: { type: 'weekly_days', weekdays: [5] }, sortOrder: 2 })
    ], new Date('2026-03-20T12:00:00Z'), 'UTC');
    expect(summary.today).toMatchObject({ completed: 1, required: 3, percentage: 33 });
    expect(summary.today.segments).toEqual([{ habitId: 'targeted', completed: false }, { habitId: 'negative', completed: true }, { habitId: 'friday', completed: false }]);
    expect(summary.today.segments).toHaveLength(summary.today.required);
    expect(summary.days.at(-1)).toMatchObject({ state: 'required', completed: 1, required: 3, brightnessLevel: 2 });
  });

  test('excludes archived, pre-creation, frozen, and unscheduled habits', () => {
    const summary = buildScheduledCompletionSummary([
      habit({ id: 'archived', archived: true }), habit({ id: 'new', createdAt: '2026-03-20T12:00:00Z' }),
      habit({ id: 'frozen', freezeDays: ['2026-03-20'] }), habit({ id: 'weekday', schedule: { type: 'weekly_days', weekdays: [1] } })
    ], new Date('2026-03-20T12:00:00Z'), 'UTC');
    expect(summary.today).toMatchObject({ completed: 0, required: 1, percentage: 0 });
    expect(summary.today.segments).toEqual([{ habitId: 'new', completed: false }]);
    expect(summary.days.at(-1)?.state).toBe('required');
  });

  test('evaluates weekly and monthly quota obligations for each calendar cell', () => {
    const summary = buildScheduledCompletionSummary([
      habit({ id: 'weekly', schedule: { type: 'weekly_quota', timesPerWeek: 2, weekdays: [5] } }),
      habit({ id: 'monthly', schedule: { type: 'monthly_quota', timesPerMonth: 2 } })
    ], new Date('2026-03-20T12:00:00Z'), 'UTC');
    expect(summary.today.required).toBe(2);
    expect(summary.today.segments.map((segment) => segment.habitId)).toEqual(['weekly', 'monthly']);
  });

  test('uses the supplied timezone for the calendar boundary', () => {
    const summary = buildScheduledCompletionSummary([habit({ completions: { '2026-03-20T00:00:00Z': 1 } })], new Date('2026-03-21T06:30:00Z'), 'America/Los_Angeles');
    expect(summary.today.calendarDate).toBe('2026-03-20');
    expect(summary.today.completed).toBe(1);
    expect(summary.days.at(-1)?.calendarDate).toBe('2026-03-20');
  });
});

function createSummary(): SummaryModel {
  return {
    days: Array.from({ length: 30 }, (_, index) => ({ calendarDate: `2026-03-${String(index + 1).padStart(2, '0')}`, state: 'required' as const, completed: index === 29 ? 1 : 0, required: 1, ratio: index === 29 ? 1 : 0, brightnessLevel: index === 29 ? 4 as const : 1 as const })),
    perfectDays: 1,
    periodPercentage: 3,
    today: { calendarDate: '2026-03-30', completed: 1, required: 2, percentage: 50, segments: [{ habitId: 'done', completed: true }, { habitId: 'pending', completed: false }] }
  };
}

describe('ScheduledCompletionSummary', () => {
  test('renders 30 accessible cells and one segment per scheduled habit', () => {
    const { container } = render(ScheduledCompletionSummary, { summary: createSummary(), dateLabel: 'Monday, Mar 30' });
    expect(screen.getAllByRole('img', { name: '30-day scheduled completion heatmap' })).toHaveLength(2);
    expect(container.querySelectorAll('[data-layout="desktop"] [aria-label^="2026-"]')).toHaveLength(30);
    expect(container.querySelectorAll('[data-layout="mobile"] [aria-label^="2026-"]')).toHaveLength(30);
    expect(container.querySelectorAll('[aria-label^="Scheduled habit "]')).toHaveLength(4);
    expect(screen.getAllByText(/1\/2/)).toHaveLength(2);
    expect(screen.getByLabelText('Perfect days: 1 of 30')).toBeTruthy();
    expect(screen.getAllByText('50%')).toHaveLength(3);
    expect(screen.getByText('30-day completion')).toBeTruthy();
    expect(screen.getByText('3%')).toBeTruthy();
    expect(screen.getAllByRole('img', { name: '30-day scheduled completion heatmap' })[0].getAttribute('aria-describedby')).toBe('scheduled-completion-desktop-heatmap-description');
    expect(container.querySelector('#scheduled-completion-desktop-heatmap-description')?.textContent).toContain('2026-03-01: 0 of 1 scheduled habits completed');
    expect(container.querySelector('#scheduled-completion-desktop-today-description')?.textContent).toBe('Scheduled habit 1: completed; Scheduled habit 2: incomplete');
    expect(container.querySelector('section[aria-live]')).toBeNull();
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe('Today: 1 of 2 scheduled habits completed, 50%');
    const mobileSummary = container.querySelector('[data-layout="mobile"]');
    expect(mobileSummary?.textContent).toContain('30-day completion');
    expect(mobileSummary?.textContent).not.toContain('Monday, Mar 30');
    expect(mobileSummary?.textContent).not.toContain('scheduled only');
  });

  test('renders neutral days and a neutral no-schedule score', () => {
    const summary = createSummary();
    summary.days = summary.days.map((day) => ({ ...day, state: 'neutral' as const, completed: 0, required: 0, ratio: null, brightnessLevel: null }));
    summary.perfectDays = 0;
    summary.periodPercentage = null;
    summary.today = { calendarDate: '2026-03-30', completed: 0, required: 0, percentage: null, segments: [] };
    const { container } = render(ScheduledCompletionSummary, { summary, dateLabel: 'Monday, Mar 30' });
    expect(screen.getAllByText('—')).toHaveLength(4);
    expect(screen.getAllByLabelText('No habits are scheduled today')).toHaveLength(2);
    expect(container.querySelectorAll('[aria-label="2026-03-01: no habits scheduled"]')).toHaveLength(2);
    expect(screen.getAllByRole('img', { name: /no habits are scheduled/i })).toHaveLength(2);
  });
});
