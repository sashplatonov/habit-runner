<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  onMount(() => {
    // The callback is processed in the root layout
    goto('/', { replaceState: true });
  });
</script>

<div class="min-h-screen bg-bg-primary flex items-center justify-center">
  <div class="text-sm font-mono text-muted">Finishing login…</div>
</div>
