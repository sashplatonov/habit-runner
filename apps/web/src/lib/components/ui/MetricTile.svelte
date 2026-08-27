<script lang="ts">
  import type { ComponentType } from 'svelte';

  type Props = {
    label: string;
    value: string;
    detail?: string;
    tone?: 'progress' | 'attention' | 'neutral';
    icon?: ComponentType;
    class?: string;
  };

  let { label, value, detail, tone = 'neutral', icon, class: className = '' }: Props = $props();
</script>

<div class={`rounded-surface border border-border bg-bg-card p-4 shadow-surface ${className}`.trim()}>
  <div class="flex items-start justify-between gap-3">
    <div class="min-w-0">
      <p class="text-[10px] font-medium uppercase tracking-[0.24em] text-muted">{label}</p>
      <p class="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:mt-2">{value}</p>
    </div>
    {#if icon}
      {@const Icon = icon}
      <div aria-hidden="true" class={`flex h-9 w-9 items-center justify-center rounded-2xl ${tone === 'progress' ? 'bg-progress/10 text-progress' : tone === 'attention' ? 'bg-attention/10 text-attention' : 'bg-border/30 text-muted'}`}>
        <Icon size={18} />
      </div>
    {/if}
  </div>
  {#if detail}
    <p class="mt-2 line-clamp-2 text-xs leading-5 text-muted sm:mt-3 sm:text-sm sm:leading-6">{detail}</p>
  {/if}
</div>
