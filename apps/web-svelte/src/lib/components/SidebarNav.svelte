<script lang="ts">
  import { page } from '$app/stores';
  import {
    LayoutDashboard,
    BarChart2,
    Plus,
    Palette,
    LogOut,
    Moon,
    Sun
  } from 'lucide-svelte';
  import { THEMES, type ThemeId } from '$lib/stores/themeStore';
  import SyncStatus from './SyncStatus.svelte';
  import type { SyncRunResult } from '$lib/sync/syncEngine';

  let {
    theme,
    onThemeChange,
    onLogout,
    syncState
  }: {
    theme: ThemeId;
    onThemeChange: (id: ThemeId) => void;
    onLogout?: () => void | Promise<void>;
    syncState?: SyncRunResult;
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

  function isActive(path: string): boolean {
    return $page.url.pathname === path;
  }
</script>

<aside
  class="hidden sm:flex fixed left-0 top-0 h-screen w-[220px] flex-col bg-bg-primary border-r border-border px-3 py-4 z-50"
  style="padding-top: calc(var(--safe-area-inset-top, 0px) + 1rem)"
  aria-label="Sidebar navigation"
>
  <a href="/dashboard" class="flex items-center gap-2.5 px-2 mb-5">
    <img src="/app-icon.svg" alt="Habbit Runner" class="w-8 h-8 rounded-lg flex-shrink-0 object-contain" />
    <span class="text-sm font-bold tracking-tight">Habbit Runner</span>
  </a>

  <SyncStatus {syncState} />

  <a
    href="/habit/new"
    class="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-accent/10 border border-accent/30 text-accent text-sm font-semibold hover:bg-accent/20 hover:shadow-[0_0_16px_var(--glow)] transition-all duration-200 mb-4"
  >
    <Plus size={16} />
    New Habit
  </a>

  <div class="text-[10px] font-mono text-muted uppercase tracking-[0.2em] px-2 mb-1">Navigate</div>
  <nav class="flex flex-col gap-0.5">
    <a
      href="/dashboard"
      class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 {isActive('/dashboard') ? 'bg-accent/10 text-accent' : 'text-muted hover:text-foreground hover:bg-bg-secondary'}"
    >
      <LayoutDashboard size={16} />
      Dashboard
    </a>
    <a
      href="/stats"
      class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 {isActive('/stats') ? 'bg-accent-secondary/10 text-accent-secondary' : 'text-muted hover:text-foreground hover:bg-bg-secondary'}"
    >
      <BarChart2 size={16} />
      Stats
    </a>
  </nav>

  <div class="flex-1"></div>

  <div class="border-t border-border pt-3">
    <div class="text-[10px] font-mono text-muted uppercase tracking-[0.2em] px-2 mb-1">Appearance</div>
    <div bind:this={themeRef} class="relative">
      <button
        type="button"
        onclick={() => (isThemeOpen = !isThemeOpen)}
        class="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 {isThemeOpen ? 'bg-bg-secondary text-foreground' : 'text-muted hover:text-foreground hover:bg-bg-secondary'}"
        aria-label="Choose color theme"
        aria-expanded={isThemeOpen}
        aria-haspopup="listbox"
      >
        <Palette size={16} />
        <span class="flex-1 text-left capitalize">{theme}</span>
        <span class="text-[10px] opacity-50">{isThemeOpen ? '▲' : '▼'}</span>
      </button>

      {#if isThemeOpen}
        <div class="absolute left-0 bottom-full mb-1 w-full bg-bg-card border border-border rounded-xl shadow-2xl p-1.5 flex flex-col gap-0.5 z-10">
          <div class="flex items-center gap-1.5 px-2 py-1">
            <Moon size={10} class="text-muted" />
            <span class="text-[9px] font-mono text-muted uppercase tracking-wider">Dark</span>
          </div>
          {#each darkThemes as t}
            <button
              type="button"
              onclick={() => onThemeChange(t.id)}
              class="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-mono transition-colors {theme === t.id ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-bg-secondary hover:text-foreground'}"
              aria-label="Switch to {t.name} theme"
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
              onclick={() => onThemeChange(t.id)}
              class="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-mono transition-colors {theme === t.id ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-bg-secondary hover:text-foreground'}"
              aria-label="Switch to {t.name} theme"
            >
              <div class="flex gap-0.5">
                <div class="w-2 h-2 rounded-full" style="background-color: {t.accent}"></div>
                <div class="w-2 h-2 rounded-full" style="background-color: {t.accentSecondary}"></div>
              </div>
              {t.name}
            </button>
          {/each}
        </div>
      {/if}
    </div>

    {#if onLogout}
      <button
        type="button"
        onclick={onLogout}
        class="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-muted hover:text-accent-secondary hover:bg-accent-secondary/10 transition-all duration-200 mt-0.5"
        aria-label="Log out"
      >
        <LogOut size={16} />
        Logout
      </button>
    {/if}
  </div>
</aside>
