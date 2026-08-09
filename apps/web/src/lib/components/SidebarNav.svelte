<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import {
    BarChart2Icon,
    LayoutDashboardIcon,
    LogOutIcon,
    PaletteIcon,
    PlusIcon,
  } from 'lucide-svelte';
  import type { ThemeId } from '$lib/theme/themes';
  import ThemePicker from '$lib/components/ThemePicker.svelte';

  type Props = {
    theme: ThemeId;
    onThemeChange: (id: ThemeId) => void | Promise<void>;
    onLogout?: () => void | Promise<void>;
    routeBase?: '/app/(protected)' | '/showcase';
  };

  let { theme, onThemeChange, onLogout, routeBase = '/app/(protected)' }: Props = $props();

  let isThemeOpen = $state(false);
  let themeElement = $state<HTMLDivElement | null>(null);

  const dashboardHref = $derived(routeBase === '/showcase' ? resolve('/showcase', {}) : resolve<'/app/(protected)/dashboard'>('/app/(protected)/dashboard', {}));
  const statsHref = $derived(routeBase === '/showcase' ? resolve('/showcase/stats', {}) : resolve<'/app/(protected)/stats'>('/app/(protected)/stats', {}));
  const newHabitHref = $derived(routeBase === '/showcase' ? resolve('/showcase/habit/new', {}) : resolve<'/app/(protected)/habit/new'>('/app/(protected)/habit/new', {}));

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

  function handleWindowKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      isThemeOpen = false;
    }
  }
</script>

<svelte:window onmousedown={handleWindowClick} onkeydown={handleWindowKeydown} />

<aside
  class="fixed left-0 top-0 z-50 hidden h-screen w-[252px] flex-col border-r border-border bg-bg-secondary/86 px-4 py-4 shadow-[0_24px_64px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:flex"
  style:padding-top="calc(var(--safe-area-inset-top, 0px) + 1rem)"
  aria-label="Sidebar navigation"
>
  <a class="mb-5 flex items-center gap-3 rounded-[1.5rem] border border-border bg-bg-card/96 px-3 py-3 shadow-[0_16px_36px_rgba(15,23,42,0.08)]" href={resolve(dashboardHref, {})}>
    <img src="/app-icon.svg" alt="Habbit Runner" width="40" height="40" class="h-10 w-10 flex-shrink-0 rounded-2xl object-contain" />
    <div>
      <span class="block text-[9px] uppercase tracking-[0.26em] text-muted">Workspace</span>
      <span class="block text-sm font-semibold tracking-tight">Habbit Runner</span>
    </div>
  </a>

  <a
    class="mb-4 flex items-center gap-2 rounded-[1.25rem] border border-progress/20 bg-progress/10 px-3 py-3 text-sm font-semibold text-progress transition-colors hover:border-progress/30 hover:bg-progress/10"
    href={resolve(newHabitHref, {})}
  >
    <PlusIcon size={16} />
    New Habit
  </a>

  <div class="mb-1 px-2 text-[10px] font-mono uppercase tracking-[0.2em] text-muted">Navigate</div>
  <nav class="flex flex-col gap-1">
    <a
      class={`flex items-center gap-2.5 rounded-[1.25rem] px-3 py-2.5 text-sm font-medium transition-colors ${isActive(dashboardHref) ? 'border border-progress/20 bg-bg-card text-foreground shadow-[0_12px_30px_rgba(15,23,42,0.08)]' : 'text-muted hover:bg-bg-card/80 hover:text-foreground'}`}
      href={resolve(dashboardHref, {})}
      aria-current={isActive(dashboardHref) ? 'page' : undefined}
    >
      <LayoutDashboardIcon size={16} />
      Today
    </a>
    <a
      class={`flex items-center gap-2.5 rounded-[1.25rem] px-3 py-2.5 text-sm font-medium transition-colors ${isActive(statsHref) ? 'border border-progress/20 bg-bg-card text-foreground shadow-[0_12px_30px_rgba(15,23,42,0.08)]' : 'text-muted hover:bg-bg-card/80 hover:text-foreground'}`}
      href={resolve(statsHref, {})}
      aria-current={isActive(statsHref) ? 'page' : undefined}
    >
      <BarChart2Icon size={16} />
      Progress
    </a>
  </nav>

  <div class="flex-1"></div>

  <div class="border-t border-border pt-3">
    <div class="mb-1 px-2 text-[10px] font-mono uppercase tracking-[0.2em] text-muted">Appearance</div>
    <div class="relative" bind:this={themeElement}>
      <button
        type="button"
        class={`flex min-h-11 w-full items-center gap-2.5 rounded-[1.25rem] px-3 py-2.5 text-sm font-medium transition-colors ${isThemeOpen ? 'bg-bg-card text-foreground shadow-[0_12px_30px_rgba(15,23,42,0.08)]' : 'text-muted hover:bg-bg-card/80 hover:text-foreground'}`}
        aria-label="Choose color theme"
        aria-expanded={isThemeOpen}
        aria-controls="sidebar-theme-picker"
        onclick={() => {
          isThemeOpen = !isThemeOpen;
        }}
      >
        <PaletteIcon size={16} />
        <span class="flex-1 text-left capitalize">{theme}</span>
        <span class="text-[10px] opacity-50">{isThemeOpen ? '▲' : '▼'}</span>
      </button>

      {#if isThemeOpen}
        <div id="sidebar-theme-picker" class="absolute bottom-full left-0 z-10 mb-2 max-h-[min(70vh,40rem)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-[1.5rem] border border-border bg-bg-card p-3 shadow-[0_22px_60px_rgba(15,23,42,0.14)]">
          <ThemePicker
            {theme}
            {onThemeChange}
            onChoose={() => {
              isThemeOpen = false;
            }}
          />
        </div>
      {/if}
    </div>

    {#if onLogout}
      <button
        type="button"
        class="mt-1 flex w-full items-center gap-2.5 rounded-[1.25rem] px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-bg-card/80 hover:text-foreground"
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
