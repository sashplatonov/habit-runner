<script lang="ts">
  import { SearchIcon, LogOutIcon, XIcon } from 'lucide-svelte';
  import Overlay from '$lib/components/overlays/Overlay.svelte';
  import type { ThemeId } from '$lib/theme/themes';
  import ThemePicker from '$lib/components/ThemePicker.svelte';

  type Props = {
    open: boolean;
    triggerEl?: HTMLElement | null;
    theme: ThemeId;
    onThemeChange: (id: ThemeId) => void | Promise<void>;
    onClose: () => void;
    onLogout?: () => void | Promise<void>;
    onSearch?: () => void | Promise<void>;
  };

  let { open, triggerEl = null, theme, onThemeChange, onClose, onLogout, onSearch }: Props = $props();

</script>

{#if open}
  <Overlay
    {open}
    {triggerEl}
    {onClose}
    ariaLabel="More actions and theme"
    lockScroll={true}
    class="inset-0 sm:hidden"
  >
    <button type="button" tabindex="-1" class="absolute inset-0 bg-black/35 backdrop-blur-[2px]" aria-label="Close menu" onclick={onClose}></button>
    <div class="absolute inset-x-0 bottom-0 max-h-[min(84vh,46rem)] overflow-y-auto rounded-t-[2rem] border-t border-border bg-bg-secondary/96 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 shadow-[0_-18px_48px_rgba(15,23,42,0.18)]">
      <div class="mx-auto flex max-w-md items-center justify-between gap-3">
        <div>
          <p class="text-[10px] font-medium uppercase tracking-[0.28em] text-muted">More</p>
          <p class="mt-1 text-base font-semibold text-foreground">Actions and theme</p>
        </div>
        <button
          type="button"
          class="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-bg-card text-muted transition-colors hover:text-foreground"
          aria-label="Close menu"
          onclick={onClose}
        >
          <XIcon size={18} />
        </button>
      </div>

      <div class="mt-4 space-y-4">
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-[1.25rem] border border-border bg-bg-card px-4 py-3 text-left text-sm font-medium text-foreground"
          onclick={() => {
            void onSearch?.();
            onClose();
          }}
        >
          <span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-progress/10 text-progress">
            <SearchIcon size={18} />
          </span>
          Search habits
        </button>

        <div class="rounded-[1.25rem] border border-border bg-bg-card p-3">
          <p class="px-1 text-[10px] font-medium uppercase tracking-[0.24em] text-muted">Theme</p>
          <ThemePicker
            class="mt-3"
            {theme}
            {onThemeChange}
            onChoose={onClose}
          />
        </div>

        {#if onLogout}
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-[1.25rem] border border-border bg-bg-card px-4 py-3 text-left text-sm font-medium text-muted transition-colors hover:text-foreground"
            onclick={() => {
              void onLogout();
              onClose();
            }}
          >
            <span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-attention/10 text-attention">
              <LogOutIcon size={18} />
            </span>
            Log out
          </button>
        {/if}
      </div>
    </div>
  </Overlay>
{/if}
