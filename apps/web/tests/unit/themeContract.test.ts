import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { THEME_IDS, THEMES } from '../../src/lib/theme/themes';

const THEME_CSS_PATH = path.resolve(process.cwd(), 'src/lib/theme/theme.css');
const INDEX_CSS_PATH = path.resolve(process.cwd(), 'src/index.css');

function parseThemeBlock(themeId: string): { block: string; vars: Record<string, string> } {
  const css = fs.readFileSync(THEME_CSS_PATH, 'utf8');
  const blockMatch = css.match(new RegExp(`\\[data-theme='${themeId}'\\] \\{([\\s\\S]*?)\\n\\}`, 'm'));

  if (!blockMatch) {
    throw new Error(`Missing theme block for ${themeId}`);
  }

  const block = blockMatch[1];
  const vars: Record<string, string> = {};
  for (const line of block.split('\n')) {
    const match = line.trim().match(/^--([a-z-]+):\s*(.+?);$/);
    if (match) {
      vars[`--${match[1]}`] = match[2];
    }
  }

  return { block, vars };
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.trim().replace('#', '');
  const expanded = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;
  const value = Number.parseInt(expanded, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(first: string, second: string): number {
  const [lighter, darker] = [relativeLuminance(first), relativeLuminance(second)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('theme contract', () => {
  it('keeps fourteen unique ids split across seven dark and seven light themes', () => {
    expect(THEMES).toHaveLength(14);
    expect(new Set(THEMES.map((theme) => theme.id)).size).toBe(14);
    expect(new Set(THEME_IDS).size).toBe(14);
    expect(THEMES.filter((theme) => theme.group === 'dark')).toHaveLength(7);
    expect(THEMES.filter((theme) => theme.group === 'light')).toHaveLength(7);
  });

  it('defines the semantic token contract for every theme block', () => {
    const requiredTokens = [
      '--bg-primary',
      '--bg-secondary',
      '--bg-card',
      '--overlay',
      '--border',
      '--border-hover',
      '--text-primary',
      '--text-muted',
      '--icon-muted',
      '--accent',
      '--accent-secondary',
      '--progress',
      '--attention',
      '--danger',
      '--focus-ring',
      '--glow',
      '--glow-secondary',
      '--surface-shadow',
      '--page-background',
      '--theme-color'
    ];

    for (const theme of THEMES) {
      const { block, vars } = parseThemeBlock(theme.id);
      for (const token of requiredTokens) {
        expect(block.includes(`${token}:`), `${theme.id} is missing ${token}`).toBe(true);
      }

      expect(vars['--theme-color']).toBe(theme.themeColor);
      expect(vars['--accent']).toBe(theme.accent);
      expect(vars['--accent-secondary']).toBe(theme.accentSecondary);
      expect(vars['--progress']).toBe(theme.progress);
      expect(contrastRatio(vars['--text-primary'], vars['--bg-primary'])).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(vars['--text-muted'], vars['--bg-card'])).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(vars['--focus-ring'], vars['--bg-primary'])).toBeGreaterThanOrEqual(3);
    }
  });

  it('keeps theme values in one stylesheet with cloud as the CSS default', () => {
    const themeCss = fs.readFileSync(THEME_CSS_PATH, 'utf8');
    const indexCss = fs.readFileSync(INDEX_CSS_PATH, 'utf8');

    expect(indexCss).not.toMatch(/\[data-theme=/);
    expect(indexCss).not.toMatch(/--bg-primary\s*:/);
    expect(themeCss).toMatch(/:root:not\(\[data-theme\]\),\s*\n\[data-theme='cloud'\]/);
    expect(themeCss).not.toMatch(/(?:^|\n):root,\s*\n\[data-theme='cloud'\]/);
  });
});
