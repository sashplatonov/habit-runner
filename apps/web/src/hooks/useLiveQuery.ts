import { liveQuery, type Observable } from 'dexie';
import { useEffect, useState } from 'react';

export function useLiveQuery<T>(query: () => Promise<T>, dependencies: unknown[] = []): T | undefined {
  const [value, setValue] = useState<T>();
  const dependenciesKey = JSON.stringify(dependencies);

  useEffect(() => {
    let active = true;
    const observable: Observable<T> = liveQuery(() => query());
    const subscription = observable.subscribe({
      next(result) {
        if (active) {
          setValue(result);
        }
      }
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [query, dependenciesKey]);

  return value;
}
