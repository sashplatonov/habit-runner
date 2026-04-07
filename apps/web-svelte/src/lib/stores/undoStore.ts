import { writable } from 'svelte/store';

type UndoAction = {
  message: string;
  actionLabel?: string;
  onUndo?: () => void | Promise<void>;
};

function createUndoStore() {
  const { subscribe, set } = writable<UndoAction | null>(null);
  let timer: ReturnType<typeof setTimeout> | null = null;

  function clearTimer() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  return {
    subscribe,
    push(action: UndoAction) {
      clearTimer();
      set(action);
      timer = setTimeout(() => {
        set(null);
        timer = null;
      }, 5200);
    },
    dismiss() {
      clearTimer();
      set(null);
    },
    async executeUndo(action: UndoAction) {
      clearTimer();
      set(null);
      await action.onUndo?.();
    }
  };
}

export const undoStore = createUndoStore();
