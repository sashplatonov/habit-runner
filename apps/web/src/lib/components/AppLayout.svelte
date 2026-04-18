<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ThemeId } from '$lib/theme/themes';
  import SidebarNav from '$lib/components/SidebarNav.svelte';
  import BottomNav from '$lib/components/BottomNav.svelte';

  type Props = {
    theme: ThemeId;
    onThemeChange: (id: ThemeId) => void | Promise<void>;
    onLogout?: () => void | Promise<void>;
    children: Snippet;
  };

  let { theme, onThemeChange, onLogout, children }: Props = $props();
</script>

<div class="min-h-screen bg-bg-primary">
  <a
    href="#main-content"
    class="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[9999] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-bg-primary focus:shadow-lg"
  >
    Skip to main content
  </a>

  <SidebarNav
    {theme}
    {onThemeChange}
    {onLogout}
  />

  <div class="sm:ml-[220px]">
    <main
      id="main-content"
      tabindex="-1"
      class="focus:outline-none sm:!pb-0"
      style:padding-top="var(--safe-area-inset-top, 0px)"
      style:padding-bottom="calc(72px + var(--safe-area-inset-bottom, 0px))"
    >
      {@render children()}
    </main>

    <footer class="py-4 text-center">
      <span class="select-none text-[11px] font-mono text-muted/30">
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
