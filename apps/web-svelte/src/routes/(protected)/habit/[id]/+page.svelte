<script lang="ts">
  import HabitDetail from '$lib/pages/HabitDetail.svelte';
  import { page } from '$app/stores';

  const habitId = $derived($page.params.id);
</script>

<HabitDetail {habitId} />
