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

<section class="border-b border-slate-200/80 bg-white/70 px-4 py-12 sm:px-6 {className}">
  <div class="mx-auto w-full max-w-6xl">
    {#if title}
      <h2 class="text-2xl font-semibold text-slate-900">{title}</h2>
    {/if}
    {#if subtitle}
      <p class="mt-3 text-sm text-slate-600">{subtitle}</p>
    {/if}
    <div class="mt-6">
      {@render children()}
    </div>
  </div>
</section>
