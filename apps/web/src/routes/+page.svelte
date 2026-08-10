<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import { readAuthSession } from '$lib/auth/session';
  import PublicLanding from '$lib/components/PublicLanding.svelte';
  import TelegramRootEntry from '$lib/components/TelegramRootEntry.svelte';
  import { loadTelegramWebApp } from '$lib/telegram/webApp';

  let redirecting = $state(false);
  let telegramEntry = $state(false);

  function isTelegramContainer(): boolean {
    return Boolean(window.Telegram?.WebApp)
      || /Telegram/i.test(window.navigator.userAgent);
  }

  function hasTelegramLaunchIntent(): boolean {
    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    return ['startapp', 'tgWebAppStartParam', 'tgWebAppData', 'tgWebAppVersion', 'tgWebAppPlatform']
      .some((key) => search.has(key) || hash.has(key));
  }

  onMount(() => {
    void (async () => {
      const telegramLaunch = isTelegramContainer() || hasTelegramLaunchIntent();
      if (!telegramLaunch) {
        if (readAuthSession()) {
          redirecting = true;
          await goto(resolve<'/app/(protected)/dashboard'>('/app/(protected)/dashboard', {}), { replaceState: true });
        }
        return;
      }
      telegramEntry = true;
      try {
        const telegram = await loadTelegramWebApp();
        telegramEntry = telegramLaunch || Boolean(telegram?.initData);
        if (!telegramEntry && readAuthSession()) {
          redirecting = true;
          await goto(resolve<'/app/(protected)/dashboard'>('/app/(protected)/dashboard', {}), { replaceState: true });
        }
      } catch {
        if (readAuthSession()) {
          redirecting = true;
          await goto(resolve<'/app/(protected)/dashboard'>('/app/(protected)/dashboard', {}), { replaceState: true });
        }
      }
    })();
  });
</script>

{#if telegramEntry}
  <TelegramRootEntry enabled={telegramEntry} />
{:else}
  <PublicLanding {redirecting} />
{/if}
