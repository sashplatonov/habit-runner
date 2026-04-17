import { writable } from 'svelte/store';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function createInstallPromptStore() {
  const { subscribe, set, update } = writable<BeforeInstallPromptEvent | null>(null);

  return {
    subscribe,
    capture(event: BeforeInstallPromptEvent) {
      set(event);
    },
    async trigger(): Promise<boolean> {
      let result = false;
      update((prompt) => {
        if (!prompt) { return null; }
        void prompt.prompt().then(() =>
          prompt.userChoice.then((choice) => {
            result = choice.outcome === 'accepted';
          })
        );
        return null;
      });
      return result;
    },
    clear() {
      set(null);
    }
  };
}

export const installPromptStore = createInstallPromptStore();

export function isStandaloneMode(): boolean {
  return typeof window !== 'undefined' &&
    window.matchMedia('(display-mode: standalone)').matches;
}
