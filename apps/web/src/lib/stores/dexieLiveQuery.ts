import { liveQuery, type Observable } from 'dexie';
import { readable, type Readable } from 'svelte/store';
import { logClientError } from '$lib/logging/clientLogger';

const MAX_RETRY_MS = 30_000;
const BASE_RETRY_MS = 500;

function retryDelayMs(attempt: number): number {
  return Math.min(BASE_RETRY_MS * 2 ** attempt, MAX_RETRY_MS);
}

export function dexieLiveQuery<T>(
  query: () => Promise<T> | T,
  initialValue?: T
): Readable<T | undefined> {
  return readable<T | undefined>(initialValue, (set) => {
    let active = true;
    let retryHandle: ReturnType<typeof setTimeout> | null = null;
    let currentSubscription: { unsubscribe(): void } | null = null;
    let attempt = 0;

    function subscribe() {
      if (!active) {
        return;
      }
      const observable: Observable<T> = liveQuery(query);
      currentSubscription = observable.subscribe({
        next(value) {
          if (active) {
            attempt = 0;
            set(value);
          }
        },
        error(error) {
          logClientError('dexie.live_query_failed', 'Dexie liveQuery subscription failed — will retry', {
            error: error instanceof Error ? error.message : String(error),
            attempt
          });
          currentSubscription = null;
          if (active) {
            const delay = retryDelayMs(attempt++);
            retryHandle = setTimeout(subscribe, delay);
          }
        }
      });
    }

    subscribe();

    return () => {
      active = false;
      if (retryHandle !== null) {
        clearTimeout(retryHandle);
      }
      currentSubscription?.unsubscribe();
    };
  });
}
