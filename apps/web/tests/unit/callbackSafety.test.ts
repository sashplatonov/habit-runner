import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC_ROOT = path.resolve(__dirname, '../../src');
const UNSAFE_TRUTHY_CALLBACK_CALL = /if\s*\(\s*(on[A-Za-z0-9_]*)\s*\)\s*{\s*\1\s*\(/g;

function listSourceFiles(root: string): string[] {
  const entries = fs.readdirSync(root, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...listSourceFiles(fullPath));
      continue;
    }
    if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }

  return files;
}

describe('callback safety', () => {
  it('does not use truthy-check callback invocation pattern', () => {
    const sourceFiles = listSourceFiles(SRC_ROOT);
    const unsafeMatches: string[] = [];

    for (const filePath of sourceFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      UNSAFE_TRUTHY_CALLBACK_CALL.lastIndex = 0;
      if (UNSAFE_TRUTHY_CALLBACK_CALL.test(content)) {
        unsafeMatches.push(path.relative(SRC_ROOT, filePath));
      }
    }

    expect(unsafeMatches).toEqual([]);
  });
});
