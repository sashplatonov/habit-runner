/* @vitest-environment node */

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(
  path.resolve(__dirname, '../../src/lib/components/habits/HabitStreakPill.svelte'),
  'utf8'
);

describe('HabitStreakPill rendering contract', () => {
  it('renders a labelled fire streak or snowflake missed-day count', () => {
    expect(source).toContain("hasActiveStreak ? 'fire' : 'snowflake'");
    expect(source).toContain('<Flame');
    expect(source).toContain('<SnowflakeIcon');
    expect(source).toContain('aria-label={label}');
    expect(source).toContain('missedScheduledDays');
    expect(source).toContain('{displayedDays}');
  });
});
