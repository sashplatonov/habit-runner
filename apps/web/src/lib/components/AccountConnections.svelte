<script lang="ts">
  import { onMount } from 'svelte';
  import { cancelTelegramLink, confirmTelegramLink, getTelegramLinkStatus, startTelegramLink, telegramMiniAppUrl, type AccountLinkStatus } from '@/lib/api/accountLinks';
  import { ensureAuthSession, readAuthSession } from '@/lib/auth/session';

  let status = $state<AccountLinkStatus | null>(null);
  let token = $state<string | null>(null);
  let linkUrl = $state<string | null>(null);
  let loading = $state(true);
  let working = $state(false);
  let error = $state('');
  let email = $state<string | undefined>(undefined);

  async function refresh() {
    if (!token) { loading = false; return; }
    try { status = (await getTelegramLinkStatus(token)).status; error = ''; }
    catch (cause) { error = cause instanceof Error ? cause.message : 'Unable to load link status.'; }
    finally { loading = false; }
  }

  async function createLink() {
    working = true; error = '';
    try { const result = await startTelegramLink(); token = result.token; linkUrl = telegramMiniAppUrl(token); status = 'PENDING'; }
    catch (cause) { error = cause instanceof Error ? cause.message : 'Unable to create a Telegram link.'; }
    finally { working = false; }
  }

  async function cancel() {
    if (!token) return;
    working = true;
    try { await cancelTelegramLink(token); status = 'CANCELLED'; }
    catch (cause) { error = cause instanceof Error ? cause.message : 'Unable to cancel the link.'; }
    finally { working = false; }
  }

  async function confirm() {
    if (!token) return;
    working = true;
    try { await confirmTelegramLink(token); status = 'COMPLETED'; }
    catch (cause) { error = cause instanceof Error ? cause.message : 'Unable to confirm the link.'; }
    finally { working = false; }
  }

  onMount(() => {
    email = readAuthSession()?.email;
    void ensureAuthSession().then((session) => { email = session?.email; });
    void refresh();
    const timer = window.setInterval(() => void refresh(), 10_000);
    return () => window.clearInterval(timer);
  });
</script>

<section class="connections" aria-labelledby="connections-title">
  <p class="eyebrow">Account</p>
  <h1 id="connections-title">Account connections</h1>
  <p class="muted">Link Telegram to use the same habits and check-ins in both apps.</p>
  <div class="card">
    <div><strong>Google / email</strong><span>{email ?? 'Not connected yet'}</span></div>
    {#if email}
      <span class="badge">Connected</span>
    {:else}
      <button class="button" type="button" onclick={() => window.location.assign('/api/auth/google/link/start?returnTo=%2Fapp%2Faccount')}>Link Google account</button>
    {/if}
  </div>
  <div class="card">
    <div><strong>Telegram</strong><span>{status === 'COMPLETED' ? 'Connected' : 'Not connected'}</span></div>
    <span class="badge">{status === 'COMPLETED' ? 'Connected' : 'Available'}</span>
  </div>
  {#if error}<p class="error" role="alert">{error}</p>{/if}
  {#if loading}<p aria-live="polite">Loading connection status…</p>
  {:else if status === 'PENDING' || status === 'AWAITING_OWNER_CONFIRMATION'}
    <div class="pending" role="status"><strong>{status === 'PENDING' ? 'Open Telegram to continue' : 'Telegram identity verified'}</strong><p>{status === 'PENDING' ? 'Open the link, then return here to confirm.' : 'Confirming will merge only after your explicit approval.'}</p>{#if linkUrl}<button class="button primary" type="button" onclick={() => window.open(linkUrl ?? '', '_blank', 'noopener,noreferrer')}>Open Telegram</button>{/if}{#if status === 'AWAITING_OWNER_CONFIRMATION'}<button class="button primary" type="button" disabled={working} onclick={() => void confirm()}>Confirm Telegram account</button>{/if}<button class="button" type="button" disabled={working} onclick={() => void cancel()}>Cancel link</button></div>
  {:else if status === 'COMPLETED'}<p class="success" role="status">Telegram is linked. Your data is shared across both apps.</p>
  {:else}<button class="button primary" type="button" disabled={working} onclick={() => void createLink()}>Link Telegram account</button>{/if}
</section>

<style>
  .connections { max-width: 40rem; margin: 0 auto; padding: 1.5rem; }
  .eyebrow { font: 600 0.7rem/1 monospace; letter-spacing: .2em; text-transform: uppercase; color: var(--color-muted, #64748b); }
  h1 { margin: .5rem 0; font-size: clamp(1.6rem, 5vw, 2.4rem); }
  .muted, .card span, .pending p { color: var(--color-muted, #64748b); }
  .card, .pending { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-top: 1rem; padding: 1rem; border: 1px solid var(--color-border, #e2e8f0); border-radius: 1rem; }
  .card div { display: grid; gap: .35rem; }
  .badge { color: var(--color-progress, #15803d); font-size: .8rem; }
  .pending { display: grid; justify-content: stretch; }
  .button { min-height: 44px; border: 1px solid var(--color-border, #cbd5e1); border-radius: .8rem; padding: 0 1rem; cursor: pointer; }
  .primary { background: var(--color-progress, #15803d); color: white; text-align: center; display: inline-flex; align-items: center; justify-content: center; text-decoration: none; }
  .error { color: #b91c1c; } .success { color: #15803d; }
</style>
