<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import { readAuthSession } from '$lib/auth/session';
  import PublicLanding from '$lib/components/PublicLanding.svelte';
  import TelegramRootEntry from '$lib/components/TelegramRootEntry.svelte';

  let redirecting = $state(false);
  let telegramEntry = $state(false);
  let telegramChecked = $state(false);

  onMount(() => {
    void (async () => {
      const { loadTelegramWebApp } = await import('$lib/telegram/webApp');
      const telegram = await loadTelegramWebApp();
      telegramEntry = Boolean(telegram?.initData);
      telegramChecked = true;
      if (!telegramEntry && readAuthSession()) {
        redirecting = true;
        await goto(resolve<'/app/(protected)/dashboard'>('/app/(protected)/dashboard', {}), { replaceState: true });
      }
    })();
  });
</script>

{#if !telegramChecked || telegramEntry}
  <TelegramRootEntry enabled={telegramEntry} />
{:else}
  <PublicLanding {redirecting} />
{/if}
