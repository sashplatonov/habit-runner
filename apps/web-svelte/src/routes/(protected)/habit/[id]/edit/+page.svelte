<script lang="ts">
  import AddEditHabit from '$lib/pages/AddEditHabit.svelte';
  import { page } from '$app/stores';

  const habitId = $derived($page.params.id);
</script>

<AddEditHabit editId={habitId} />
