import { get, writable, type Readable } from 'svelte/store';
import { getContext, setContext } from 'svelte';

export type UndoAction = {
  message: string;
  actionLabel?: string;
  onUndo?: () => void | Promise<void>;
};

export interface UndoStore extends Readable<UndoAction | null> {
  push: (action: UndoAction) => void;
  close: () => void;
  runUndo: () => Promise<void>;
}

const UNDO_STORE_CONTEXT_KEY = Symbol('undo-store');

export function createUndoStore(): UndoStore {
  const store = writable<UndoAction | null>(null);
  let timer: ReturnType<typeof setTimeout> | null = null;

  function clearTimer() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  return {
    subscribe: store.subscribe,
    push(action) {
      clearTimer();
      store.set(action);
      timer = setTimeout(() => {
        store.set(null);
        timer = null;
      }, 5200);
    },
    close() {
      clearTimer();
      store.set(null);
    },
    async runUndo() {
      const action = get(store);
      clearTimer();
      store.set(null);
      await action?.onUndo?.();
    }
  };
}

export function setUndoContext(store = createUndoStore()) {
  setContext(UNDO_STORE_CONTEXT_KEY, store);
  return store;
}

export function getUndoContext(): UndoStore {
  const store = getContext<UndoStore | undefined>(UNDO_STORE_CONTEXT_KEY);
  if (!store) {
    throw new Error('Undo store context is not available');
  }
  return store;
}
