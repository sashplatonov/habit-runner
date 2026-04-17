// Minimal utility exports from the legacy hook module required by tests.
// We intentionally keep this small while migrating to Svelte stores.
export async function runSerializedCompletionMutation<T>(
  habitId: string,
  userId: string,
  task: () => Promise<T>
): Promise<T> {
  const key = `${userId}:${habitId}`;
  // Use a simple in-memory queue map attached to module to serialize tasks per key
   
  const map = (globalThis as unknown as Record<string, Map<string, Promise<unknown>> | undefined>).__hr_serialized_completion_queue__ ||= new Map<string, Promise<unknown>>();
  const previous = map.get(key) as Promise<unknown> | undefined;
  const run = (previous ?? Promise.resolve())
    .catch(() => undefined)
    .then(task);
  map.set(key, run as Promise<unknown>);
  try {
    return await run;
  } finally {
    if (map.get(key) === run) {
      map.delete(key);
    }
  }
}
