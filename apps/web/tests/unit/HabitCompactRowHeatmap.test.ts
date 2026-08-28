/* @vitest-environment node */

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(
  path.resolve(__dirname, '../../src/lib/components/dashboard/HabitCompactRow.svelte'),
  'utf8'
);

describe('HabitCompactRow heatmap contract', () => {
  it('keeps the 30-day heatmap as a permanent, accessible lower row', () => {
    expect(source).toContain("import MiniHeatmap from '$lib/components/MiniHeatmap.svelte';");
    expect(source).toContain('<MiniHeatmap completions={habit.completions} dailyTarget={habit.dailyTarget} color={habit.color} />');
    expect(source).toContain('Habit activity for the last 30 days, from 30 days ago through today');
    expect(source).not.toMatch(/(?:hidden|md:hidden)[^\n]*MiniHeatmap|MiniHeatmap[^\n]*(?:hidden|md:hidden)/);
    expect(source).toContain('<HabitCompletionControl');
    expect(source).toContain('onclick={handleDetail}');
  });
});
