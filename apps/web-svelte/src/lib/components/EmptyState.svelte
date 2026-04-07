<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    icon,
    title,
    description,
    action
  }: {
    icon?: Snippet;
    title: string;
    description?: string;
    action?: Snippet;
  } = $props();
</script>

<div class="flex flex-col items-center justify-center gap-3 py-12 text-center px-6">
  {#if icon}
    <div class="text-muted/40 mb-1" aria-hidden="true">
      {@render icon()}
    </div>
  {/if}
  <p class="text-sm font-semibold text-foreground">{title}</p>
  {#if description}
    <p class="text-xs text-muted max-w-xs">{description}</p>
  {/if}
  {#if action}
    <div class="mt-2">
      {@render action()}
    </div>
  {/if}
</div>
