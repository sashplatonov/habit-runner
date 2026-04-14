<script lang="ts">
  type Props = {
    label?: string;
  };

  let { label = 'Loading...' }: Props = $props();
</script>

<div class="flex min-h-[200px] flex-col items-center justify-center gap-3 py-12" role="status" aria-label={label}>
  <div class="h-8 w-8 animate-spin rounded-full border-2 border-accent/30 border-t-accent"></div>
  <span class="sr-only">{label}</span>
</div>
