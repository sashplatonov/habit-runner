<script lang="ts">
  import { sessionStore } from '$lib/stores/sessionStore';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import PublicLanding from '$lib/components/PublicLanding.svelte';
  import PublicSeoPage from '$lib/components/PublicSeoPage.svelte';

  let authError = $state<string | undefined>();

  function handleHelpClick(message: string) {
    authError = message;
  }

  // Derive SEO intent from pathname
  const seoIntents: Record<string, string> = {
    '/habit-tracker': 'habit-tracker',
    '/streak-tracker': 'streak-tracker',
    '/daily-routine-planner': 'daily-routine-planner'
  };
</script>

{#if $sessionStore}
  <!-- Authenticated — redirect to dashboard -->
  <script lang="ts">
    import { onMount } from 'svelte';
    onMount(() => goto('/dashboard', { replaceState: true }));
  </script>
{:else}
  {#if seoIntents[$page.url.pathname]}
    <PublicSeoPage intent={seoIntents[$page.url.pathname]} />
  {:else}
    <PublicLanding {authError} onHelpClick={handleHelpClick} />
  {/if}
{/if}
