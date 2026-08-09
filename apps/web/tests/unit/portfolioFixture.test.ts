import { describe, expect, it } from 'vitest';
import { createPortfolioFixture } from '../../src/lib/showcase/portfolioFixture';

describe('portfolioFixture', () => {
  it('contains realistic domain habits and history', () => {
    const fixture = createPortfolioFixture();
    expect(fixture.habits).toHaveLength(4);
    expect(fixture.habits.some((habit) => habit.type === 'negative')).toBe(true);
    expect(fixture.habits.some((habit) => (habit.dailyTarget ?? 1) > 1)).toBe(true);
    expect(fixture.checkins.length).toBeGreaterThan(10);
  });

  it('creates independent mutable fixture values', () => {
    const first = createPortfolioFixture();
    const second = createPortfolioFixture();
    first.habits[0].tags.push('changed');
    first.checkins[0].count = 99;
    expect(second.habits[0].tags).not.toContain('changed');
    expect(second.checkins[0].count).not.toBe(99);
  });
});
