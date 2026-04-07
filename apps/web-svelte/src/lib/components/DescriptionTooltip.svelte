<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    text,
    children
  }: {
    text: string;
    children: Snippet;
  } = $props();

  let visible = $state(false);
  let tooltipRef = $state<HTMLDivElement | null>(null);
  let triggerRef = $state<HTMLDivElement | null>(null);
  let position = $state({ top: 0, left: 0, placement: 'below' as 'above' | 'below' });

  function show() {
    if (!triggerRef) return;
    const rect = triggerRef.getBoundingClientRect();
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const placement = spaceAbove > spaceBelow && spaceAbove > 100 ? 'above' : 'below';
    const top = placement === 'above' ? rect.top - 8 : rect.bottom + 8;
    const left = Math.max(8, Math.min(rect.left + rect.width / 2, window.innerWidth - 150));
    position = { top, left, placement };
    visible = true;
  }

  function hide() {
    visible = false;
  }
</script>

<div
  class="inline-block"
  bind:this={triggerRef}
  onmouseenter={show}
  onmouseleave={hide}
  onfocus={show}
  onblur={hide}
>
  {@render children()}
</div>

{#if visible && text}
  <div
    bind:this={tooltipRef}
    class="fixed z-50 pointer-events-none px-3 py-2 rounded-lg bg-bg-card border border-border text-xs text-foreground shadow-lg max-w-[240px] -translate-x-1/2"
    style="top: {position.top}px; left: {position.left}px; transform: translateX(-50%) {position.placement === 'above' ? 'translateY(-100%)' : ''};"
  >
    {text}
  </div>
{/if}
