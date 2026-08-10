<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import { authenticateTelegramMiniApp, completeTelegramPairing } from '$lib/telegram/session';
  import { loadTelegramWebApp, type TelegramWebAppAdapter } from '$lib/telegram/webApp';

  type Props = { enabled: boolean };
  let { enabled }: Props = $props();
  let webApp = $state<TelegramWebAppAdapter | null>(null);
  let mode = $state<'loading' | 'choice' | 'link' | 'error'>('loading');
  let linkCode = $state('');
  let errorMessage = $state('');
  let working = $state(false);

  async function connect(pairingToken?: string) {
    if (!webApp) return;
    working = true;
    mode = 'loading';
    errorMessage = '';
    try {
      await authenticateTelegramMiniApp();
      await completeTelegramPairing(webApp, pairingToken);
      await goto(resolve('/app/(protected)/dashboard', {}), { replaceState: true });
    } catch (cause) {
      mode = 'error';
      errorMessage = cause instanceof Error ? cause.message : 'Telegram authentication failed.';
    } finally {
      working = false;
    }
  }

  onMount(() => {
    if (!enabled) return;
    void loadTelegramWebApp().then((loaded) => {
      webApp = loaded;
      if (!loaded?.initData) {
        mode = 'error';
        errorMessage = 'Open this page inside the official Telegram app.';
        return;
      }
      if (loaded.startParam) {
        void connect(loaded.startParam);
      } else {
        mode = 'choice';
      }
    }).catch((cause: unknown) => {
      mode = 'error';
      errorMessage = cause instanceof Error ? cause.message : 'Telegram SDK failed to load.';
    });
  });
</script>

{#if !enabled}
  <main class="entry" aria-live="polite">Loading…</main>
{:else if mode === 'loading'}
  <main class="entry" aria-live="polite"><div class="card"><p role="status">Connecting to Telegram…</p></div></main>
{:else if mode === 'choice'}
  <main class="entry"><div class="card"><p class="eyebrow">Habbit Runner</p><h1>Continue in Telegram</h1><p class="muted">Use your Telegram account, or link it to an existing Google/email account.</p><button class="primary" type="button" disabled={working} onclick={() => void connect()}>Continue with Telegram</button><button class="secondary" type="button" disabled={working} onclick={() => { mode = 'link'; }}>I have a link code</button></div></main>
{:else if mode === 'link'}
  <main class="entry"><div class="card"><h1>Link your existing account</h1><p class="muted">Paste the short-lived code from Account connections on the website.</p><label for="telegram-link-code">Link code</label><input id="telegram-link-code" bind:value={linkCode} autocomplete="one-time-code" /><button class="primary" type="button" disabled={!linkCode.trim() || working} onclick={() => void connect(linkCode.trim())}>Link account</button><button class="secondary" type="button" onclick={() => { mode = 'choice'; }}>Back</button></div></main>
{:else}
  <main class="entry"><div class="card"><h1>Telegram connection needs a retry</h1><p class="error" role="alert">{errorMessage}</p><button class="primary" type="button" onclick={() => { mode = 'choice'; }}>Try again</button></div></main>
{/if}

<style>
  .entry { min-height: 100dvh; display: grid; place-items: center; padding: max(1rem, env(safe-area-inset-top)) 1rem max(1rem, env(safe-area-inset-bottom)); background: var(--telegram-bg-color, #f8fafc); color: var(--telegram-text-color, #0f172a); }
  .card { width: min(100%, 25rem); display: grid; gap: .85rem; padding: 1.5rem; border: 1px solid #e2e8f0; border-radius: 1.5rem; background: #fff; box-shadow: 0 20px 50px rgb(15 23 42 / 12%); }
  h1 { margin: 0; font-size: 1.35rem; }
  .eyebrow { margin: 0; color: #64748b; font: 600 .7rem/1 monospace; letter-spacing: .2em; text-transform: uppercase; }
  .muted { margin: 0; color: #64748b; line-height: 1.5; }
  label { font-size: .9rem; font-weight: 600; }
  input { min-height: 2.75rem; border: 1px solid #cbd5e1; border-radius: .7rem; padding: 0 .75rem; font: .9rem monospace; }
  button { min-height: 2.75rem; border-radius: .7rem; padding: 0 1rem; font-weight: 700; cursor: pointer; }
  .primary { border: 0; background: #15803d; color: #fff; }
  .secondary { border: 1px solid #cbd5e1; background: #fff; color: #334155; }
  .error { color: #b91c1c; line-height: 1.5; }
</style>
