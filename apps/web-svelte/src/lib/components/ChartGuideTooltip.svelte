<script lang="ts">
  import type { Snippet } from 'svelte';

  type TooltipVariant = 'bars' | 'line' | 'grid' | 'columns';

  let {
    title,
    subtitle,
    items = [],
    variant = 'bars',
    open = false,
    position,
    onClose,
    children
  }: {
    title?: string;
    subtitle?: string;
    items?: Array<{ label: string; value: string | number; color?: string }>;
    variant?: TooltipVariant;
    open?: boolean;
    position?: { x: number; y: number };
    onClose?: () => void;
    children?: Snippet;
  } = $props();

  function handleBackdropClick() {
    onClose?.();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose?.();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open && position}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="fixed inset-0 z-40" onclick={handleBackdropClick}></div>

  <div
    class="fixed z-50 min-w-[160px] max-w-[280px] rounded-xl border border-border bg-bg-card px-4 py-3 shadow-2xl"
    style="left: {Math.min(position.x, window.innerWidth - 300)}px; top: {Math.max(8, position.y - 20)}px;"
  >
    {#if title}
      <p class="text-xs font-semibold text-foreground mb-0.5">{title}</p>
    {/if}
    {#if subtitle}
      <p class="text-[10px] font-mono text-muted mb-2">{subtitle}</p>
    {/if}

    {#if variant === 'bars'}
      <div class="space-y-1.5">
        {#each items as item}
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-1.5">
              {#if item.color}
                <span class="inline-block h-2 w-2 rounded-full" style="background-color: {item.color}"></span>
              {/if}
              <span class="text-[11px] text-foreground">{item.label}</span>
            </div>
            <span class="text-[11px] font-mono text-muted">{item.value}</span>
          </div>
        {/each}
      </div>
    {:else if variant === 'line'}
      <div class="space-y-1">
        {#each items as item}
          <div class="flex items-center justify-between gap-3">
            <span class="text-[11px] text-foreground truncate">{item.label}</span>
            <span class="text-[11px] font-mono text-muted">{item.value}</span>
          </div>
        {/each}
      </div>
    {:else if variant === 'grid'}
      <div class="grid grid-cols-2 gap-x-3 gap-y-1">
        {#each items as item}
          <div class="text-[11px] text-muted">{item.label}</div>
          <div class="text-[11px] font-mono text-foreground text-right">{item.value}</div>
        {/each}
      </div>
    {:else}
      <div class="flex gap-3">
        {#each items as item}
          <div class="flex flex-col items-center gap-0.5">
            {#if item.color}
              <div class="h-6 w-3 rounded-sm" style="background-color: {item.color}; opacity: 0.7"></div>
            {/if}
            <span class="text-[10px] text-muted">{item.label}</span>
            <span class="text-[10px] font-mono text-foreground">{item.value}</span>
          </div>
        {/each}
      </div>
    {/if}

    {#if children}
      <div class="mt-2 border-t border-border pt-2">
        {@render children()}
      </div>
    {/if}
  </div>
{/if}
