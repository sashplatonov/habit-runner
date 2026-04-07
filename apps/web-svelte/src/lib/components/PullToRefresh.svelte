<script lang="ts">
  import type { Snippet } from 'svelte';
  import { syncStatusStore } from '$lib/stores/syncStatusStore';

  let {
    children
  }: {
    children: Snippet;
  } = $props();

  const PULL_TRIGGER_PX = 72;
  const MAX_PULL_PX = 112;
  const PULL_DAMPING = 0.45;

  let pullY = $state(0);
  let phase = $state<'idle' | 'pulling' | 'armed' | 'refreshing'>('idle');
  let startY = $state(0);
  let isPulling = $state(false);

  function canPull() {
    return window.scrollY <= 0;
  }

  function handleTouchStart(e: TouchEvent) {
    if (!canPull()) return;
    startY = e.touches[0].clientY;
    isPulling = true;
  }

  function handleTouchMove(e: TouchEvent) {
    if (!isPulling || phase === 'refreshing') return;
    const dy = (e.touches[0].clientY - startY) * PULL_DAMPING;
    if (dy < 0) {
      pullY = 0;
      phase = 'idle';
      return;
    }
    pullY = Math.min(dy, MAX_PULL_PX);
    phase = pullY >= PULL_TRIGGER_PX ? 'armed' : 'pulling';
  }

  async function handleTouchEnd() {
    isPulling = false;
    if (phase === 'armed') {
      phase = 'refreshing';
      pullY = PULL_TRIGGER_PX;
      try {
        await syncStatusStore.syncNow();
      } finally {
        phase = 'idle';
        pullY = 0;
      }
    } else {
      phase = 'idle';
      pullY = 0;
    }
  }
</script>

<div
  class="relative"
  ontouchstart={handleTouchStart}
  ontouchmove={handleTouchMove}
  ontouchend={handleTouchEnd}
>
  {#if pullY > 0}
    <div
      class="flex items-center justify-center transition-opacity"
      style="height: {pullY}px; opacity: {Math.min(pullY / PULL_TRIGGER_PX, 1)}"
    >
      {#if phase === 'refreshing'}
        <div class="w-5 h-5 rounded-full border-2 border-accent/30 border-t-accent animate-spin"></div>
      {:else if phase === 'armed'}
        <svg class="w-5 h-5 text-accent rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      {:else}
        <svg class="w-5 h-5 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      {/if}
    </div>
  {/if}

  <div
    style="transform: translateY({phase === 'refreshing' ? 0 : 0}px); transition: transform 0.2s ease-out"
  >
    {@render children()}
  </div>
</div>
