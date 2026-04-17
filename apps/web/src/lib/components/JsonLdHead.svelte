<script lang="ts">
  type Props = {
    payload: string;
  };

  let { payload }: Props = $props();
</script>

<svelte:head>
  <svelte:element this={'script'} type="application/ld+json">{payload}</svelte:element>
</svelte:head>