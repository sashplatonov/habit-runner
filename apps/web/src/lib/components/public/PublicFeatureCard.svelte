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

<div class="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 {className}">
  {#if Icon}
    <div class="mb-3 text-slate-600">
      <Icon size={20} />
    </div>
  {/if}
  <h3 class="text-2xl font-semibold tracking-tight text-slate-950">{title}</h3>
  {#if description}
    <p class="mt-2 text-sm text-slate-600">{description}</p>
  {/if}
</div>
