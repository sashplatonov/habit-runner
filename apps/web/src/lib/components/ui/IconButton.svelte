<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    ariaLabel: string;
    title?: string;
    active?: boolean;
    toggle?: boolean;
    disabled?: boolean;
    loading?: boolean;
    expanded?: boolean;
    controls?: string;
    class?: string;
    element?: HTMLButtonElement | null;
    onClick?: () => void | Promise<void>;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    onFocus?: (event: FocusEvent) => void;
    onBlur?: (event: FocusEvent) => void;
    children: Snippet;
  };

  let {
    ariaLabel,
    title,
    active = false,
    toggle = false,
    disabled = false,
    loading = false,
    expanded,
    controls,
    class: className = '',
    element = $bindable<HTMLButtonElement | null>(null),
    onClick,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
    children
  }: Props = $props();
</script>

<button
  bind:this={element}
  type="button"
  aria-label={ariaLabel}
  title={title}
  aria-pressed={toggle ? active : undefined}
  aria-expanded={expanded}
  aria-controls={controls}
  aria-busy={loading}
  disabled={disabled || loading}
  class={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-[1rem] border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary ${active ? 'border-accent/30 bg-accent/12 text-accent shadow-[0_12px_26px_rgba(15,23,42,0.08)]' : 'border-border bg-bg-secondary text-muted hover:border-border-hover hover:text-foreground'} ${disabled || loading ? 'cursor-not-allowed opacity-50' : ''} ${className}`.trim()}
  onclick={() => {
    if (!disabled && !loading) {
      void onClick?.();
    }
  }}
  onmouseenter={onMouseEnter}
  onmouseleave={onMouseLeave}
  onfocus={(event) => onFocus?.(event)}
  onblur={(event) => onBlur?.(event)}
>
  {@render children()}
</button>
