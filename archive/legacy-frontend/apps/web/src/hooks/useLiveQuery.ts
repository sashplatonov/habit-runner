import { liveQuery, type Observable } from 'dexie';
import { useEffect, useRef, useState } from 'react';

export function useLiveQuery<T>(query: () => Promise<T>, dependencies: unknown[] = []): T | undefined {
  const [value, setValue] = useState<T>();
  const queryRef = useRef(query);
  const dependenciesKey = JSON.stringify(dependencies);

  queryRef.current = query;

  useEffect(() => {
    let active = true;
    const observable: Observable<T> = liveQuery(() => queryRef.current());
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
  }, [dependenciesKey]);

  return value;
}
