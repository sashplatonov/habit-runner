<script lang="ts">
  let { label = 'Loading…' }: { label?: string } = $props();
</script>

<div class="flex items-center gap-2 text-xs text-muted font-mono py-2" role="status">
  <div class="w-3 h-3 rounded-full border border-accent/30 border-t-accent animate-spin"></div>
  <span>{label}</span>
</div>
