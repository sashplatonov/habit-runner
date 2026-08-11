<script lang="ts">
  import { onMount } from 'svelte';
  import { AccountLinkRequestError, cancelTelegramLink, confirmTelegramLink, detachAccountConnection, getAccountConnections, getTelegramLinkStatus, startTelegramLink, telegramMiniAppUrl, type AccountConnection, type AccountLinkStatus, type AccountProvider } from '@/lib/api/accountLinks';
  import { clearPendingTelegramLink, readPendingTelegramLink, savePendingTelegramLink } from '@/lib/telegram/pendingLink';

  let connections = $state<AccountConnection[]>([]);
  let status = $state<AccountLinkStatus | null>(null);
  let token = $state<string | null>(null);
  let linkUrl = $state<string | null>(null);
  let loading = $state(true);
  let working = $state(false);
  let error = $state('');
  let confirmingProvider = $state<AccountProvider | null>(null);

  function isExpiredChallenge(cause: unknown): boolean {
    return cause instanceof AccountLinkRequestError
      && cause.status === 400
      && cause.message.startsWith('Invalid or expired account link challenge');
  }

  function connection(provider: AccountProvider): AccountConnection | undefined {
    return connections.find((item) => item.provider === provider);
  }

  async function refresh() {
    try {
      if (token) {
        status = (await getTelegramLinkStatus(token)).status;
        if (status === 'COMPLETED') {
          clearPendingTelegramLink();
          token = null;
          linkUrl = null;
          connections = (await getAccountConnections()).connections;
        }
      } else {
        connections = (await getAccountConnections()).connections;
      }
      error = '';
    } catch (cause) {
      if (token && isExpiredChallenge(cause)) {
        clearPendingTelegramLink();
        token = null;
        linkUrl = null;
        status = null;
        error = '';
      } else {
        error = cause instanceof Error ? cause.message : 'Unable to load account connections.';
      }
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
      token = result.token;
      savePendingTelegramLink(token);
      const miniAppUrl = telegramMiniAppUrl(token);
      if (!miniAppUrl) throw new Error('Telegram launch is not configured for this environment.');
      linkUrl = miniAppUrl;
      status = 'PENDING';
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

  async function cancel() {
    if (!token) return;
    working = true;
    try { await cancelTelegramLink(token); clearPendingTelegramLink(); status = 'CANCELLED'; token = null; linkUrl = null; }
    catch (cause) { error = cause instanceof Error ? cause.message : 'Unable to cancel the link.'; }
    finally { working = false; }
  }

  async function confirm() {
    if (!token) return;
    working = true;
    try {
      await confirmTelegramLink(token);
      clearPendingTelegramLink(); status = 'COMPLETED'; token = null; linkUrl = null;
      connections = (await getAccountConnections()).connections;
    } catch (cause) { error = cause instanceof Error ? cause.message : 'Unable to confirm the link.'; }
    finally { working = false; }
  }

  async function unlink(provider: AccountProvider) {
    confirmingProvider = provider;
  }

  async function confirmUnlink() {
    const provider = confirmingProvider;
    if (!provider) return;
    confirmingProvider = null;
    const label = provider === 'TELEGRAM' ? 'Telegram' : 'Google/email';
    working = true; error = '';
    try { await detachAccountConnection(provider); connections = (await getAccountConnections()).connections; }
    catch (cause) { error = cause instanceof Error ? cause.message : `Unable to unlink ${label}.`; }
    finally { working = false; }
  }

  onMount(() => {
    token = readPendingTelegramLink();
    linkUrl = token ? telegramMiniAppUrl(token) : null;
    void refresh();
    const timer = window.setInterval(() => void refresh(), 10_000);
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
        <div class="card-actions"><span class="badge">Connected</span><button class="button" type="button" disabled={working} onclick={() => void unlink('GOOGLE')}>Unlink</button></div>
      {:else}<span class="badge">Available</span>{/if}
    </div>

    <div class="card">
      <div><strong>Telegram</strong><span>{connection('TELEGRAM')?.connected ? (connection('TELEGRAM')?.displayName ?? 'Connected Telegram user') : 'Not connected'}</span></div>
      {#if connection('TELEGRAM')?.connected}
        <div class="card-actions"><span class="badge">Connected</span><button class="button" type="button" disabled={working} onclick={() => void unlink('TELEGRAM')}>Unlink</button></div>
      {:else}<button class="button primary" type="button" disabled={working} onclick={() => void openTelegramMiniApp()}>Link Telegram</button>{/if}
    </div>

    {#if status === 'PENDING' || status === 'AWAITING_OWNER_CONFIRMATION'}
      <div class="pending" role="status"><strong>{status === 'PENDING' ? 'Open Telegram to continue' : 'Telegram identity verified'}</strong><p>{status === 'PENDING' ? 'Open Telegram, then return here to confirm.' : 'Confirming will merge only after your explicit approval.'}</p>{#if linkUrl}<button class="button primary" type="button" onclick={() => window.open(linkUrl ?? '', '_blank', 'noopener,noreferrer')}>Open Telegram</button>{/if}{#if status === 'AWAITING_OWNER_CONFIRMATION'}<button class="button primary" type="button" disabled={working} onclick={() => void confirm()}>Confirm Telegram account</button>{/if}<button class="button" type="button" disabled={working} onclick={() => void cancel()}>Cancel link</button></div>
    {/if}
  {/if}
  {#if confirmingProvider}
    <div class="confirm" role="dialog" aria-modal="true" aria-labelledby="unlink-title">
      <strong id="unlink-title">Unlink {confirmingProvider === 'TELEGRAM' ? 'Telegram' : 'Google/email'}?</strong>
      <p>You will no longer be able to use this provider to sign in.</p>
      <div class="card-actions"><button class="button" type="button" onclick={() => { confirmingProvider = null; }}>Cancel</button><button class="button primary" type="button" disabled={working} onclick={() => void confirmUnlink()}>Unlink</button></div>
    </div>
  {/if}
</section>

<style>
  .connections { max-width: 40rem; margin: 0 auto; padding: 1.5rem; }
  .eyebrow { font: 600 0.7rem/1 monospace; letter-spacing: .2em; text-transform: uppercase; color: var(--color-muted, #64748b); }
  h1 { margin: .5rem 0; font-size: clamp(1.6rem, 5vw, 2.4rem); }
  .muted, .card span, .pending p { color: var(--color-muted, #64748b); }
  .card, .pending { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-top: 1rem; padding: 1rem; border: 1px solid var(--color-border, #e2e8f0); border-radius: 1rem; }
  .card div:first-child { display: grid; gap: .35rem; min-width: 0; }
  .card-actions { display: flex; align-items: center; gap: .75rem; }
  .badge { color: var(--color-progress, #15803d); font-size: .8rem; }
  .pending { display: grid; justify-content: stretch; }
  .confirm { display: grid; gap: .75rem; margin-top: 1rem; padding: 1rem; border: 1px solid var(--color-border, #e2e8f0); border-radius: 1rem; }
  .button { min-height: 44px; border: 1px solid var(--color-border, #cbd5e1); border-radius: .8rem; padding: 0 1rem; cursor: pointer; }
  .primary { background: var(--color-progress, #15803d); color: white; text-align: center; display: inline-flex; align-items: center; justify-content: center; text-decoration: none; }
  .error { color: #b91c1c; }
  @media (max-width: 480px) { .card { align-items: flex-start; flex-direction: column; } .card-actions { width: 100%; justify-content: space-between; } .button.primary { width: 100%; } }
</style>
