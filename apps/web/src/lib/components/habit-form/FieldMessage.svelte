<script lang="ts">
  type Props = {
    message?: string | null;
    tone?: 'error' | 'help' | 'success';
    class?: string;
  };

  let { message = null, tone = 'help', class: className = '' }: Props = $props();

  const toneClass = $derived(
    tone === 'error' ? 'text-accent-secondary' : tone === 'success' ? 'text-accent' : 'text-muted'
  );
</script>

<p class={`min-h-4 text-xs leading-5 ${toneClass} ${className}`.trim()} aria-live={tone === 'error' ? 'polite' : undefined}>
  {message ?? ''}
</p>
