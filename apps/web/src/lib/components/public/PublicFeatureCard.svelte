<script lang="ts">
  import type { ComponentType } from 'svelte';

  type Props = {
    title: string;
    description?: string;
    icon?: ComponentType;
    class?: string;
  };

  const { title, description, icon: Icon, class: className = '' }: Props = $props();
</script>

<div class="rounded-[1.5rem] border border-border bg-bg-card p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] {className}">
  {#if Icon}
    <div class="mb-3 text-progress">
      <Icon size={20} />
    </div>
  {/if}
  <h3 class="text-lg font-semibold tracking-tight text-foreground">{title}</h3>
  {#if description}
    <p class="mt-2 text-sm leading-6 text-muted">{description}</p>
  {/if}
</div>
