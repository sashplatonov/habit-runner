<script lang="ts">
  import { portal } from '$lib/actions/portal';

  type Placement = 'above' | 'below';

  type Props = {
    description: string;
  };

  const { description }: Props = $props();

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
      <p class="whitespace-pre-wrap break-words px-3 pb-3 text-[11px] leading-[1.6] text-foreground">{description}</p>
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
