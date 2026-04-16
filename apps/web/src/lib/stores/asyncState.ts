import { writable, type Readable } from 'svelte/store';

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncStateSnapshot<T> {
  data: T | null;
  status: AsyncStatus;
  error: string | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}

export interface AsyncStateStore<T> extends Readable<AsyncStateSnapshot<T>> {
  run: (...args: unknown[]) => Promise<T | undefined>;
  reset: () => void;
}

function buildSnapshot<T>(data: T | null, status: AsyncStatus, error: string | null): AsyncStateSnapshot<T> {
  return {
    data,
    status,
    error,
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error'
  };
}

export function createAsyncState<T>(
  asyncFn: (...args: unknown[]) => Promise<T>
): AsyncStateStore<T> {
  const store = writable<AsyncStateSnapshot<T>>(buildSnapshot<T>(null, 'idle', null));

  return {
    subscribe: store.subscribe,
    async run(...args: unknown[]) {
      store.set(buildSnapshot<T>(null, 'loading', null));
      try {
        const result = await asyncFn(...args);
        store.set(buildSnapshot(result, 'success', null));
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        store.set(buildSnapshot<T>(null, 'error', message));
        return undefined;
      }
    },
    reset() {
      store.set(buildSnapshot<T>(null, 'idle', null));
    }
  };
}
