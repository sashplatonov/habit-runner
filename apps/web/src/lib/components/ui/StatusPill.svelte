<script lang="ts">
  type Props = {
    tone?: 'progress' | 'attention' | 'neutral';
    children: import('svelte').Snippet;
  };

  let { tone = 'neutral', children }: Props = $props();
</script>

<span class={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium ${tone === 'progress' ? 'border-progress/20 bg-progress/10 text-progress' : tone === 'attention' ? 'border-attention/20 bg-attention/10 text-attention' : 'border-border bg-bg-secondary text-muted'}`}>
  {@render children()}
</span>
