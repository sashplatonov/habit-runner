<script lang="ts">
  import { onMount } from 'svelte';
  import type { Snippet } from 'svelte';

  const PULL_TRIGGER_PX = 72;
  const MAX_PULL_PX = 112;
  const PULL_DAMPING = 0.45;

  type Props = {
    enabled?: boolean;
    isRefreshing: boolean;
    onRefresh: () => Promise<void>;
    children: Snippet;
  };

  let { enabled = true, isRefreshing, onRefresh, children }: Props = $props();

  let rootElement = $state<HTMLDivElement | null>(null);
  let pullDistance = $state(0);
  let displayRefreshing = $state(false);

  // Add touch-action: manipulation for fast tap interactions
  $effect(() => {
    if (rootElement) {
      rootElement.style.touchAction = 'manipulation';
    }
  });

  const pullState = $derived.by(() => {
    if (displayRefreshing) {
      return 'refreshing';
    }
    if (pullDistance >= PULL_TRIGGER_PX) {
      return 'armed';
    }
    if (pullDistance > 0) {
      return 'pull';
    }
    return 'idle';
  });
  const indicatorVisible = $derived(pullState !== 'idle');
  const progress = $derived(Math.min(1, pullDistance / PULL_TRIGGER_PX));
  const message = $derived.by(() => {
    if (pullState === 'refreshing') {
      return 'Syncing data…';
    }
    if (pullState === 'armed') {
      return 'Release to refresh';
    }
    return 'Pull down to refresh';
  });

  $effect(() => {
    let timer: number | undefined;
    if (isRefreshing) {
      timer = window.setTimeout(() => {
        displayRefreshing = true;
      }, 150);
    } else {
      displayRefreshing = false;
    }

    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  });

  onMount(() => {
    if (!rootElement) {
      return;
    }

    let startY: number | null = null;
    let active = false;
    let armed = false;

    const reset = () => {
      startY = null;
      active = false;
      armed = false;
      pullDistance = 0;
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (!enabled || isRefreshing || event.touches.length !== 1 || window.scrollY > 0) {
        reset();
        return;
      }

      startY = event.touches[0].clientY;
      active = true;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!enabled || !active || startY === null || event.touches.length !== 1) {
        return;
      }

      const deltaY = event.touches[0].clientY - startY;
      if (deltaY <= 0 || window.scrollY > 0) {
        reset();
        return;
      }

      const nextDistance = Math.min(MAX_PULL_PX, deltaY * PULL_DAMPING);
      armed = nextDistance >= PULL_TRIGGER_PX;
      pullDistance = nextDistance;
      event.preventDefault();
    };

    const handleTouchEnd = () => {
      if (!active) {
        return;
      }

      const shouldRefresh = armed && !isRefreshing;
      reset();
      if (shouldRefresh) {
        void onRefresh();
      }
    };

    rootElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    rootElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    rootElement.addEventListener('touchend', handleTouchEnd);
    rootElement.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      rootElement?.removeEventListener('touchstart', handleTouchStart);
      rootElement?.removeEventListener('touchmove', handleTouchMove);
      rootElement?.removeEventListener('touchend', handleTouchEnd);
      rootElement?.removeEventListener('touchcancel', handleTouchEnd);
    };
  });
</script>

<div bind:this={rootElement} class="relative min-h-screen">
  <div
    aria-hidden={!indicatorVisible}
    class={`pointer-events-none fixed left-1/2 z-40 -translate-x-1/2 transition-[opacity,transform] duration-200 ${indicatorVisible ? 'opacity-100' : 'opacity-0'}`}
    style:top="calc(var(--safe-area-inset-top, 0px) + 0.75rem)"
    style:transform={`translateX(-50%) translateY(${indicatorVisible ? 0 : -12}px)`}
  >
    <div class="flex min-w-[160px] items-center justify-center gap-2 rounded-full border border-accent/30 bg-bg-card/95 px-3 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.24)] backdrop-blur-sm">
      <span
        class={`h-2.5 w-2.5 rounded-full border border-accent/40 ${displayRefreshing ? 'animate-pulse bg-accent' : 'bg-accent/20'}`}
        style:box-shadow={displayRefreshing ? '0 0 10px var(--glow)' : 'none'}
        style:transform={`scale(${0.8 + progress * 0.35})`}
      ></span>
      <span class="text-[10px] font-mono uppercase tracking-[0.25em] text-muted">{message}</span>
    </div>
  </div>

  <div aria-live="polite" class="sr-only">
    {indicatorVisible ? `${message}${displayRefreshing ? ' - Syncing data in background' : ''}` : ''}
  </div>

  {@render children()}
</div>
