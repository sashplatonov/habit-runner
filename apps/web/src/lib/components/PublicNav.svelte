<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import type { Snippet } from 'svelte';

  type Props = {
    cta?: Snippet;
    maxWidth?: string;
  };

  let { cta, maxWidth = 'max-w-6xl' }: Props = $props();

  const featuresHref = resolve<'/features'>('/features', {});
  const blogHref = resolve<'/blog'>('/blog', {});
  const aboutHref = resolve<'/about'>('/about', {});
</script>

<header class="sticky top-0 z-30 border-b border-slate-200/80 bg-[rgba(247,250,252,0.82)] backdrop-blur-xl supports-[backdrop-filter]:bg-[rgba(247,250,252,0.68)]">
  <div class="mx-auto flex w-full {maxWidth} items-center gap-4 px-4 py-4 sm:px-6">
    <a href={resolve<'/'>('/', {})} class="group flex flex-shrink-0 items-center gap-3 text-sm font-semibold text-slate-900">
      <span class="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition-transform duration-200 group-hover:scale-[1.03]">
        <img src="/app-icon.svg" alt="Habbit Runner" class="h-8 w-8 flex-shrink-0 rounded-xl object-contain" />
      </span>
      <span class="hidden sm:block">
        <span class="block text-[10px] uppercase tracking-[0.26em] text-slate-400">Offline-first</span>
        <span class="block text-sm font-semibold tracking-tight text-slate-950">Habbit Runner</span>
      </span>
    </a>

    <nav class="hidden flex-1 items-center gap-1 sm:flex" aria-label="Main navigation">
      <a
        href={resolve<'/features'>('/features', {})}
        aria-current={page.url.pathname === featuresHref ? 'page' : undefined}
        class="rounded-full px-3 py-2 text-xs font-medium transition-all {page.url.pathname === featuresHref ? 'bg-slate-900 text-white shadow-[0_12px_24px_rgba(15,23,42,0.12)]' : 'text-slate-500 hover:bg-white hover:text-slate-900'}"
      >Features</a>
      <a
        href={resolve<'/blog'>('/blog', {})}
        aria-current={page.url.pathname === blogHref ? 'page' : undefined}
        class="rounded-full px-3 py-2 text-xs font-medium transition-all {page.url.pathname === blogHref ? 'bg-slate-900 text-white shadow-[0_12px_24px_rgba(15,23,42,0.12)]' : 'text-slate-500 hover:bg-white hover:text-slate-900'}"
      >Blog</a>
      <a
        href={resolve<'/about'>('/about', {})}
        aria-current={page.url.pathname === aboutHref ? 'page' : undefined}
        class="rounded-full px-3 py-2 text-xs font-medium transition-all {page.url.pathname === aboutHref ? 'bg-slate-900 text-white shadow-[0_12px_24px_rgba(15,23,42,0.12)]' : 'text-slate-500 hover:bg-white hover:text-slate-900'}"
      >About</a>
    </nav>

    <div class="ml-auto flex items-center gap-2 sm:gap-3">
      <!-- Mobile nav links (compact) -->
      <nav class="flex items-center gap-1 sm:hidden" aria-label="Mobile navigation">
        <a
          href={resolve<'/features'>('/features', {})}
          aria-current={page.url.pathname === featuresHref ? 'page' : undefined}
          class="rounded-full px-2.5 py-1.5 text-[11px] font-medium transition-colors {page.url.pathname === featuresHref ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}"
        >Features</a>
        <a
          href={resolve<'/blog'>('/blog', {})}
          aria-current={page.url.pathname === blogHref ? 'page' : undefined}
          class="rounded-full px-2.5 py-1.5 text-[11px] font-medium transition-colors {page.url.pathname === blogHref ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}"
        >Blog</a>
        <a
          href={resolve<'/about'>('/about', {})}
          aria-current={page.url.pathname === aboutHref ? 'page' : undefined}
          class="rounded-full px-2.5 py-1.5 text-[11px] font-medium transition-colors {page.url.pathname === aboutHref ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}"
        >About</a>
      </nav>

      {#if cta}
        {@render cta()}
      {:else}
        <a
          href={resolve<'/'>('/', {})}
          class="rounded-full border border-sky-200 bg-white px-4 py-2 text-xs font-semibold text-slate-900 shadow-[0_12px_24px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:text-sky-700"
        >
          Get Started
        </a>
      {/if}
    </div>
  </div>
</header>
