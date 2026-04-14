<script lang="ts">
  import { Bell, BellOff, X } from 'lucide-svelte';
  import {
    isPushNotificationSupported,
    getPushNotificationPermission,
    subscribeToPush
  } from '$lib/pwa/pushSubscription';

  let dismissed = $state(false);
  let subscribing = $state(false);
  let subscribeError = $state<string | null>(null);
  let subscribed = $state(false);

  const supported = isPushNotificationSupported();
  const permission = $derived(getPushNotificationPermission());
  const visible = $derived(
    supported &&
    !dismissed &&
    !subscribed &&
    permission !== 'granted' &&
    permission !== 'denied'
  );

  async function handleSubscribe() {
    subscribing = true;
    subscribeError = null;
    try {
      const ok = await subscribeToPush();
      if (ok) {
        subscribed = true;
      } else {
        subscribeError = 'Could not enable notifications. Check browser settings.';
      }
    } catch (err) {
      subscribeError = err instanceof Error ? err.message : 'Failed';
    } finally {
      subscribing = false;
    }
  }
</script>

{#if visible}
  <div class="mx-auto max-w-2xl px-4 pb-2">
    <div class="flex items-start gap-3 rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3">
      <Bell size={16} class="mt-0.5 shrink-0 text-accent-secondary" />
      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold text-foreground">Enable habit reminders</p>
        <p class="mt-0.5 text-xs text-muted">Get push notifications to stay on track with your habits.</p>
        {#if subscribeError}
          <p class="mt-1 flex items-center gap-1 text-xs text-red-400">
            <BellOff size={12} />
            {subscribeError}
          </p>
        {/if}
        <div class="mt-2 flex gap-2">
          <button
            type="button"
            onclick={() => { void handleSubscribe(); }}
            disabled={subscribing}
            class="rounded-full border border-accent px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.3em] text-accent transition-colors hover:bg-accent/10 disabled:opacity-60"
          >
            {subscribing ? 'Enabling…' : 'Enable'}
          </button>
          <button
            type="button"
            onclick={() => { dismissed = true; }}
            class="rounded-full border border-border px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.3em] text-muted transition-colors hover:border-border-hover hover:text-foreground"
          >
            Maybe later
          </button>
        </div>
      </div>
      <button
        type="button"
        onclick={() => { dismissed = true; }}
        class="shrink-0 text-muted hover:text-foreground"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  </div>
{/if}
