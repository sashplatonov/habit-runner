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

  function openConnectedTelegramMiniApp() {
    const miniAppUrl = telegramMiniAppUrl();
    if (!miniAppUrl) {
      error = 'Telegram launch is not configured for this environment.';
      return;
    }
    const popup = window.open(miniAppUrl, '_blank');
    if (popup) {
      popup.opener = null;
    } else {
      error = 'Your browser blocked the Telegram window. Use Open Mini App to retry.';
    }
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

<section class="connections" aria-labelledby="connections-title" aria-busy={loading || working}>
  <p class="eyebrow">Account</p>
  <h1 id="connections-title">Account connections</h1>
  <p class="muted">Use the same habits and check-ins wherever you sign in.</p>

  {#if error}
    <div class="error-row" role="alert">
      <p class="error">{error}</p>
      <button class="button" type="button" disabled={working} onclick={() => void refresh()}>Retry</button>
    </div>
  {/if}
  {#if working}<p class="status" role="status">Updating account connections…</p>{/if}
  {#if loading}<p aria-live="polite">Loading connection status…</p>
  {:else}
    <div class="card">
      <div class="card-main"><strong>Google / email</strong><span class="identity">{connection('GOOGLE')?.displayName ?? 'Not connected'}</span></div>
      {#if connection('GOOGLE')?.connected}
        <div class="card-actions"><div class="status-group" aria-label={canDetach('GOOGLE') ? 'Google/email connected' : 'Google/email connected and required while Telegram is unlinked'}><span class="status-chip connected"><span class="status-dot" aria-hidden="true"></span>Connected</span>{#if !canDetach('GOOGLE')}<span class="status-chip required" title="Required while Telegram is unlinked">Required</span>{/if}</div>{#if canDetach('GOOGLE')}<button class="button" type="button" disabled={working} onclick={() => void unlink('GOOGLE')}>Unlink</button>{/if}</div>
      {:else}<span class="badge">Available</span>{/if}
    </div>

    <div class="card">
      <div class="card-main"><strong>Telegram</strong><span class="identity">{connection('TELEGRAM')?.connected ? (connection('TELEGRAM')?.displayName ?? 'Connected Telegram user') : 'Not connected'}</span></div>
      {#if connection('TELEGRAM')?.connected}
        <div class="card-actions"><div class="status-group" aria-label={canDetach('TELEGRAM') ? 'Telegram connected' : 'Telegram connected and required while Google/email is unlinked'}><span class="status-chip connected"><span class="status-dot" aria-hidden="true"></span>Connected</span>{#if !canDetach('TELEGRAM')}<span class="status-chip required" title="Required while Google/email is unlinked">Required</span>{/if}</div>{#if telegramMiniAppUrl()}<button class="mini-app-link" type="button" onclick={openConnectedTelegramMiniApp}>Open Mini App</button>{/if}{#if canDetach('TELEGRAM')}<button class="button" type="button" disabled={working} onclick={() => void unlink('TELEGRAM')}>Unlink</button>{/if}</div>
      {:else}<button class="button primary" type="button" disabled={working} onclick={() => void openTelegramMiniApp()}>Link Telegram</button>{/if}
    </div>

  {/if}
  <dialog bind:this={unlinkDialog} class="confirm" aria-labelledby="unlink-title" aria-describedby="unlink-description" onclose={() => { confirmingProvider = null; }}>
    {#if confirmingProvider}
      <strong id="unlink-title">Unlink {confirmingProvider === 'TELEGRAM' ? 'Telegram' : 'Google/email'}?</strong>
      <p id="unlink-description">You will no longer be able to use this provider to sign in.</p>
      <div class="card-actions"><button class="button" type="button" onclick={closeUnlinkDialog}>Cancel</button><button class="button primary" type="button" disabled={working} onclick={() => void confirmUnlink()}>Unlink</button></div>
    {/if}
  </dialog>
</section>

<style>
  .connections { max-width: 40rem; margin: 0 auto; padding: 1.5rem; }
  .eyebrow { font: 600 0.7rem/1 monospace; letter-spacing: .2em; text-transform: uppercase; color: var(--color-muted, #64748b); }
  h1 { margin: .5rem 0; font-size: clamp(1.6rem, 5vw, 2.4rem); }
  .muted, .identity { color: var(--color-muted, #64748b); }
  .card { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-top: 1rem; padding: 1rem; border: 1px solid var(--color-border, #e2e8f0); border-radius: 1rem; }
  .card-main { display: grid; gap: .35rem; min-width: 0; overflow-wrap: anywhere; }
  .card-actions { display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: .75rem; }
  .status-group { display: flex; align-items: center; flex-wrap: wrap; gap: .4rem; }
  .status-chip { display: inline-flex; align-items: center; gap: .35rem; min-height: 28px; padding: 0 .65rem; border: 1px solid transparent; border-radius: 999px; font-size: .75rem; font-weight: 700; letter-spacing: .01em; white-space: nowrap; }
  .status-chip.connected { color: #166534; background: #dcfce7; border-color: #bbf7d0; }
  .status-chip.required { color: #92400e; background: #fef3c7; border-color: #fde68a; }
  .status-dot { width: .4rem; height: .4rem; border-radius: 50%; background: currentColor; }
  .badge { color: var(--color-progress, #15803d); font-size: .8rem; }
  .confirm { max-width: min(30rem, calc(100vw - 2rem)); display: grid; gap: .75rem; padding: 1rem; border: 1px solid var(--color-border, #e2e8f0); border-radius: 1rem; }
  .confirm::backdrop { background: rgb(15 23 42 / .45); }
  .button { min-height: 44px; border: 1px solid var(--color-border, #cbd5e1); border-radius: .8rem; padding: 0 1rem; cursor: pointer; }
  .primary { background: var(--color-progress, #15803d); color: white; text-align: center; display: inline-flex; align-items: center; justify-content: center; text-decoration: none; }
  .mini-app-link { border: 0; padding: 0; color: var(--color-progress, #15803d); background: transparent; font: inherit; font-size: .8rem; font-weight: 700; white-space: nowrap; cursor: pointer; }
  .error { margin: 0; color: #b91c1c; }
  .error-row { display: flex; align-items: center; justify-content: space-between; gap: .75rem; margin-top: 1rem; }
  .status { margin: .75rem 0 0; color: var(--color-muted, #64748b); font-size: .8rem; }
  @media (max-width: 480px) { .card { flex-direction: column; } .card-actions { width: 100%; justify-content: stretch; } .status-group { flex: 1 1 100%; } .card-actions .button { width: 100%; } .error-row { align-items: stretch; flex-direction: column; } .error-row .button { width: 100%; } }
</style>
