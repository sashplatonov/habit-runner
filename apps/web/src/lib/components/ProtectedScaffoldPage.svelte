<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    eyebrow: string;
    title: string;
    description: string;
    bullets?: string[];
    children?: Snippet;
  };

  let { eyebrow, title, description, bullets = [], children }: Props = $props();
</script>

<section class="mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-[1100px] flex-col gap-6 px-4 py-8 text-foreground">
  <header class="space-y-3 border-b border-border pb-6">
    <p class="text-xs font-mono uppercase tracking-[0.3em] text-muted">{eyebrow}</p>
    <h1 class="text-3xl font-semibold leading-tight">{title}</h1>
    <p class="max-w-3xl text-base leading-7 text-muted">{description}</p>
  </header>

  {#if bullets.length > 0}
    <article class="rounded-3xl border border-border bg-bg-card p-5 shadow-glow-blue-sm">
      <h2 class="text-lg font-semibold">Current migration scope</h2>
      <ul class="mt-3 space-y-2 text-sm text-muted">
        {#each bullets as bullet, bi (bullet + '-' + bi)}
          <li>{bullet}</li>
        {/each}
      </ul>
    </article>
  {/if}

  {#if children}
    {@render children()}
  {/if}
</section>
