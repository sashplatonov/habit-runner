import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const modelFilePath = path.resolve(__dirname, '../../src/pages/hooks/useAddEditHabitModel.ts');

describe('useAddEditHabitModel safety', () => {
  it('returns setTags from useHabitFormState', () => {
    const source = fs.readFileSync(modelFilePath, 'utf8');
    const returnStart = source.indexOf('function useHabitFormState');
    const returnEnd = source.indexOf('function useHabitHandlers');
    const section = source.slice(returnStart, returnEnd);

    expect(section.includes('setTags,')).toBe(true);
  });
});
