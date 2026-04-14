import { liveQuery, type Observable } from 'dexie';
import { readable, type Readable } from 'svelte/store';
import { logClientError } from '$lib/logging/clientLogger';

export function dexieLiveQuery<T>(
  query: () => Promise<T> | T,
  initialValue?: T
): Readable<T | undefined> {
  return readable<T | undefined>(initialValue, (set) => {
    let active = true;
    const observable: Observable<T> = liveQuery(query);
    const subscription = observable.subscribe({
      next(value) {
        if (active) {
          set(value);
        }
      },
      error(error) {
        logClientError('dexie.live_query_failed', 'Dexie liveQuery subscription failed', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  });
}
