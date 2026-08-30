/* @vitest-environment node */

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(
  path.resolve(__dirname, '../../src/lib/components/HabitTile.svelte'),
  'utf8'
);

describe('HabitTile heatmap contract', () => {
  it('uses the shared 30-day heatmap and preserves tile actions', () => {
    expect(source).toContain("import MiniHeatmap from '$lib/components/MiniHeatmap.svelte';");
    expect(source).toContain('<MiniHeatmap completions={habit.completions} dailyTarget={target} color={habit.color} />');
    expect(source).toContain('Habit activity for the last 30 days, from 30 days ago through today');
    expect(source).not.toContain('HabitHeatmap');
    expect(source).toContain('<HabitCompletionControl');
    expect(source).toContain('onclick={onDetail}');
  });

  it('renders the heatmap as a permanent, always-visible block', () => {
    expect(source).toMatch(/role="img"[\s\S]{0,200}aria-label="Habit activity for the last 30 days/);
    expect(source).not.toMatch(/hidden[^\n]*aria-label="Habit activity for the last 30 days/);
  });
});
