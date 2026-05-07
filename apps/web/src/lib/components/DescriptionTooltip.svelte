<script lang="ts">
  import { portal } from '$lib/actions/portal';
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';

  type Placement = 'above' | 'below';

  type Props = {
    description: string;
  };

  const { description }: Props = $props();

  const renderedDescription = $derived.by(() => {
    try {
      const html = marked.parse(description) as string;
      return DOMPurify.sanitize(html);
    } catch {
      return description;
    }
  });

  let show = $state(false);
  let ready = $state(false);
  let placement = $state<Placement>('above');
  let anchor = $state({ cx: 0, triggerTop: 0, triggerBottom: 0 });
  let triggerEl = $state<HTMLButtonElement | null>(null);
  let panelEl = $state<HTMLDivElement | null>(null);

  const panelWidth = $derived.by(() => {
    if (typeof window === 'undefined') {
      return 280;
    }
    return Math.min(280, window.innerWidth - 24);
  });

  const left = $derived.by(() => {
    if (typeof window === 'undefined') {
      return anchor.cx;
    }
    return Math.max(panelWidth / 2 + 12, Math.min(anchor.cx, window.innerWidth - panelWidth / 2 - 12));
  });

  const top = $derived(placement === 'above' ? anchor.triggerTop - 10 : anchor.triggerBottom + 10);
  const transform = $derived(placement === 'above' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)');

  function open() {
    const el = triggerEl;
    if (!el) {
      return;
    }
    const rect = el.getBoundingClientRect();
    anchor = {
      cx: rect.left + rect.width / 2,
      triggerTop: rect.top,
      triggerBottom: rect.bottom
    };
    placement = 'above';
    ready = false;
    show = true;
  }

  $effect(() => {
    if (!show || !panelEl) {
      return;
    }
    const panelHeight = panelEl.offsetHeight;
    placement = anchor.triggerTop - panelHeight - 10 < 12 ? 'below' : 'above';
    ready = true;
  });
</script>

<button
  bind:this={triggerEl}
  type="button"
  class="inline-flex h-4 w-4 flex-shrink-0 cursor-help items-center justify-center rounded border border-dashed border-muted font-mono text-[9px] text-muted transition-colors hover:border-foreground hover:text-foreground"
  onmouseenter={open}
  onmouseleave={() => { show = false; }}
  onclick={(e) => {
    e.stopPropagation();
    if (show) {
      show = false;
    } else {
      open();
    }
  }}
  aria-label="Description"
>
  ?
</button>

{#if show}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    use:portal
    bind:this={panelEl}
    class="fixed z-[9999]"
    style:left="{left}px"
    style:top="{top}px"
    style:transform={transform}
    style:width="{panelWidth}px"
    style:visibility={ready ? 'visible' : 'hidden'}
    role="tooltip"
    tabindex="-1"
    onmouseenter={() => { show = true; }}
    onmouseleave={() => { show = false; }}
    onclick={(e) => { e.stopPropagation(); }}
    onkeydown={(e) => {
      if (e.key === 'Escape') {
        show = false;
      }
    }}
  >
    <div class="overflow-hidden rounded-2xl border border-border/60 bg-bg-card shadow-[0_8px_32px_rgba(0,0,0,0.28)] backdrop-blur-sm">
      <div class="flex justify-center pb-1 pt-2">
        <div class="h-[2px] w-8 rounded-full bg-foreground opacity-25"></div>
      </div>
      <div class="markdown-content break-words px-3 pb-3 text-[11px] leading-[1.6] text-foreground">{@html renderedDescription}</div>
    </div>
    <div
      class="absolute left-1/2 h-0 w-0 -translate-x-1/2"
      style={placement === 'above'
        ? 'bottom: 0; transform: translateX(-50%) translateY(100%); border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid color-mix(in srgb, var(--border) 60%, transparent);'
        : 'top: 0; transform: translateX(-50%) translateY(-100%); border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 6px solid color-mix(in srgb, var(--border) 60%, transparent);'}
      aria-hidden="true"
    ></div>
  </div>
{/if}

<style>
  :global(.markdown-content) {
    word-break: break-word;
  }
  :global(.markdown-content p) {
    margin: 0 0 0.4em;
  }
  :global(.markdown-content p:last-child) {
    margin-bottom: 0;
  }
  :global(.markdown-content ul),
  :global(.markdown-content ol) {
    margin: 0 0 0.4em;
    padding-left: 1.2em;
  }
  :global(.markdown-content li) {
    margin-bottom: 0.2em;
  }
  :global(.markdown-content code) {
    background: color-mix(in srgb, var(--accent) 12%, transparent);
    padding: 0.1em 0.3em;
    border-radius: 3px;
    font-size: 0.95em;
  }
  :global(.markdown-content pre) {
    background: color-mix(in srgb, var(--accent) 8%, transparent);
    padding: 0.5em 0.7em;
    border-radius: 6px;
    overflow-x: auto;
    margin: 0.4em 0;
    font-size: 0.95em;
  }
  :global(.markdown-content pre code) {
    background: none;
    padding: 0;
  }
  :global(.markdown-content strong) {
    font-weight: 600;
  }
  :global(.markdown-content em) {
    font-style: italic;
  }
  :global(.markdown-content a) {
    color: var(--accent);
    text-decoration: underline;
  }
  :global(.markdown-content h1),
  :global(.markdown-content h2),
  :global(.markdown-content h3) {
    margin: 0.6em 0 0.3em;
    font-weight: 600;
    line-height: 1.3;
  }
  :global(.markdown-content h1) { font-size: 1.1em; }
  :global(.markdown-content h2) { font-size: 1.05em; }
  :global(.markdown-content h3) { font-size: 1em; }
  :global(.markdown-content blockquote) {
    border-left: 3px solid color-mix(in srgb, var(--accent) 40%, transparent);
    padding-left: 0.6em;
    margin: 0.4em 0;
    color: color-mix(in srgb, var(--foreground) 70%, transparent);
  }
</style>
