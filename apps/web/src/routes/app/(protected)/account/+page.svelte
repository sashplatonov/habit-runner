<script lang="ts">
  import AccountConnections from '$lib/components/AccountConnections.svelte';
  import { getAppRuntime } from '$lib/app/runtime';

  const habitsStore = getAppRuntime().habitsStore;
</script>
<svelte:head><title>Account connections - Habit Runner</title></svelte:head>
<AccountConnections habits={$habitsStore.allHabits} />
