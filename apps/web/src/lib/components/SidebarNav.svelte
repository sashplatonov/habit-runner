<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import {
    BarChart2Icon,
    LayoutDashboardIcon,
    LogOutIcon,
    MoonIcon,
    PaletteIcon,
    PlusIcon,
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

  function isActive(path: string) {
    return page.url.pathname === path || (path !== dashboardHref && page.url.pathname.startsWith(path));
  }

  function handleWindowClick(event: MouseEvent) {
    if (!isThemeOpen) {
      return;
    }

    const target = event.target;
    if (themeElement && target instanceof Node && !themeElement.contains(target)) {
      isThemeOpen = false;
    }
  }
</script>

<svelte:window onmousedown={handleWindowClick} />

<aside
  class="fixed left-0 top-0 z-50 hidden h-screen w-[220px] flex-col border-r border-border bg-bg-secondary/82 px-3 py-4 shadow-[0_24px_64px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:flex"
  style:padding-top="calc(var(--safe-area-inset-top, 0px) + 1rem)"
  aria-label="Sidebar navigation"
>
  <a class="mb-5 flex items-center gap-3 rounded-2xl border border-border bg-bg-card/92 px-3 py-3 shadow-[0_18px_48px_rgba(15,23,42,0.08)]" href={dashboardHref}>
    <img src="/app-icon.svg" alt="Habbit Runner" class="h-9 w-9 flex-shrink-0 rounded-2xl object-contain shadow-[0_10px_24px_rgba(49,105,255,0.16)]" />
    <div>
      <span class="block text-[9px] uppercase tracking-[0.26em] text-muted">Workspace</span>
      <span class="block text-sm font-bold tracking-tight">Habbit Runner</span>
    </div>
  </a>

  <a
    class="mb-4 flex items-center gap-2 rounded-2xl border border-accent/25 bg-[linear-gradient(135deg,rgba(49,105,255,0.12),rgba(16,179,154,0.1))] px-3 py-3 text-sm font-semibold text-accent transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_38px_var(--glow)]"
    href={resolve<'/app/(protected)/habit/new'>('/app/(protected)/habit/new', {})}
  >
    <PlusIcon size={16} />
    New Habit
  </a>

  <div class="mb-1 px-2 text-[10px] font-mono uppercase tracking-[0.2em] text-muted">Navigate</div>
  <nav class="flex flex-col gap-1">
    <a
      class={`flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${isActive(dashboardHref) ? 'border border-accent/20 bg-white text-accent shadow-[0_14px_32px_rgba(49,105,255,0.08)]' : 'text-muted hover:bg-bg-card hover:text-foreground'}`}
      href={dashboardHref}
      aria-current={isActive(dashboardHref) ? 'page' : undefined}
    >
      <LayoutDashboardIcon size={16} />
      Dashboard
    </a>
    <a
      class={`flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${isActive(statsHref) ? 'border border-accent-secondary/20 bg-white text-accent-secondary shadow-[0_14px_32px_rgba(16,179,154,0.08)]' : 'text-muted hover:bg-bg-card hover:text-foreground'}`}
      href={statsHref}
      aria-current={isActive(statsHref) ? 'page' : undefined}
    >
      <BarChart2Icon size={16} />
      Stats
    </a>
  </nav>

  <div class="flex-1"></div>

  <div class="border-t border-border pt-3">
    <div class="mb-1 px-2 text-[10px] font-mono uppercase tracking-[0.2em] text-muted">Appearance</div>
    <div class="relative" bind:this={themeElement}>
      <button
        type="button"
        class={`flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${isThemeOpen ? 'bg-white text-foreground shadow-[0_14px_32px_rgba(15,23,42,0.08)]' : 'text-muted hover:bg-bg-card hover:text-foreground'}`}
        aria-label="Choose color theme"
        aria-expanded={isThemeOpen}
        aria-haspopup="listbox"
        onclick={() => {
          isThemeOpen = !isThemeOpen;
        }}
      >
        <PaletteIcon size={16} />
        <span class="flex-1 text-left capitalize">{theme}</span>
        <span class="text-[10px] opacity-50">{isThemeOpen ? '▲' : '▼'}</span>
      </button>

      {#if isThemeOpen}
        <div class="absolute bottom-full left-0 z-10 mb-2 flex w-full flex-col gap-0.5 rounded-[1.5rem] border border-border bg-bg-card p-2 shadow-[0_22px_60px_rgba(15,23,42,0.14)]">
          <div class="flex items-center gap-1.5 px-2 py-1">
            <MoonIcon size={10} class="text-muted" />
            <span class="text-[9px] font-mono uppercase tracking-wider text-muted">Dark</span>
          </div>
          {#each darkThemes as candidate (candidate.id)}
            <button
              type="button"
              class={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-mono transition-colors ${theme === candidate.id ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-bg-secondary hover:text-foreground'}`}
              aria-label={`Switch to ${candidate.name} theme`}
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
              aria-label={`Switch to ${candidate.name} theme`}
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
        </div>
      {/if}
    </div>

    {#if onLogout}
      <button
        type="button"
        class="mt-1 flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-medium text-muted transition-all duration-200 hover:bg-bg-card hover:text-accent-secondary"
        aria-label="Log out"
        onclick={() => {
          void onLogout();
        }}
      >
        <LogOutIcon size={16} />
        Logout
      </button>
    {/if}
  </div>
</aside>
