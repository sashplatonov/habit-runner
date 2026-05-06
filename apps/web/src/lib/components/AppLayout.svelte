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

<div class="relative min-h-screen overflow-x-clip bg-bg-primary text-foreground">
  <div aria-hidden="true" class="pointer-events-none fixed inset-0 -z-10 hidden sm:block">
    <div class="absolute left-[-9rem] top-[-8rem] h-[24rem] w-[24rem] rounded-full bg-accent/10 blur-3xl"></div>
    <div class="absolute right-[-7rem] top-[14rem] h-[22rem] w-[22rem] rounded-full bg-accent-secondary/10 blur-3xl"></div>
  </div>

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

    <footer class="px-4 py-5 text-center sm:px-6">
      <div class="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-bg-secondary/75 px-4 py-2 shadow-[0_14px_34px_rgba(15,23,42,0.06)] backdrop-blur-sm">
        <span class="select-none text-[11px] font-mono text-muted/70">
        {new Date(__BUILD_TIME__).toLocaleString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        })}
        </span>
      </div>
    </footer>
  </div>

  <BottomNav {theme} {onThemeChange} {onLogout} />
</div>
