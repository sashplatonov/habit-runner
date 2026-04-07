<script lang="ts">
  let { label = 'Loading…' }: { label?: string } = $props();
</script>

<div
  class="min-h-[200px] flex flex-col items-center justify-center gap-3 py-12"
  role="status"
  aria-label={label}
>
  <div class="w-8 h-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin"></div>
  <span class="sr-only">{label}</span>
</div>
