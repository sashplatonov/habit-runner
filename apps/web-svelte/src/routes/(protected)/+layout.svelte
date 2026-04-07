<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { sessionStore } from '$lib/stores/sessionStore';
  import { syncStatusStore } from '$lib/stores/syncStatusStore';
  import { themeStore } from '$lib/stores/themeStore';
  import { undoStore } from '$lib/stores/undoStore';
  import { clearAuthSession, getSessionUserId } from '$lib/auth/session';
  import { setCurrentUserId } from '$lib/storage/db';
  import { clearCurrentUserTimeZone } from '$lib/time/userTimezone';
  import { API_BASE_URL } from '$lib/core/config';
  import AppLayout from '$lib/components/AppLayout.svelte';
  import PullToRefresh from '$lib/components/PullToRefresh.svelte';

  let { children } = $props();
  let cleanupSync: (() => void) | undefined;

  onMount(() => {
    const session = $sessionStore;
    if (!session) {
      goto('/', { replaceState: true });
      return;
    }

    themeStore.hydrateFromServer();
    cleanupSync = syncStatusStore.start();
  });

  onDestroy(() => {
    cleanupSync?.();
    syncStatusStore.stop();
  });

  // Watch for session changes — redirect to login if cleared
  $effect(() => {
    if (!$sessionStore) {
      goto('/', { replaceState: true });
    }
  });

  async function logout() {
    const refreshToken = $sessionStore?.refreshToken;
    clearAuthSession();
    setCurrentUserId(null);
    clearCurrentUserTimeZone();
    themeStore.resetToDefaults();
    sessionStore.set(null);

    if (refreshToken) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
      } catch {
        // Logout endpoint failure should not block local session cleanup
      }
    }
  }
</script>

{#if $sessionStore}
  <PullToRefresh
    enabled={true}
    isRefreshing={$syncStatusStore.status === 'syncing'}
    onRefresh={() => syncStatusStore.syncNow()}
  >
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-md focus:border focus:border-accent focus:bg-bg-card focus:px-3 focus:py-2 focus:text-xs focus:text-foreground"
    >
      Skip to main content
    </a>
    <AppLayout syncState={$syncStatusStore} onLogout={logout}>
      {@render children()}
    </AppLayout>
  </PullToRefresh>

  {#if $undoStore}
    <div
      class="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl border border-border bg-bg-card/95 px-4 py-3 shadow-lg backdrop-blur-sm animate-slide-in-bottom"
    >
      <span class="text-sm text-foreground">{$undoStore.message}</span>
      <button
        class="text-sm font-semibold text-accent hover:text-accent-secondary transition-colors"
        onclick={() => undoStore.executeUndo($undoStore!)}
      >
        {$undoStore.actionLabel ?? 'Undo'}
      </button>
      <button
        class="text-muted hover:text-foreground transition-colors text-xs"
        onclick={() => undoStore.dismiss()}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  {/if}
{/if}
