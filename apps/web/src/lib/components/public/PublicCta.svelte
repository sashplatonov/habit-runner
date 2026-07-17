<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import type { RouteIdWithSearchOrHash } from '$app/types';
  import type { Snippet } from 'svelte';

  type Props = {
    href?: RouteIdWithSearchOrHash;
    onclick?: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    class?: string;
    children: Snippet;
  };

  const { href, onclick, variant = 'primary', size = 'md', class: className = '', children }: Props = $props();

  function handleClick() {
    if (href) {
      void goto(resolve(href, {}));
    } else if (onclick) {
      onclick();
    }
  }

  const variants = {
    primary: 'border-progress/20 bg-progress text-bg-primary shadow-[0_18px_36px_rgba(15,23,42,0.16)] hover:-translate-y-0.5 hover:bg-progress/90',
    secondary: 'border-border bg-bg-card text-foreground shadow-[0_12px_24px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:border-progress/25 hover:text-progress',
    ghost: 'border-border bg-bg-secondary text-muted shadow-[0_12px_24px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:border-border-hover hover:text-foreground'
  };

  const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-xs',
  lg: 'px-5 py-3 text-sm'
  };
</script>

<button
  type="button"
  onclick={handleClick}
  class="inline-flex items-center justify-center gap-2 rounded-full font-semibold uppercase tracking-widest transition-all {variants[variant]} {sizes[size]} {className}"
>
  {@render children()}
</button>
