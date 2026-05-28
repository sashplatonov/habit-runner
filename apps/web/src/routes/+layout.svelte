<script lang="ts">
  import { onMount } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import '../app.css';
  import { readAuthSession } from '@/lib/auth/session';
  import { setBrowserPageViewName } from '$lib/observability/newrelic';
  import UndoToast from '$lib/components/UndoToast.svelte';
  import { themeStore } from '$lib/stores/theme';
  import { setUndoContext } from '$lib/stores/undo';
  import { installPromptStore, isStandaloneMode } from '$lib/stores/installPrompt';
  import { loadGA4, trackPageView, trackPwaInstalled } from '$lib/analytics/ga4';

  let { children } = $props();

  const undoStore = setUndoContext();

  const gscToken = import.meta.env.VITE_GSC_VERIFICATION_TOKEN as string | undefined;
  const bingToken = import.meta.env.VITE_BING_VERIFICATION_TOKEN as string | undefined;

  afterNavigate(({ to }) => {
    if (to?.url) {
      trackPageView(to.url.href);
      setBrowserPageViewName(to.url.pathname);
    }
  });

  onMount(() => {
    loadGA4();
    void themeStore.initialize(Boolean(readAuthSession()));

    // Capture beforeinstallprompt — delay showing until user has taken action
    if (!isStandaloneMode()) {
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        installPromptStore.capture(e as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> });
      });

      window.addEventListener('appinstalled', () => {
        installPromptStore.clear();
        trackPwaInstalled();
      });
    }
  });
</script>

<svelte:head>
  {#if gscToken}
    <meta name="google-site-verification" content={gscToken} />
  {/if}
  {#if bingToken}
    <meta name="msvalidate.01" content={bingToken} />
  {/if}
</svelte:head>

{@render children()}

{#if $undoStore}
  <UndoToast
    message={$undoStore.message}
    actionLabel={$undoStore.actionLabel}
    onAction={$undoStore.onUndo ? () => undoStore.runUndo() : undefined}
    onClose={() => undoStore.close()}
  />
{/if}
