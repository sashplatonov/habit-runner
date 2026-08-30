/* @vitest-environment node */

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(
  path.resolve(__dirname, '../../src/lib/components/HabitTile.svelte'),
  'utf8'
);

describe('HabitTile momentum rendering contract', () => {
  it('uses the shared status and exposes both accessible signals', () => {
    expect(source).toContain("getDashboardMomentumStatus");
    expect(source).toContain('<Flame');
    expect(source).toContain('<SnowflakeIcon');
    expect(source).toContain('aria-label={momentum.label}');
  });

  it('pairs momentum values with accessible flame and ice signals', () => {
    expect(source).toContain('{momentum.streak}d');
    expect(source).toContain('{momentum.inactiveScheduledDays}d inactive');
    expect(source).toContain('aria-hidden="true"');
  });
});
