<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    href?: string;
    onclick?: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    class?: string;
    children: Snippet;
  };

  const { href, onclick, variant = 'primary', size = 'md', class: className = '', children }: Props = $props();

  const variants = {
    primary: 'border-sky-200 bg-slate-950 text-white shadow-[0_18px_36px_rgba(15,23,42,0.16)] hover:-translate-y-0.5 hover:bg-sky-700',
    secondary: 'border-sky-200 bg-white/90 text-slate-700 shadow-[0_12px_24px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:border-sky-300 hover:text-slate-900',
    ghost: 'border-slate-300 bg-white/90 text-slate-700 shadow-[0_12px_24px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:border-slate-400 hover:text-slate-900'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-xs',
    lg: 'px-5 py-3 text-sm'
  };
</script>

{#if href}
  <a
    href={href}
    class="inline-flex items-center justify-center gap-2 rounded-full font-semibold uppercase tracking-widest transition-all {variants[variant]} {sizes[size]} {className}"
  >
    {@render children()}
  </a>
{:else}
  <button
    type="button"
    onclick={onclick}
    class="inline-flex items-center justify-center gap-2 rounded-full font-semibold uppercase tracking-widest transition-all {variants[variant]} {sizes[size]} {className}"
  >
    {@render children()}
  </button>
{/if}
