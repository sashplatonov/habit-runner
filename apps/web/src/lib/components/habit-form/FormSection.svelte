<script lang="ts">
  import Surface from '$lib/components/ui/Surface.svelte';
  import type { Snippet } from 'svelte';

  type Props = {
    title: string;
    description?: string;
    class?: string;
    children: Snippet;
  };

  let { title, description, class: className = '', children }: Props = $props();
</script>

<Surface as="section" padding="lg" class={className}>
  <div class="mb-4">
    <p class="text-[10px] font-mono uppercase tracking-[0.24em] text-muted">{title}</p>
    {#if description}
      <p class="mt-1 text-sm leading-6 text-muted">{description}</p>
    {/if}
  </div>

  {@render children()}
</Surface>
