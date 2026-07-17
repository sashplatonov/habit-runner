<script lang="ts">
  type Props = {
    as?: 'section' | 'div' | 'article';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    class?: string;
    style?: string;
    children: import('svelte').Snippet;
  };

  let { as = 'div', padding = 'md', class: className = '', style = '', children }: Props = $props();

  const tagClass = $derived(
    `rounded-surface border border-border bg-bg-card shadow-surface ${padding === 'none' ? '' : padding === 'sm' ? 'p-3' : padding === 'lg' ? 'p-6 sm:p-7' : 'p-4 sm:p-5'}`
  );
</script>

<svelte:element this={as} class={`${tagClass} ${className}`.trim()} {style}>
  {@render children()}
</svelte:element>
