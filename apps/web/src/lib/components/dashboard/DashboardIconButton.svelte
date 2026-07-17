<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    ariaLabel: string;
    title?: string;
    active?: boolean;
    disabled?: boolean;
    ariaExpanded?: boolean;
    ariaControls?: string;
    class?: string;
    onClick?: () => void | Promise<void>;
    children: Snippet;
  };

  let {
    ariaLabel,
    title,
    active = false,
    disabled = false,
    ariaExpanded,
    ariaControls,
    class: className = '',
    onClick,
    children
  }: Props = $props();
</script>

<button
  type="button"
  aria-label={ariaLabel}
  title={title}
  aria-pressed={active}
  aria-expanded={ariaExpanded}
  aria-controls={ariaControls}
  disabled={disabled}
  class={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-[1rem] border transition-colors ${active ? 'border-accent/30 bg-accent/12 text-accent shadow-[0_12px_26px_rgba(15,23,42,0.08)]' : 'border-border bg-bg-secondary text-muted hover:border-border-hover hover:text-foreground'} disabled:cursor-not-allowed disabled:opacity-50 ${className}`.trim()}
  onclick={() => {
    if (!disabled) {
      void onClick?.();
    }
  }}
>
  {@render children()}
</button>
