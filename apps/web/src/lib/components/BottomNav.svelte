<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import {
    BarChart2Icon,
    LayoutDashboardIcon,
    LogOutIcon,
    MoonIcon,
    PaletteIcon,
    PlusIcon,
    SearchIcon,
    SunIcon
  } from 'lucide-svelte';
  import { THEMES, type ThemeId } from '$lib/theme/themes';

  type Props = {
    theme: ThemeId;
    onThemeChange: (id: ThemeId) => void | Promise<void>;
    onLogout?: () => void | Promise<void>;
  };

  let { theme, onThemeChange, onLogout }: Props = $props();

  let isThemeOpen = $state(false);
  let themeElement = $state<HTMLDivElement | null>(null);

  const darkThemes = $derived(THEMES.filter((candidate) => candidate.group === 'dark'));
  const lightThemes = $derived(THEMES.filter((candidate) => candidate.group === 'light'));
  const dashboardHref = resolve<'/app/(protected)/dashboard'>('/app/(protected)/dashboard', {});
  const statsHref = resolve<'/app/(protected)/stats'>('/app/(protected)/stats', {});
  const isDashboard = $derived(page.url.pathname === dashboardHref);
  const isStats = $derived(page.url.pathname === statsHref);

  function handleWindowClick(event: MouseEvent) {
    if (!isThemeOpen) {
      return;
    }

    const target = event.target;
    if (themeElement && target instanceof Node && !themeElement.contains(target)) {
      isThemeOpen = false;
    }
  }

  async function focusSearch() {
    if (!isDashboard) {
      await goto(resolve<'/app/(protected)/dashboard#habit-search'>('/app/(protected)/dashboard#habit-search', {}));
    }

    window.setTimeout(() => {
      document.getElementById('habit-search')?.focus();
    }, 100);
  }
</script>

<svelte:window onmousedown={handleWindowClick} />

<nav
  class="fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-bg-primary/95 backdrop-blur-sm sm:hidden"
  style:height="calc(72px + env(safe-area-inset-bottom))"
  style:padding-bottom="env(safe-area-inset-bottom)"
  aria-label="Mobile navigation"
>
  <a
    class={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${isDashboard ? 'text-accent' : 'text-muted'}`}
    href={resolve<'/app/(protected)/dashboard'>('/app/(protected)/dashboard', {})}
    aria-label="Dashboard"
    aria-current={isDashboard ? 'page' : undefined}
  >
    <div class={`flex h-8 w-8 items-center justify-center rounded-[10px] ${isDashboard ? 'bg-accent/10' : ''}`}>
      <LayoutDashboardIcon size={18} />
    </div>
    <span class="text-[10px] font-medium">Dashboard</span>
  </a>

  <a
    class={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${isStats ? 'text-accent' : 'text-muted'}`}
    href={resolve<'/app/(protected)/stats'>('/app/(protected)/stats', {})}
    aria-label="Stats"
    aria-current={isStats ? 'page' : undefined}
  >
    <div class={`flex h-8 w-8 items-center justify-center rounded-[10px] ${isStats ? 'bg-accent/10' : ''}`}>
      <BarChart2Icon size={18} />
    </div>
    <span class="text-[10px] font-medium">Stats</span>
  </a>

  <div class="flex flex-[0_0_72px] items-center justify-center">
    <a
      class="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-accent text-bg-primary"
      style:box-shadow="0 0 20px var(--glow), 0 8px 16px rgba(0,0,0,0.4)"
      href={resolve<'/app/(protected)/habit/new'>('/app/(protected)/habit/new', {})}
      aria-label="New habit"
    >
      <PlusIcon size={24} />
    </a>
  </div>

  <button
    type="button"
    class="flex flex-1 flex-col items-center justify-center gap-1 text-muted transition-colors hover:text-accent"
    aria-label="Search habits"
    onclick={() => {
      void focusSearch();
    }}
  >
    <div class="flex h-8 w-8 items-center justify-center rounded-[10px]">
      <SearchIcon size={18} />
    </div>
    <span class="text-[10px] font-medium">Search</span>
  </button>

  <div class="relative flex flex-1 flex-col items-center justify-center gap-1" bind:this={themeElement}>
    <button
      type="button"
      class={`flex flex-col items-center gap-1 ${isThemeOpen ? 'text-accent' : 'text-muted'}`}
      aria-label="Choose theme"
      aria-expanded={isThemeOpen}
      aria-haspopup="listbox"
      onclick={() => {
        isThemeOpen = !isThemeOpen;
      }}
    >
      <div class={`flex h-8 w-8 items-center justify-center rounded-[10px] ${isThemeOpen ? 'bg-accent/10' : ''}`}>
        <PaletteIcon size={18} />
      </div>
      <span class="text-[10px] font-medium">Theme</span>
    </button>

    {#if isThemeOpen}
      <div
        class="absolute right-0 z-10 flex w-44 flex-col gap-0.5 rounded-xl border border-border bg-bg-card p-2 shadow-2xl"
        style:bottom="calc(72px + env(safe-area-inset-bottom))"
      >
        <div class="flex items-center gap-1.5 px-2 py-1">
          <MoonIcon size={10} class="text-muted" />
          <span class="text-[9px] font-mono uppercase tracking-wider text-muted">Dark</span>
        </div>
        {#each darkThemes as candidate (candidate.id)}
          <button
            type="button"
            class={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-mono transition-colors ${theme === candidate.id ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-bg-secondary hover:text-foreground'}`}
            onclick={() => {
              void onThemeChange(candidate.id);
              isThemeOpen = false;
            }}
          >
            <div class="flex gap-0.5">
              <div class="h-2 w-2 rounded-full" style:background-color={candidate.accent}></div>
              <div class="h-2 w-2 rounded-full" style:background-color={candidate.accentSecondary}></div>
            </div>
            {candidate.name}
          </button>
        {/each}
        <div class="my-1 h-px bg-border"></div>
        <div class="flex items-center gap-1.5 px-2 py-1">
          <SunIcon size={10} class="text-muted" />
          <span class="text-[9px] font-mono uppercase tracking-wider text-muted">Light</span>
        </div>
        {#each lightThemes as candidate (candidate.id)}
          <button
            type="button"
            class={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-mono transition-colors ${theme === candidate.id ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-bg-secondary hover:text-foreground'}`}
            onclick={() => {
              void onThemeChange(candidate.id);
              isThemeOpen = false;
            }}
          >
            <div class="flex gap-0.5">
              <div class="h-2 w-2 rounded-full" style:background-color={candidate.accent}></div>
              <div class="h-2 w-2 rounded-full" style:background-color={candidate.accentSecondary}></div>
            </div>
            {candidate.name}
          </button>
        {/each}

        {#if onLogout}
          <div class="my-1 h-px bg-border"></div>
          <button
            type="button"
            class="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-mono text-muted transition-colors hover:bg-bg-secondary hover:text-accent-secondary"
            onclick={() => {
              void onLogout();
              isThemeOpen = false;
            }}
          >
            <LogOutIcon size={12} />
            Logout
          </button>
        {/if}
      </div>
    {/if}
  </div>
</nav>
