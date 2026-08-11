<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { detachAccountConnection, getAccountConnections, startTelegramLink, telegramMiniAppUrl, type AccountConnection, type AccountProvider } from '@/lib/api/accountLinks';

  let connections = $state<AccountConnection[]>([]);
  let loading = $state(true);
  let working = $state(false);
  let error = $state('');
  let confirmingProvider = $state<AccountProvider | null>(null);
  let unlinkDialog = $state<HTMLDialogElement | null>(null);

  function connection(provider: AccountProvider): AccountConnection | undefined {
    return connections.find((item) => item.provider === provider);
  }

  function canDetach(provider: AccountProvider): boolean {
    const otherProvider = provider === 'GOOGLE' ? 'TELEGRAM' : 'GOOGLE';
    return connection(provider)?.connected === true && connection(otherProvider)?.connected === true;
  }

  async function refresh() {
    try {
      connections = (await getAccountConnections()).connections;
      error = '';
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Unable to load account connections.';
    } finally { loading = false; }
  }

  async function openTelegramMiniApp() {
    if (!telegramMiniAppUrl('link')) {
      error = 'Telegram launch is not configured for this environment.';
      return;
    }
    const popup = window.open('', '_blank');
    if (popup) {
      popup.opener = null;
    }
    working = true; error = '';
    try {
      const result = await startTelegramLink();
      const miniAppUrl = telegramMiniAppUrl(result.token);
      if (!miniAppUrl) throw new Error('Telegram launch is not configured for this environment.');
      if (popup) {
        popup.location.replace(miniAppUrl);
      } else {
        error = 'Your browser blocked the Telegram window. Use Open Telegram to retry.';
      }
    } catch (cause) {
      popup?.close();
      error = cause instanceof Error ? cause.message : 'Unable to create a Telegram link.';
    } finally { working = false; }
  }

  async function unlink(provider: AccountProvider) {
    confirmingProvider = provider;
    await tick();
    if (unlinkDialog && !unlinkDialog.open) {
      unlinkDialog.showModal();
    }
  }

  function closeUnlinkDialog() {
    confirmingProvider = null;
    unlinkDialog?.close();
  }

  async function confirmUnlink() {
    const provider = confirmingProvider;
    if (!provider) return;
    closeUnlinkDialog();
    const label = provider === 'TELEGRAM' ? 'Telegram' : 'Google/email';
    working = true; error = '';
    try { await detachAccountConnection(provider); connections = (await getAccountConnections()).connections; }
    catch (cause) { error = cause instanceof Error ? cause.message : `Unable to unlink ${label}.`; }
    finally { working = false; }
  }

  onMount(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 3_000);
    return () => window.clearInterval(timer);
  });
</script>

<section class="connections" aria-labelledby="connections-title">
  <p class="eyebrow">Account</p>
  <h1 id="connections-title">Account connections</h1>
  <p class="muted">Use the same habits and check-ins wherever you sign in.</p>

  {#if error}<p class="error" role="alert">{error}</p>{/if}
  {#if loading}<p aria-live="polite">Loading connection status…</p>
  {:else}
    <div class="card">
      <div><strong>Google / email</strong><span>{connection('GOOGLE')?.displayName ?? 'Not connected'}</span></div>
      {#if connection('GOOGLE')?.connected}
        <div class="card-actions"><span class="badge">Connected</span>{#if canDetach('GOOGLE')}<button class="button" type="button" disabled={working} onclick={() => void unlink('GOOGLE')}>Unlink</button>{:else}<span class="badge">Required while Telegram is unlinked</span>{/if}</div>
      {:else}<span class="badge">Available</span>{/if}
    </div>

    <div class="card">
      <div><strong>Telegram</strong><span>{connection('TELEGRAM')?.connected ? (connection('TELEGRAM')?.displayName ?? 'Connected Telegram user') : 'Not connected'}</span></div>
      {#if connection('TELEGRAM')?.connected}
        <div class="card-actions"><span class="badge">Connected</span>{#if canDetach('TELEGRAM')}<button class="button" type="button" disabled={working} onclick={() => void unlink('TELEGRAM')}>Unlink</button>{:else}<span class="badge">Required while Google/email is unlinked</span>{/if}</div>
      {:else}<button class="button primary" type="button" disabled={working} onclick={() => void openTelegramMiniApp()}>Link Telegram</button>{/if}
    </div>

  {/if}
  <dialog bind:this={unlinkDialog} class="confirm" aria-labelledby="unlink-title" onclose={() => { confirmingProvider = null; }}>
    {#if confirmingProvider}
      <strong id="unlink-title">Unlink {confirmingProvider === 'TELEGRAM' ? 'Telegram' : 'Google/email'}?</strong>
      <p>You will no longer be able to use this provider to sign in.</p>
      <div class="card-actions"><button class="button" type="button" onclick={closeUnlinkDialog}>Cancel</button><button class="button primary" type="button" disabled={working} onclick={() => void confirmUnlink()}>Unlink</button></div>
    {/if}
  </dialog>
</section>

<style>
  .connections { max-width: 40rem; margin: 0 auto; padding: 1.5rem; }
  .eyebrow { font: 600 0.7rem/1 monospace; letter-spacing: .2em; text-transform: uppercase; color: var(--color-muted, #64748b); }
  h1 { margin: .5rem 0; font-size: clamp(1.6rem, 5vw, 2.4rem); }
  .muted, .card span { color: var(--color-muted, #64748b); }
  .card { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-top: 1rem; padding: 1rem; border: 1px solid var(--color-border, #e2e8f0); border-radius: 1rem; }
  .card div:first-child { display: grid; gap: .35rem; min-width: 0; }
  .card-actions { display: flex; align-items: center; gap: .75rem; }
  .badge { color: var(--color-progress, #15803d); font-size: .8rem; }
  .confirm { max-width: min(30rem, calc(100vw - 2rem)); display: grid; gap: .75rem; padding: 1rem; border: 1px solid var(--color-border, #e2e8f0); border-radius: 1rem; }
  .confirm::backdrop { background: rgb(15 23 42 / .45); }
  .button { min-height: 44px; border: 1px solid var(--color-border, #cbd5e1); border-radius: .8rem; padding: 0 1rem; cursor: pointer; }
  .primary { background: var(--color-progress, #15803d); color: white; text-align: center; display: inline-flex; align-items: center; justify-content: center; text-decoration: none; }
  .error { color: #b91c1c; }
  @media (max-width: 480px) { .card { align-items: flex-start; flex-direction: column; } .card-actions { width: 100%; justify-content: space-between; } .button.primary { width: 100%; } }
</style>
