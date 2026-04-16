<script lang="ts">
  import { onMount } from 'svelte';
  import '../app.css';
  import { readAuthSession } from '@/lib/auth/session';
  import { installGlobalClientLogging } from '@/lib/logging/clientLogger';
  import UndoToast from '$lib/components/UndoToast.svelte';
  import { themeStore } from '$lib/stores/theme';
  import { setUndoContext } from '$lib/stores/undo';

  let { children } = $props();

  const undoStore = setUndoContext();

  onMount(() => {
    void themeStore.initialize(Boolean(readAuthSession()));
    return installGlobalClientLogging();
  });
</script>

{@render children()}

{#if $undoStore}
  <UndoToast
    message={$undoStore.message}
    actionLabel={$undoStore.actionLabel}
    onAction={$undoStore.onUndo ? () => undoStore.runUndo() : undefined}
    onClose={() => undoStore.close()}
  />
{/if}