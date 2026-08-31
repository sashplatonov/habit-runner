<script lang="ts">
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';
  import { CircleHelp, X } from 'lucide-svelte';
  import Overlay from '$lib/components/overlays/Overlay.svelte';
  import { calculateTooltipPosition, type TooltipPlacement } from '$lib/components/overlays/tooltipPosition';
  import IconButton from '$lib/components/ui/IconButton.svelte';

  type Props = {
    description: string;
    triggerClassName?: string;
    triggerLabel?: string;
  };

  const { description, triggerClassName = 'h-11 w-11', triggerLabel = 'Description' }: Props = $props();

  const componentId = $props.id();
  const panelId = `habit-description-${componentId}`;

  const renderedDescription = $derived.by(() => {
    try {
      const html = marked.parse(description) as string;
      return DOMPurify.sanitize(html);
    } catch {
      return DOMPurify.sanitize(description);
    }
  });

  let open = $state(false);
  let pinned = $state(false);
  let viewportWidth = $state(typeof window === 'undefined' ? 1024 : window.innerWidth);
  let viewportHeight = $state(typeof window === 'undefined' ? 768 : window.innerHeight);
  let position = $state({ left: 12, top: 12, width: 320, maxHeight: 0, placement: 'below' as TooltipPlacement });
  let triggerEl = $state<HTMLButtonElement | null>(null);
  let panelEl = $state<HTMLDivElement | null>(null);
  let closeTimer: ReturnType<typeof setTimeout> | null = null;

  const isMobile = $derived(viewportWidth < 640);

  function clearCloseTimer() {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
  }

  function updateViewport() {
    viewportWidth = window.innerWidth;
    viewportHeight = window.innerHeight;
    if (open && !isMobile) {
      positionPanel();
    }
  }

  function positionPanel() {
    if (!triggerEl || !panelEl || isMobile) {
      return;
    }

    const rect = triggerEl.getBoundingClientRect();
    position = calculateTooltipPosition({
      viewportWidth,
      viewportHeight,
      triggerLeft: rect.left,
      triggerRight: rect.right,
      triggerTop: rect.top,
      triggerBottom: rect.bottom,
      contentHeight: panelEl.scrollHeight
    });
  }

  function openPreview() {
    clearCloseTimer();
    if (!open) {
      open = true;
    }
  }

  function openPinned() {
    clearCloseTimer();
    pinned = true;
    open = true;
  }

  function closePanel() {
    clearCloseTimer();
    pinned = false;
    open = false;
  }

  function scheduleClose() {
    clearCloseTimer();
    if (pinned) {
      return;
    }
    closeTimer = setTimeout(() => {
      if (!pinned) {
        open = false;
      }
      closeTimer = null;
    }, 120);
  }

  function containsFocusTarget(target: EventTarget | null): boolean {
    return target instanceof Node && Boolean(panelEl?.contains(target));
  }

  $effect(() => {
    if (!open || !panelEl) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      positionPanel();
    });

    const onResize = () => positionPanel();
    const onScroll = () => positionPanel();

    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, true);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll, true);
    };
  });

  $effect(() => {
    return () => {
      clearCloseTimer();
    };
  });
</script>

<svelte:window onresize={updateViewport} />

<IconButton
  bind:element={triggerEl}
  ariaLabel={triggerLabel}
  title={triggerLabel}
  active={open}
  toggle={true}
  stopPropagation={true}
  expanded={open}
  controls={panelId}
  class={`cursor-help ${triggerClassName}`}
  onClick={(event) => {
    event.stopPropagation();
    if (open && pinned) {
      closePanel();
    } else {
      openPinned();
    }
  }}
  onMouseEnter={() => {
    if (!isMobile && !open) {
      openPreview();
    }
  }}
  onMouseLeave={() => {
    if (!isMobile) {
      scheduleClose();
    }
  }}
  onFocus={() => {
    openPreview();
  }}
  onBlur={(event) => {
    if (!pinned && !containsFocusTarget(event.relatedTarget)) {
      scheduleClose();
    }
  }}
>
  <CircleHelp size={14} stroke-width={2.1} aria-hidden="true" />
</IconButton>

