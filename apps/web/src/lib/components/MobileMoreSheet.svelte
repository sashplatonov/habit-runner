<script lang="ts">
  import { MoonIcon, SearchIcon, SunIcon, LogOutIcon, XIcon } from 'lucide-svelte';
  import Overlay from '$lib/components/overlays/Overlay.svelte';
  import { THEMES, type ThemeId } from '$lib/theme/themes';

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

  const darkThemes = $derived(THEMES.filter((candidate) => candidate.group === 'dark'));
  const lightThemes = $derived(THEMES.filter((candidate) => candidate.group === 'light'));
  const splitThemes = $derived([
    { title: 'Dark', icon: MoonIcon, items: darkThemes },
    { title: 'Light', icon: SunIcon, items: lightThemes }
  ]);
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
          class="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-bg-card text-muted transition-colors hover:text-foreground"
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
          <div class="mt-3 grid gap-3">
            {#each splitThemes as section, sectionIndex (section.title + '-' + sectionIndex)}
              {@const SectionIcon = section.icon}
              <div>
                <div class="flex items-center gap-2 px-1 text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
                  <SectionIcon size={12} />
                  {section.title}
                </div>
                <div class="mt-2 grid grid-cols-2 gap-2">
                  {#each section.items as candidate (candidate.id)}
                    <button
                      type="button"
                      class={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-left text-xs transition-colors ${theme === candidate.id ? 'border-progress/30 bg-progress/10 text-foreground' : 'border-border bg-bg-secondary text-muted'}`}
                      onclick={() => {
                        void onThemeChange(candidate.id);
                        onClose();
                      }}
                    >
                      <span class="flex gap-0.5">
                        <span class="h-2 w-2 rounded-full" style:background-color={candidate.accent}></span>
                        <span class="h-2 w-2 rounded-full" style:background-color={candidate.accentSecondary}></span>
                      </span>
                      {candidate.name}
                    </button>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
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
