<script lang="ts">
  type Props = {
    label?: string;
  };

  let { label = 'Loading…' }: Props = $props();
</script>

<div class="flex items-center gap-2 py-2 text-xs font-mono text-muted" role="status">
  <div class="h-3 w-3 animate-spin rounded-full border border-accent/30 border-t-accent"></div>
  <span>{label}</span>
</div>
