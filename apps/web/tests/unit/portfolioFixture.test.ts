import { describe, expect, it } from 'vitest';
import { portfolioFixture } from '../../src/lib/showcase/portfolioFixture';

describe('portfolioFixture', () => {
  it('contains fictional, read-only dashboard evidence', () => {
    expect(portfolioFixture.habits).toHaveLength(3);
    expect(portfolioFixture.habits.every((habit) => habit.name.length > 0)).toBe(true);
    expect(portfolioFixture.habits.every((habit) => habit.progress >= 0 && habit.progress <= 100)).toBe(true);
    expect(portfolioFixture.conflict.message).toContain('changed elsewhere');
  });

  it('keeps the weekly rhythm deterministic', () => {
    expect(portfolioFixture.week).toHaveLength(7);
    expect(portfolioFixture.week.filter((day) => day.completed)).toHaveLength(4);
    expect(portfolioFixture.week.filter((day) => day.current)).toHaveLength(1);
  });
});

