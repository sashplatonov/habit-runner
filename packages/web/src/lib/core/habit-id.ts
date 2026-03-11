import { customAlphabet } from 'nanoid';
import slugify from '@sindresorhus/slugify';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 4);

export function createHabitId(name: string): string {
  const slug = slugify(name || 'habit');
  const base = slug || 'habit';
  return `${base}-${nanoid()}`;
}
