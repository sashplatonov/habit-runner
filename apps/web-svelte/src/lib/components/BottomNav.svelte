<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import {
    LayoutDashboard,
    BarChart2,
    Plus,
    Palette,
    Search,
    Moon,
    Sun,
    LogOut
  } from 'lucide-svelte';
  import { THEMES, type ThemeId } from '$lib/stores/themeStore';

  let {
    theme,
    onThemeChange,
    onLogout
  }: {
    theme: ThemeId;
    onThemeChange: (id: ThemeId) => void;
    onLogout?: () => void | Promise<void>;
  } = $props();

  let isThemeOpen = $state(false);
  let themeRef = $state<HTMLDivElement | null>(null);

  const darkThemes = THEMES.filter((t) => t.group === 'dark');
  const lightThemes = THEMES.filter((t) => t.group === 'light');

  $effect(() => {
    if (!isThemeOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (themeRef && !themeRef.contains(e.target as Node)) {
        isThemeOpen = false;
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  });

  const isHome = $derived($page.url.pathname === '/dashboard');
  const isStats = $derived($page.url.pathname === '/stats');

  function handleSearch() {
    if ($page.url.pathname !== '/dashboard') {
      goto('/dashboard#habit-search');
    }
    setTimeout(() => {
      document.getElementById('habit-search')?.focus();
    }, 100);
  }
</script>

<nav
  class="flex sm:hidden fixed bottom-0 left-0 right-0 bg-bg-primary/95 border-t border-border backdrop-blur-sm z-50"
  style="height: calc(72px + env(safe-area-inset-bottom)); padding-bottom: env(safe-area-inset-bottom)"
  aria-label="Mobile navigation"
>
  <a
    href="/dashboard"
    class="flex-1 flex flex-col items-center justify-center gap-1 transition-colors {isHome ? 'text-accent' : 'text-muted'}"
    aria-label="Dashboard"
    aria-current={isHome ? 'page' : undefined}
  >
    <div class="w-8 h-8 flex items-center justify-center rounded-[10px] {isHome ? 'bg-accent/10' : ''}">
      <LayoutDashboard size={18} />
    </div>
    <span class="text-[10px] font-medium">Dashboard</span>
  </a>

  <a
    href="/stats"
    class="flex-1 flex flex-col items-center justify-center gap-1 transition-colors {isStats ? 'text-accent' : 'text-muted'}"
    aria-label="Stats"
    aria-current={isStats ? 'page' : undefined}
  >
    <div class="w-8 h-8 flex items-center justify-center rounded-[10px] {isStats ? 'bg-accent/10' : ''}">
      <BarChart2 size={18} />
    </div>
    <span class="text-[10px] font-medium">Stats</span>
  </a>

  <div class="flex-[0_0_72px] flex items-center justify-center">
    <a
      href="/habit/new"
      class="w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-bg-primary bg-accent"
      style="box-shadow: 0 0 20px var(--glow), 0 8px 16px rgba(0,0,0,0.4)"
      aria-label="New habit"
    >
      <Plus size={24} />
    </a>
  </div>

  <button
    type="button"
    onclick={handleSearch}
    class="flex-1 flex flex-col items-center justify-center gap-1 text-muted hover:text-accent transition-colors"
    aria-label="Search habits"
  >
    <div class="w-8 h-8 flex items-center justify-center rounded-[10px]">
      <Search size={18} />
    </div>
    <span class="text-[10px] font-medium">Search</span>
  </button>

  <div bind:this={themeRef} class="flex-1 flex flex-col items-center justify-center gap-1 relative">
    <button
      type="button"
      onclick={() => (isThemeOpen = !isThemeOpen)}
      class="flex flex-col items-center gap-1 {isThemeOpen ? 'text-accent' : 'text-muted'}"
      aria-label="Choose theme"
      aria-expanded={isThemeOpen}
      aria-haspopup="listbox"
    >
      <div class="w-8 h-8 flex items-center justify-center rounded-[10px] {isThemeOpen ? 'bg-accent/10' : ''}">
        <Palette size={18} />
      </div>
      <span class="text-[10px] font-medium">Theme</span>
    </button>

    {#if isThemeOpen}
      <div
        class="absolute right-0 w-44 bg-bg-card border border-border rounded-xl shadow-2xl p-2 flex flex-col gap-0.5 z-10"
        style="bottom: calc(72px + env(safe-area-inset-bottom))"
      >
        <div class="flex items-center gap-1.5 px-2 py-1">
          <Moon size={10} class="text-muted" />
          <span class="text-[9px] font-mono text-muted uppercase tracking-wider">Dark</span>
        </div>
        {#each darkThemes as t}
          <button
            type="button"
            onclick={() => { onThemeChange(t.id); isThemeOpen = false; }}
            class="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-mono transition-colors {theme === t.id ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-bg-secondary hover:text-foreground'}"
          >
            <div class="flex gap-0.5">
              <div class="w-2 h-2 rounded-full" style="background-color: {t.accent}"></div>
              <div class="w-2 h-2 rounded-full" style="background-color: {t.accentSecondary}"></div>
            </div>
            {t.name}
          </button>
        {/each}
        <div class="h-px bg-border my-1"></div>
        <div class="flex items-center gap-1.5 px-2 py-1">
          <Sun size={10} class="text-muted" />
          <span class="text-[9px] font-mono text-muted uppercase tracking-wider">Light</span>
        </div>
        {#each lightThemes as t}
          <button
            type="button"
            onclick={() => { onThemeChange(t.id); isThemeOpen = false; }}
            class="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-mono transition-colors {theme === t.id ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-bg-secondary hover:text-foreground'}"
          >
            <div class="flex gap-0.5">
              <div class="w-2 h-2 rounded-full" style="background-color: {t.accent}"></div>
              <div class="w-2 h-2 rounded-full" style="background-color: {t.accentSecondary}"></div>
            </div>
            {t.name}
          </button>
        {/each}
        {#if onLogout}
          <div class="h-px bg-border my-1"></div>
          <button
            type="button"
            onclick={() => { void onLogout(); isThemeOpen = false; }}
            class="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-mono text-muted hover:bg-bg-secondary hover:text-accent-secondary transition-colors"
          >
            <LogOut size={12} />
            Logout
          </button>
        {/if}
      </div>
    {/if}
  </div>
</nav>
