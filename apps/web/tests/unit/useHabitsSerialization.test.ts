import { expect, test } from 'vitest';
import { runSerializedCompletionMutation } from '@/hooks/useHabits';

test('runSerializedCompletionMutation executes same habit sequentially', async () => {
  const events: string[] = [];

  const first = runSerializedCompletionMutation('habit-1', 'user-1', async () => {
    events.push('first:start');
    await new Promise((resolve) => setTimeout(resolve, 20));
    events.push('first:end');
    return 'first';
  });

  const second = runSerializedCompletionMutation('habit-1', 'user-1', async () => {
    events.push('second:start');
    events.push('second:end');
    return 'second';
  });

  await Promise.all([first, second]);

  expect(events).toEqual([
    'first:start',
    'first:end',
    'second:start',
    'second:end'
  ]);
});

test('runSerializedCompletionMutation allows different habits to proceed independently', async () => {
  const events: string[] = [];

  await Promise.all([
    runSerializedCompletionMutation('habit-1', 'user-1', async () => {
      events.push('first:start');
      await new Promise((resolve) => setTimeout(resolve, 20));
      events.push('first:end');
    }),
    runSerializedCompletionMutation('habit-2', 'user-1', async () => {
      events.push('second:start');
      events.push('second:end');
    })
  ]);

  expect(events[0]).toBe('first:start');
  expect(events).toContain('second:start');
  expect(events.at(-1)).toBe('first:end');
});
