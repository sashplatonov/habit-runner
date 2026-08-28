<script lang="ts">
  type Props = {
    points: number[];
    label?: string;
    compact?: boolean;
    tone?: 'attention' | 'progress';
  };

  const { points, label = 'Completion trend', compact = false, tone = 'progress' }: Props = $props();
  const width = $derived(compact ? 76 : 120);
  const height = $derived(compact ? 24 : 32);
  const padding = 3;
  const validPoints = $derived(points.filter((point) => Number.isFinite(point)));
  const hasData = $derived(validPoints.length >= 2);
  const path = $derived.by(() => {
    if (!hasData) return '';
    const step = (width - padding * 2) / Math.max(1, points.length - 1);
    return points.map((point, index) => {
      const value = Number.isFinite(point) ? Math.min(1, Math.max(0, point)) : 0;
      const x = padding + index * step;
      const y = height - padding - value * (height - padding * 2);
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(' ');
  });
</script>

<div class={`flex shrink-0 items-center ${compact ? 'h-6 w-[4.75rem]' : 'h-8 w-[7.5rem]'}`} role="img" aria-label={label}>
  {#if hasData}
    <svg viewBox={`0 0 ${width} ${height}`} class="h-full w-full" aria-hidden="true">
      <path d={path} fill="none" stroke={tone === 'attention' ? 'var(--danger)' : 'var(--accent)'} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  {:else}
    <span class="h-px w-full bg-border" aria-hidden="true"></span>
    <span class="sr-only">No trend data</span>
  {/if}
</div>
