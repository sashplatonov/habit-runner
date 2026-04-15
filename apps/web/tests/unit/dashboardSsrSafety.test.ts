/* @vitest-environment node */

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const dashboardFilePath = path.resolve(__dirname, '../../src/routes/(protected)/dashboard/+page.svelte');
const habitTileFilePath = path.resolve(__dirname, '../../src/lib/components/HabitTile.svelte');

describe('dashboard SSR safety', () => {
  it('keeps confetti behind dynamic imports in dashboard modules', () => {
    const dashboardSource = fs.readFileSync(dashboardFilePath, 'utf8');
    const habitTileSource = fs.readFileSync(habitTileFilePath, 'utf8');

    expect(dashboardSource).not.toMatch(/import\s+confetti\s+from\s+['"]canvas-confetti['"]/);
    expect(habitTileSource).not.toMatch(/import\s+confetti\s+from\s+['"]canvas-confetti['"]/);
    expect(dashboardSource).toContain("import('canvas-confetti')");
    expect(habitTileSource).toContain("import('canvas-confetti')");
  });
});