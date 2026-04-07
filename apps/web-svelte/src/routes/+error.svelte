<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(() => {
    goto('/dashboard', { replaceState: true });
  });
</script>

<div class="min-h-screen bg-bg-primary flex items-center justify-center">
  <div class="text-sm text-muted">Page not found. Redirecting…</div>
</div>
