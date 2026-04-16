<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    title: string;
    description?: string;
    icon?: Snippet;
    action?: Snippet;
  };

  let { title, description, icon, action }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
  {#if icon}
    <div class="mb-1 text-muted/40" aria-hidden="true">
      {@render icon()}
    </div>
  {/if}

  <p class="text-sm font-semibold text-foreground">{title}</p>

  {#if description}
    <p class="max-w-xs text-xs text-muted">{description}</p>
  {/if}

  {#if action}
    <div class="mt-2">{@render action()}</div>
  {/if}
</div>
