<script lang="ts">
  import type { Snippet } from 'svelte';
  import AppLayout from '$lib/components/AppLayout.svelte';
  import AppRuntimeProvider from '$lib/app/AppRuntimeProvider.svelte';
  import { createAppRuntime } from '$lib/app/runtime';
  import { applyTheme } from '$lib/stores/theme';
  import { createShowcaseHabitsStore } from '$lib/showcase/createShowcaseHabitsStore';
  import type { ThemeId } from '$lib/theme/themes';

  type Props = { children: Snippet };
  let { children }: Props = $props();
  const showcaseStore = createShowcaseHabitsStore();
  let theme = $state<ThemeId>('cloud');
  const runtime = createAppRuntime({ habitsStore: showcaseStore, routeBase: '/showcase', isDemo: true });
</script>

<AppRuntimeProvider {runtime}>
  <AppLayout
    {theme}
    routeBase="/showcase"
    onThemeChange={(nextTheme) => {
      theme = nextTheme;
      applyTheme(nextTheme, false);
    }}
  >
    <div class="border-b border-progress/20 bg-progress/10 px-4 py-3 text-sm text-foreground sm:px-6">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <p><strong>Temporary showcase.</strong> Changes stay in memory and reset on reload.</p>
        <button class="min-h-11 rounded-full border border-progress/30 px-4 py-2 text-xs font-semibold" type="button" onclick={() => showcaseStore.reset()}>Reset demo</button>
      </div>
    </div>
    {@render children()}
  </AppLayout>
</AppRuntimeProvider>
