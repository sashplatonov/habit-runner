<script lang="ts">
  import type { Snippet } from 'svelte';
  import SidebarNav from './SidebarNav.svelte';
  import BottomNav from './BottomNav.svelte';
  import type { ThemeId } from '$lib/stores/themeStore';
  import type { SyncRunResult } from '$lib/sync/syncEngine';

  let {
    theme,
    onThemeChange,
    onLogout,
    syncState,
    children
  }: {
    theme: ThemeId;
    onThemeChange: (id: ThemeId) => void;
    onLogout?: () => void | Promise<void>;
    syncState?: SyncRunResult;
    children: Snippet;
  } = $props();
</script>

<div class="min-h-screen bg-bg-primary">
  <a
    href="#main-content"
    class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-accent focus:text-bg-primary focus:font-semibold focus:text-sm focus:shadow-lg"
  >
    Skip to main content
  </a>

  <SidebarNav {theme} {onThemeChange} {onLogout} {syncState} />

  <div class="sm:ml-[220px]">
    <main
      id="main-content"
      tabindex="-1"
      class="focus:outline-none sm:!pb-0"
      style="padding-top: var(--safe-area-inset-top, 0px); padding-bottom: calc(72px + var(--safe-area-inset-bottom, 0px))"
    >
      {@render children()}
    </main>
    <footer class="py-4 text-center">
      <span class="text-[11px] font-mono text-muted/30 select-none">
        {new Date(__BUILD_TIME__).toLocaleString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        })}
      </span>
    </footer>
  </div>

  <BottomNav {theme} {onThemeChange} {onLogout} />
</div>
