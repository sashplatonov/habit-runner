/* @vitest-environment node */

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(
  path.resolve(__dirname, '../../src/lib/components/dashboard/HabitCompactRow.svelte'),
  'utf8'
);

describe('HabitCompactRow momentum rendering contract', () => {
  it('uses the shared status and keeps the compact signals labelled', () => {
    expect(source).toContain("getDashboardMomentumStatus");
    expect(source).toContain('<Flame');
    expect(source).toContain('<SnowflakeIcon');
    expect(source).toContain('aria-label={momentum.label}');
  });
});
