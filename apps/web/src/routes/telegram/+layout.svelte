<script lang="ts">
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import type { Snippet } from 'svelte';

  type Props = { children: Snippet };
  let { children }: Props = $props();

  onMount(() => {
    window.location.replace(`${resolve('/', {})}${window.location.search}`);
  });
</script>

<main class="telegram-shell" aria-live="polite">Opening Habbit Runner…</main>
<div hidden>{@render children()}</div>

<style>
  .telegram-shell { min-height: 100dvh; padding: max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom)); display: grid; place-content: center; text-align: center; }
</style>
