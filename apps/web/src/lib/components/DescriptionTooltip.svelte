<script lang="ts">
  type Props = {
    description: string;
  };

  const { description }: Props = $props();

  let show = $state(false);
  let ready = $state(false);
  let placement = $state<'above' | 'below'>('above');
  let anchor = $state({ cx: 0, triggerTop: 0, triggerBottom: 0 });
  let triggerEl = $state<HTMLButtonElement | null>(null);
  let panelEl = $state<HTMLDivElement | null>(null);

  const panelWidth = 280;

  const left = $derived.by(() => {
    if (typeof window === 'undefined') return anchor.cx;
    return Math.max(panelWidth / 2 + 12, Math.min(anchor.cx, window.innerWidth - panelWidth / 2 - 12));
  });

  const top = $derived(placement === 'above' ? anchor.triggerTop - 10 : anchor.triggerBottom + 10);
  const transform = $derived(placement === 'above' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)');

  function open() {
    const el = triggerEl;
    if (!el) return;
    const r = el.getBoundingClientRect();
    anchor = { cx: r.left + r.width / 2, triggerTop: r.top, triggerBottom: r.bottom };
    placement = 'above';
    ready = false;
    show = true;
  }

  $effect(() => {
    if (!show || !panelEl) return;
    const panelH = panelEl.offsetHeight;
    placement = anchor.triggerTop - panelH - 10 < 12 ? 'below' : 'above';
    ready = true;
  });
</script>

<button
  bind:this={triggerEl}
  type="button"
  class="inline-flex h-4 w-4 flex-shrink-0 cursor-help items-center justify-center rounded border border-dashed border-muted font-mono text-[9px] text-muted transition-colors hover:border-foreground hover:text-foreground"
  onmouseenter={open}
  onmouseleave={() => { show = false; }}
  onclick={(e) => { e.stopPropagation(); show ? (show = false) : open(); }}
  aria-label="Description"
>
  ?
</button>

{#if show}
  <div
    bind:this={panelEl}
    class="fixed z-[250] rounded-2xl border border-border bg-bg-card px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.3)]"
    style:width="{panelWidth}px"
    style:left="{left}px"
    style:top="{top}px"
    style:transform={transform}
    style:opacity={ready ? '1' : '0'}
    role="tooltip"
  >
    <p class="text-[11px] leading-relaxed text-muted">{description}</p>
  </div>
{/if}
