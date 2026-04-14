<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import { readAuthSession } from '$lib/auth/session';
  import PublicLanding from '$lib/components/PublicLanding.svelte';

  let redirecting = $state(false);

  onMount(() => {
    if (readAuthSession()) {
      redirecting = true;
      void goto(resolve<'/(protected)/dashboard'>('/(protected)/dashboard', {}), { replaceState: true });
    }
  });
</script>

<PublicLanding {redirecting} />