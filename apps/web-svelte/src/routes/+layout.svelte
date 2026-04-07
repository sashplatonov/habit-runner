<script lang="ts">
  import '../app.css';
  import { onMount, onDestroy } from 'svelte';
  import { sessionStore } from '$lib/stores/sessionStore';
  import { themeStore } from '$lib/stores/themeStore';
  import { installGlobalClientLogging } from '$lib/logging/clientLogger';
  import {
    AUTH_SESSION_CLEARED_EVENT,
    clearAuthSession,
    parseOAuthCallbackSession,
    getSessionUserId
  } from '$lib/auth/session';
  import { setCurrentUserId } from '$lib/storage/db';
  import { clearCurrentUserTimeZone } from '$lib/time/userTimezone';
  import { subscribeToPush, isPushNotificationSupported } from '$lib/pwa/pushSubscription';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  let { children } = $props();
  let authError = $state<string | undefined>();
  let cleanupLogging: (() => void) | undefined;

  onMount(() => {
    sessionStore.init();
    const session = sessionStore.get();
    setCurrentUserId(getSessionUserId(session));

    cleanupLogging = installGlobalClientLogging();

    // Handle OAuth callback
    const url = new URL(window.location.href);
    if (url.pathname === '/auth/callback') {
      const oauthSession = parseOAuthCallbackSession(url);
      if (oauthSession) {
        setCurrentUserId(getSessionUserId(oauthSession));
        sessionStore.set(oauthSession);
        goto('/', { replaceState: true });
        return;
      }
      authError = 'Failed to complete OAuth login. Check provider setup and redirect URI.';
      goto('/', { replaceState: true });
    }

    // Auto-subscribe to push if permission already granted
    if (session && isPushNotificationSupported() && Notification.permission === 'granted') {
      subscribeToPush().catch(() => {});
    }
  });

  function handleSessionCleared() {
    setCurrentUserId(null);
    clearCurrentUserTimeZone();
    sessionStore.set(null);
    authError = 'Session expired. Please log in again.';
  }

  onMount(() => {
    window.addEventListener(AUTH_SESSION_CLEARED_EVENT, handleSessionCleared);
    return () => {
      window.removeEventListener(AUTH_SESSION_CLEARED_EVENT, handleSessionCleared);
    };
  });

  onDestroy(() => {
    cleanupLogging?.();
  });
</script>

{@render children()}
