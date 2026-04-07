import { w as writable } from "./index.js";
function createUndoStore() {
  const { subscribe, set } = writable(null);
  let timer = null;
  function clearTimer() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }
  return {
    subscribe,
    push(action) {
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
    async executeUndo(action) {
      clearTimer();
      set(null);
      await action.onUndo?.();
    }
  };
}
const undoStore = createUndoStore();
export {
  undoStore as u
};
