<script lang="ts">
  type Props = {
    value: number;
    tone?: 'progress' | 'attention' | 'neutral';
    label?: string;
  };

  let { value, tone = 'progress', label }: Props = $props();
</script>

<div>
  {#if label}
    <div class="mb-2 flex items-center justify-between gap-3">
      <span class="text-[10px] font-medium uppercase tracking-[0.24em] text-muted">{label}</span>
      <span class="text-xs font-medium text-foreground">{Math.round(value)}%</span>
    </div>
  {/if}
  <div class="h-2 overflow-hidden rounded-full bg-border">
    <div
      class={`h-full rounded-full transition-all duration-300 ${tone === 'attention' ? 'bg-attention' : tone === 'neutral' ? 'bg-border-hover' : 'bg-progress'}`}
      style:width={`${Math.max(0, Math.min(100, value))}%`}
      role="progressbar"
      aria-label={label ?? 'Progress'}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow={Math.round(Math.max(0, Math.min(100, value)))}
    ></div>
  </div>
</div>
