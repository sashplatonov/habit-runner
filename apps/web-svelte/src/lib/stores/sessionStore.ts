import { writable } from 'svelte/store';
import type { AuthSession } from '$lib/auth/session';
import { readAuthSession } from '$lib/auth/session';

function createSessionStore() {
  const { subscribe, set, update } = writable<AuthSession | null>(null);

  return {
    subscribe,
    set,
    update,
    init() {
      set(readAuthSession());
    }
  };
}

export const sessionStore = createSessionStore();
