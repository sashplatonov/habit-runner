import { w as writable } from "./index.js";
import { r as readAuthSession } from "./session.js";
function createSessionStore() {
  const { subscribe, set, update } = writable(null);
  return {
    subscribe,
    set,
    update,
    init() {
      set(readAuthSession());
    }
  };
}
const sessionStore = createSessionStore();
export {
  sessionStore as s
};
