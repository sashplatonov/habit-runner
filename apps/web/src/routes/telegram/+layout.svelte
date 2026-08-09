<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import type { Snippet } from 'svelte';
  import { authenticateTelegramMiniApp, completeTelegramPairing } from '@/lib/telegram/session';
  import { loadTelegramWebApp } from '@/lib/telegram/webApp';
  type Props = { children: Snippet };
  let { children }: Props = $props();
  let phase = $state<'loading' | 'ready' | 'error'>('loading');
  let errorMessage = $state('');
  onMount(() => {
    authenticateTelegramMiniApp()
      .then(async () => {
        const telegram = await loadTelegramWebApp();
        if (telegram) {
          await completeTelegramPairing(telegram);
        }
        phase = 'ready';
        await goto(resolve('/app/(protected)/dashboard', {}), { replaceState: true });
      })
      .catch((cause: unknown) => { phase = 'error'; errorMessage = cause instanceof Error ? cause.message : 'Telegram authentication failed.'; });
  });
</script>

<svelte:head><meta name="theme-color" content="var(--telegram-bg-color, #ffffff)" /></svelte:head>
{#if phase === 'loading'}<main class="telegram-shell" aria-live="polite">Connecting to Telegram…</main>
{:else if phase === 'error'}<main class="telegram-shell"><h1>Telegram Mini App</h1><p>{errorMessage}</p><button type="button" onclick={() => location.reload()}>Retry</button></main>
{:else}{@render children()}{/if}

<style>
  :global(body) { margin: 0; background: var(--telegram-bg-color, #fff); color: var(--telegram-text-color, #111827); }
  .telegram-shell { min-height: 100dvh; padding: max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom)); display: grid; place-content: center; gap: 12px; text-align: center; }
  button { min-height: 44px; padding: 0 18px; }
</style>
