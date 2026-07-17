<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    title?: string;
    subtitle?: string;
    class?: string;
    children: Snippet;
  };

  const { title, subtitle, class: className = '', children }: Props = $props();
</script>

<section class="border-b border-border/70 bg-bg-secondary/55 px-4 py-12 sm:px-6 {className}">
  <div class="mx-auto w-full max-w-6xl">
    {#if title}
      <h2 class="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
    {/if}
    {#if subtitle}
      <p class="mt-3 max-w-3xl text-sm leading-6 text-muted">{subtitle}</p>
    {/if}
    <div class="mt-6">
      {@render children()}
    </div>
  </div>
</section>
