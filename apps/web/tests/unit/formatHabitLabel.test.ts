import { describe, expect, it } from 'vitest';
import { formatHabitLabel } from '../../src/lib/habits/formatHabitLabel';
import type { Habit } from '../../src/types/habit';

describe('formatHabitLabel', () => {
  it('returns icon + name when icon is present', () => {
    const habit: Pick<Habit, 'name' | 'icon'> = { name: 'Reading', icon: '📚' };
    expect(formatHabitLabel(habit)).toBe('📚 Reading');
  });

  it('returns name only when icon is empty', () => {
    const habit: Pick<Habit, 'name' | 'icon'> = { name: 'Exercise', icon: '' };
    expect(formatHabitLabel(habit)).toBe('Exercise');
  });

  it('returns name only when icon is undefined', () => {
    const habit: Pick<Habit, 'name' | 'icon'> = { name: 'Meditation', icon: undefined as unknown as string };
    expect(formatHabitLabel(habit)).toBe('Meditation');
  });

  it('handles habits with special characters in name', () => {
    const habit: Pick<Habit, 'name' | 'icon'> = { name: 'Café & Croissant', icon: '☕' };
    expect(formatHabitLabel(habit)).toBe('☕ Café & Croissant');
  });
});
