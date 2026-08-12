import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const contentDir = join(process.cwd(), 'src', 'content', 'blog');
const staticDir = join(process.cwd(), 'static');

describe('public content contract', () => {
  it('keeps every blog cover local and every article front matter complete', () => {
    const posts = readdirSync(contentDir).filter((fileName) => fileName.endsWith('.md'));
    expect(posts).toHaveLength(27);

    for (const fileName of posts) {
      const source = readFileSync(join(contentDir, fileName), 'utf8');
      const frontMatter = source.split(/^---$/m)[1] ?? '';
      for (const key of ['title', 'description', 'publishedAt', 'author', 'keywords', 'coverImage']) {
        expect(frontMatter).toMatch(new RegExp(`^${key}:\\s*.+$`, 'm'));
      }
      const cover = frontMatter.match(/^coverImage:\s*['"]?([^'"\n]+)['"]?\s*$/m)?.[1];
      expect(cover).toBeTruthy();
      if (!cover) {
        continue;
      }
      expect(existsSync(join(staticDir, cover.replace(/^\//, '')))).toBe(true);
    }
  });

  it('passes the same public content guard used by the web check', () => {
    expect(() => execFileSync('node', ['scripts/check-public-content.mjs'], { cwd: process.cwd(), stdio: 'pipe' })).not.toThrow();
  });

  it('runs the public content guard from the standard web check', () => {
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as { scripts: Record<string, string> };

    expect(packageJson.scripts['check:web']).toContain('npm run check:public-content');
  });
});
