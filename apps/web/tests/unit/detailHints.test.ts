import { AlertTriangle, CheckCircle2, Flame, Lightbulb, TrendingDown, TrendingUp } from 'lucide-svelte';
import { describe, expect, it } from 'vitest';
import {
  buildMonthlyInsight,
  buildWeeklyInsight,
  getAutomatismLevel,
  getAutomatismMessage,
  getRateHint,
  getRateWindowLabel,
  getStreakHint,
  getTotalHint
} from '../../src/lib/habits/detailHints';

describe('detail hints', () => {
  it('uses early copy for young habits and stronger copy for mature ones', () => {
    expect(getRateWindowLabel(5)).toBe('first days');
    expect(getRateWindowLabel(45)).toBe('last 90d');
    expect(getRateHint(5, 20).icon).toBe(Lightbulb);
    expect(getRateHint(60, 88).icon).toBe(CheckCircle2);
    expect(getRateHint(60, 25).icon).toBe(AlertTriangle);
  });

  it('returns streak and total hints for weak and strong states', () => {
    expect(getStreakHint(0, 12).icon).toBe(AlertTriangle);
    expect(getStreakHint(12, 12).icon).toBe(TrendingUp);
    expect(getStreakHint(30, 40).icon).toBe(Flame);
    expect(getTotalHint(0).icon).toBeDefined();
    expect(getTotalHint(120).text).toContain('Century club');
  });

  it('builds monthly insights for growth and regressions', () => {
    const rising = buildMonthlyInsight(
      [
        { month: 'Jan', rate: 40 },
        { month: 'Feb', rate: 62 }
      ],
      '2026-01-01T00:00:00.000Z'
    );
    const falling = buildMonthlyInsight(
      [
        { month: 'Jan', rate: 80 },
        { month: 'Feb', rate: 55 }
      ],
      '2026-01-01T00:00:00.000Z'
    );

    expect(rising.icon).toBe(TrendingUp);
    expect(rising.text).toContain('Up 22%');
    expect(falling.icon).toBe(TrendingDown);
    expect(falling.text).toContain('Down 25%');
  });

  it('builds weekly insights for perfect and dropping runs', () => {
    const perfect = buildWeeklyInsight(
      [
        { count: 1 },
        { count: 3 },
        { count: 5 },
        { count: 7 }
      ],
      '2026-01-01T00:00:00.000Z'
    );
    const dropping = buildWeeklyInsight(
      [
        { count: 6 },
        { count: 5 },
        { count: 4 },
        { count: 4 },
        { count: 2 },
        { count: 0 }
      ],
      '2026-01-01T00:00:00.000Z'
    );

    expect(perfect.icon).toBe(Flame);
    expect(perfect.text).toContain('Perfect last week');
    expect(dropping.icon).toBe(TrendingDown);
    expect(dropping.text).toContain('Completions dropping');
  });

  it('maps automatism score to the same maturity labels as legacy', () => {
    expect(getAutomatismLevel(25, '#00d4ff').label).toBe('Fragile');
    expect(getAutomatismLevel(55, '#00d4ff').label).toBe('Growing');
    expect(getAutomatismLevel(75, '#00d4ff').label).toBe('Established');
    expect(getAutomatismLevel(90, '#00d4ff').label).toBe('Automatic');
    expect(getAutomatismMessage(90)).toContain('context stable');
  });
});
