import { liveQuery, type Observable } from 'dexie';
import { readable, type Readable } from 'svelte/store';

export function liveQueryStore<T>(query: () => Promise<T>): Readable<T | undefined> {
  return readable<T | undefined>(undefined, (set) => {
    const observable: Observable<T> = liveQuery(() => query());
    const subscription = observable.subscribe({
      next(result) {
        set(result);
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  });
}
