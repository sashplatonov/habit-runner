<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import {
    BarChart2Icon,
    LayoutDashboardIcon,
    PlusIcon,
    MoreHorizontalIcon
  } from 'lucide-svelte';
  import type { ThemeId } from '$lib/theme/themes';
  import MobileMoreSheet from '$lib/components/MobileMoreSheet.svelte';

  type Props = {
    theme: ThemeId;
    onThemeChange: (id: ThemeId) => void | Promise<void>;
    onLogout?: () => void | Promise<void>;
    routeBase?: '/app/(protected)' | '/showcase';
  };

  let { theme, onThemeChange, onLogout, routeBase = '/app/(protected)' }: Props = $props();

  let isMoreOpen = $state(false);
  let moreButton = $state<HTMLButtonElement | null>(null);

  const dashboardHref = routeBase === '/showcase' ? resolve('/showcase', {}) : resolve<'/app/(protected)/dashboard'>('/app/(protected)/dashboard', {});
  const statsHref = routeBase === '/showcase' ? resolve('/showcase/stats', {}) : resolve<'/app/(protected)/stats'>('/app/(protected)/stats', {});
  const newHabitHref = routeBase === '/showcase' ? resolve('/showcase/habit/new', {}) : resolve<'/app/(protected)/habit/new'>('/app/(protected)/habit/new', {});
  const isDashboard = $derived(page.url.pathname === dashboardHref);
  const isStats = $derived(page.url.pathname === statsHref);

  async function focusSearch() {
    if (!isDashboard) {
      await goto(resolve<'/app/(protected)/dashboard#habit-search'>('/app/(protected)/dashboard#habit-search', {}));
    }

    window.setTimeout(() => {
      document.getElementById('habit-search')?.focus();
    }, 100);
  }
</script>

<nav
  class="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-bg-secondary/92 shadow-[0_-18px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:hidden"
  style="touch-action: manipulation;"
  style:height="calc(76px + env(safe-area-inset-bottom))"
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
    <span class="text-[10px] font-medium">Today</span>
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
    <span class="text-[10px] font-medium">Progress</span>
  </a>

  <div class="flex flex-[0_0_72px] items-center justify-center">
    <a
      class="flex h-[54px] w-[54px] items-center justify-center rounded-[1.4rem] bg-progress text-bg-primary shadow-[0_14px_26px_rgba(15,23,42,0.18)]"
      href={newHabitHref}
      aria-label="New habit"
    >
      <PlusIcon size={24} />
    </a>
  </div>

  <button
    bind:this={moreButton}
    type="button"
    class="flex flex-1 flex-col items-center justify-center gap-1 text-muted transition-colors hover:text-accent"
    aria-label="More actions"
    onclick={() => {
      isMoreOpen = true;
    }}
  >
    <div class="flex h-8 w-8 items-center justify-center rounded-[10px]">
      <MoreHorizontalIcon size={18} />
    </div>
    <span class="text-[10px] font-medium">More</span>
  </button>

  <MobileMoreSheet
    open={isMoreOpen}
    triggerEl={moreButton}
    {theme}
    {onThemeChange}
    onClose={() => {
      isMoreOpen = false;
    }}
    {onLogout}
    onSearch={() => {
      void focusSearch();
    }}
  />
</nav>
