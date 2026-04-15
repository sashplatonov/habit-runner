<script lang="ts">
  import { BarChart3, CircleHelp, Grid2x2, TrendingUp, X } from 'lucide-svelte';

  type ChartGuideVariant = 'bars' | 'line' | 'grid' | 'columns';

  type Props = {
    title: string;
    summary: string;
    focusPoints: string[];
    variant?: ChartGuideVariant;
    triggerClassName?: string;
  };

  const { title, summary, focusPoints, variant = 'bars', triggerClassName = '' }: Props = $props();

  let open = $state(false);
  let triggerEl = $state<HTMLButtonElement | null>(null);
  let panelEl = $state<HTMLDivElement | null>(null);
  let position = $state({ left: 12, top: 12 });

  function updatePosition() {
    const trigger = triggerEl;
    const panel = panelEl;
    if (!trigger || !panel) return;

    const margin = 12;
    const tr = trigger.getBoundingClientRect();
    const pr = panel.getBoundingClientRect();
    const maxLeft = Math.max(margin, window.innerWidth - pr.width - margin);
    const preferredLeft = tr.right - pr.width;
    const left = Math.min(Math.max(margin, preferredLeft), maxLeft);

    let top = tr.bottom + 10;
    if (top + pr.height > window.innerHeight - margin) {
      top = Math.max(margin, tr.top - pr.height - 10);
    }

    position = { left, top };
  }

  $effect(() => {
    if (!open) return;

    // Delay to let panel render
    const raf = requestAnimationFrame(updatePosition);

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node | null;
      if (triggerEl?.contains(target) || panelEl?.contains(target)) return;
      open = false;
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') open = false;
    }

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  });
</script>

<button
  bind:this={triggerEl}
  type="button"
  onclick={() => { open = !open; }}
  class="inline-flex items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-accent transition-colors hover:bg-accent/20 {triggerClassName}"
  aria-label="Chart guide: {title}"
>
  <CircleHelp size={14} />
</button>

{#if open}
  <div
    bind:this={panelEl}
    class="fixed z-[240] w-72 max-w-[calc(100vw-1.5rem)] rounded-3xl border border-border bg-bg-card p-3 text-left shadow-[0_18px_60px_rgba(0,0,0,0.32)]"
    style:left="{position.left}px"
    style:top="{position.top}px"
    role="dialog"
    aria-modal="true"
    aria-label="{title} explanation"
  >
    <!-- Header -->
    <div class="mb-3 flex items-center gap-2">
      <div class="flex min-w-0 flex-1 items-center gap-2">
        <div class="flex h-8 w-8 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
          {#if variant === 'line'}
            <TrendingUp size={14} />
          {:else if variant === 'grid'}
            <Grid2x2 size={14} />
          {:else}
            <BarChart3 size={14} />
          {/if}
        </div>
        <div class="min-w-0">
          <p class="text-[9px] font-mono uppercase tracking-[0.22em] text-muted">Why it matters</p>
          <p class="truncate text-xs font-semibold text-foreground">{title}</p>
        </div>
      </div>
      <button
        type="button"
        onclick={() => { open = false; }}
        class="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full border border-border bg-bg-primary/70 text-muted transition-colors hover:border-border-hover hover:text-foreground"
        aria-label="Close {title} explanation"
      >
        <X size={14} />
      </button>
    </div>

    <!-- Chart visual -->
    {#if variant === 'line'}
      <div class="relative h-20 overflow-hidden rounded-2xl border border-accent/20 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01))] px-3 py-2">
        <div class="absolute inset-x-0 bottom-2 h-px bg-border/60"></div>
        <svg viewBox="0 0 96 56" class="relative z-10 h-full w-full">
          <polyline fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="4,40 22,30 38,34 54,18 72,22 92,8" />
          {#each [['4','40'],['22','30'],['38','34'],['54','18'],['72','22'],['92','8']] as [x, y], xi (x + '-' + xi)}
            <circle cx={x} cy={y} r="3.5" fill="var(--bg-primary)" stroke="var(--accent)" stroke-width="2" />
          {/each}
        </svg>
        <div class="absolute left-3 top-3 rounded-full border border-accent/20 bg-accent/10 px-2 py-0.5 text-[9px] font-mono uppercase tracking-[0.2em] text-accent">trend</div>
      </div>
    {:else if variant === 'grid'}
      <div class="grid h-20 grid-cols-5 gap-1 rounded-2xl border border-accent/20 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01))] p-3">
        {#each [0.14,0.22,0.42,0.78,0.3,0.24,0.56,0.92,0.48,0.18,0.12,0.66,0.28,0.84,0.34,0.16,0.38,0.7,0.5,0.2] as opacity, oi (opacity + '-' + oi)}
          <div class="rounded-[6px] bg-accent" style:opacity={opacity}></div>
        {/each}
      </div>
    {:else if variant === 'columns'}
      <div class="flex h-20 items-end gap-1 rounded-2xl border border-accent/20 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01))] p-3">
        {#each [[24,0.28],[42,0.36],[32,0.44],[58,0.52],[50,0.60],[72,0.68],[46,0.76],[64,0.84]] as [height, opacity], ci (height + '-' + ci)}
          <div class="flex-1 rounded-t-md bg-accent" style:height="{height}px" style:opacity={opacity}></div>
        {/each}
      </div>
    {:else}
      <div class="flex h-20 items-end gap-1 rounded-2xl border border-accent/20 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01))] p-3">
        {#each [[28,0.35],[44,0.45],[60,0.55],[38,0.65],[68,0.75]] as [height, opacity], ci2 (height + '-' + ci2)}
          <div class="flex-1 rounded-t-md bg-accent" style:height="{height}px" style:opacity={opacity}></div>
        {/each}
      </div>
    {/if}

    <!-- Summary -->
    <p class="mt-3 text-[11px] leading-relaxed text-muted">{summary}</p>

    <!-- Focus points -->
    <ul class="mt-3 space-y-1.5">
      {#each focusPoints as point, pi (point + '-' + pi)}
        <li class="flex items-start gap-2 text-[11px] text-muted">
          <span class="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/60"></span>
          {point}
        </li>
      {/each}
    </ul>
  </div>
{/if}