{#if open}
  {#if isMobile}
    <Overlay
      open={open}
      triggerEl={triggerEl}
      onClose={closePanel}
      role="dialog"
      ariaLabel={triggerLabel}
      ariaModal={true}
      closeOnOutsideClick={true}
      closeOnEscape={true}
      trapFocus={true}
      restoreFocus={true}
      lockScroll={true}
      class="inset-x-0 bottom-0 z-[9999] max-h-[72dvh] overflow-hidden rounded-t-[1.75rem] border border-border bg-bg-card shadow-[0_24px_80px_rgba(0,0,0,0.32)]"
    >
      <div
        bind:this={panelEl}
        id={panelId}
        class="flex max-h-[72dvh] flex-col"
        tabindex="-1"
        role="presentation"
        onmouseenter={clearCloseTimer}
        onmouseleave={scheduleClose}
        onfocusin={clearCloseTimer}
        onfocusout={(event) => {
          if (!pinned && !containsFocusTarget(event.relatedTarget)) {
            scheduleClose();
          }
        }}
      >
        <div class="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div class="flex items-center gap-2">
            <span class="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-bg-secondary text-accent">
              <CircleHelp size={16} aria-hidden="true" />
            </span>
            <p class="text-[10px] font-mono uppercase tracking-[0.24em] text-muted">Description</p>
          </div>
          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted transition hover:border-border-hover hover:text-foreground"
            aria-label={`Close ${triggerLabel}`}
            onclick={closePanel}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div class="markdown-content max-h-[calc(72dvh-4.5rem)] overflow-y-auto px-4 py-4 text-sm leading-6 text-foreground" style:padding-bottom="calc(env(safe-area-inset-bottom, 0px) + 1rem)">
          {@html renderedDescription}
        </div>
      </div>
    </Overlay>
  {:else}
    <Overlay
      open={open}
      triggerEl={triggerEl}
      onClose={closePanel}
      role="dialog"
      ariaLabel={triggerLabel}
      ariaModal={false}
      closeOnOutsideClick={true}
      closeOnEscape={true}
      trapFocus={false}
      restoreFocus={true}
      lockScroll={false}
      class="z-[9999] w-[min(24rem,calc(100vw-1.5rem))] max-w-[calc(100vw-1.5rem)]"
      style={`left: ${position.left}px; top: ${position.top}px; width: ${position.width}px; max-height: ${position.maxHeight}px;`}
    >
      <div
        bind:this={panelEl}
        id={panelId}
        class="overflow-hidden rounded-[1.5rem] border border-border bg-bg-card shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
        tabindex="-1"
        role="presentation"
        onmouseenter={clearCloseTimer}
        onmouseleave={scheduleClose}
        onfocusin={clearCloseTimer}
        onfocusout={(event) => {
          if (!pinned && !containsFocusTarget(event.relatedTarget)) {
            scheduleClose();
          }
        }}
      >
        <div class="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div class="flex min-w-0 items-center gap-2">
            <span class="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-bg-secondary text-accent">
              <CircleHelp size={16} aria-hidden="true" />
            </span>
            <p class="text-[10px] font-mono uppercase tracking-[0.24em] text-muted">Description</p>
          </div>
          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted transition hover:border-border-hover hover:text-foreground"
            aria-label={`Close ${triggerLabel}`}
            onclick={closePanel}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div class="markdown-content max-h-[min(60vh,32rem)] overflow-y-auto px-4 py-4 text-sm leading-6 text-foreground">
          {@html renderedDescription}
        </div>
      </div>
    </Overlay>
  {/if}
{/if}

<style>
  :global(.markdown-content) {
    word-break: break-word;
  }

  :global(.markdown-content h1),
  :global(.markdown-content h2),
  :global(.markdown-content h3) {
    margin: 0 0 0.5rem;
    line-height: 1.2;
  }

  :global(.markdown-content p) {
    margin: 0 0 0.75rem;
  }

  :global(.markdown-content p:last-child) {
    margin-bottom: 0;
  }

  :global(.markdown-content ul),
  :global(.markdown-content ol) {
    margin: 0 0 0.75rem;
    padding-left: 1.25rem;
  }

  :global(.markdown-content li) {
    margin-bottom: 0.25rem;
  }

  :global(.markdown-content a) {
    color: var(--accent);
    text-decoration: underline;
    text-underline-offset: 0.15em;
  }

  :global(.markdown-content code) {
    border-radius: 0.4rem;
    background: color-mix(in srgb, var(--accent) 10%, transparent);
    padding: 0.1em 0.35em;
    font-size: 0.95em;
  }

  :global(.markdown-content pre) {
    overflow-x: auto;
    border-radius: 0.8rem;
    background: color-mix(in srgb, var(--accent) 8%, transparent);
    padding: 0.8rem 0.9rem;
    margin: 0 0 0.75rem;
  }

  :global(.markdown-content pre code) {
    background: none;
    padding: 0;
  }

  :global(.markdown-content blockquote) {
    margin: 0 0 0.75rem;
    border-left: 2px solid color-mix(in srgb, var(--accent) 50%, transparent);
    padding-left: 0.75rem;
    color: var(--text-muted);
  }
</style>
