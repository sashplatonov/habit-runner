<script lang="ts">
  import { portal } from '$lib/actions/portal';
  import type { Snippet } from 'svelte';
  import { openOverlay, closeActiveOverlay } from './overlayManager';

  type Props = {
    open: boolean;
    triggerEl?: HTMLElement | null;
    onClose: () => void;
    children: Snippet;
    role?: string;
    ariaLabel?: string;
    ariaModal?: boolean;
    closeOnEscape?: boolean;
    closeOnOutsideClick?: boolean;
    trapFocus?: boolean;
    restoreFocus?: boolean;
    lockScroll?: boolean;
    class?: string;
    style?: string;
    zIndex?: number;
  };

  const {
    open,
    triggerEl = null,
    onClose,
    children,
    role = 'dialog',
    ariaLabel,
    ariaModal = true,
    closeOnEscape = true,
    closeOnOutsideClick = true,
    trapFocus = true,
    restoreFocus = true,
    lockScroll = false,
    class: className = '',
    style = '',
    zIndex = 240,
  }: Props = $props();

  let panelEl = $state<HTMLDivElement | null>(null);

  $effect(() => {
    if (open && panelEl) {
      openOverlay({
        triggerEl,
        panelEl,
        open: true,
        onClose,
        closeOnEscape,
        closeOnOutsideClick,
        trapFocus,
        restoreFocus,
        lockScroll,
      });
    } else if (!open) {
      closeActiveOverlay();
    }

    return () => {
      if (open) {
        closeActiveOverlay();
      }
    };
  });
</script>

{#if open}
  <div
    use:portal
    bind:this={panelEl}
    class="fixed {className}"
    style="z-index: {zIndex}; {style}"
    {role}
    aria-label={ariaLabel}
    aria-modal={ariaModal}
    tabindex="-1"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
  >
    {@render children()}
  </div>
{/if}
