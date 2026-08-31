/* @vitest-environment node */

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(
  path.resolve(__dirname, '../../src/routes/app/(protected)/dashboard/+page.svelte'),
  'utf8'
);

describe('compact dashboard heatmap contract', () => {
  it('keeps a visible 30-day heatmap in the lower row for both list branches', () => {
    const lowerRowHeatmaps = source.match(/mt-2 w-full border-t border-border\/40 pt-2" role="img" aria-label="Habit activity for the last 30 days[\s\S]{0,220}<MiniHeatmap completions=\{habit\.completions\} dailyTarget=\{tgt\} color=\{habit\.color\} \/>/g) ?? [];

    expect(lowerRowHeatmaps).toHaveLength(2);
  });
});
