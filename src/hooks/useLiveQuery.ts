import { liveQuery, type Observable } from 'dexie';
import { useEffect, useState } from 'react';

export function useLiveQuery<T>(query: () => Promise<T>, dependencies: unknown[] = []): T | undefined {
  const [value, setValue] = useState<T>();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return value;
}
