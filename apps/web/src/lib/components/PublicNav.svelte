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

<header class="sticky top-0 z-20 border-b border-slate-200/90 bg-white/95 backdrop-blur">
  <div class="mx-auto flex w-full {maxWidth} items-center gap-4 px-4 py-4 sm:px-6">
    <a href={resolve<'/'>('/', {})} class="flex flex-shrink-0 items-center gap-2.5 text-sm font-semibold text-slate-900">
      <img src="/app-icon.svg" alt="Habbit Runner" class="h-8 w-8 flex-shrink-0 rounded-lg object-contain" />
      <span class="hidden sm:block">Habbit Runner</span>
    </a>

    <nav class="hidden flex-1 items-center gap-6 sm:flex" aria-label="Main navigation">
      <a
        href={resolve<'/features'>('/features', {})}
        aria-current={page.url.pathname === featuresHref ? 'page' : undefined}
        class="text-xs font-medium transition-colors {page.url.pathname === featuresHref ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}"
      >Features</a>
      <a
        href={resolve<'/blog'>('/blog', {})}
        aria-current={page.url.pathname === blogHref ? 'page' : undefined}
        class="text-xs font-medium transition-colors {page.url.pathname === blogHref ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}"
      >Blog</a>
      <a
        href={resolve<'/about'>('/about', {})}
        aria-current={page.url.pathname === aboutHref ? 'page' : undefined}
        class="text-xs font-medium transition-colors {page.url.pathname === aboutHref ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}"
      >About</a>
    </nav>

    <div class="ml-auto flex items-center gap-2 sm:gap-3">
      <!-- Mobile nav links (compact) -->
      <nav class="flex items-center gap-3 sm:hidden" aria-label="Mobile navigation">
        <a
          href={resolve<'/features'>('/features', {})}
          aria-current={page.url.pathname === featuresHref ? 'page' : undefined}
          class="text-[11px] font-medium {page.url.pathname === featuresHref ? 'text-slate-900' : 'text-slate-500'}"
        >Features</a>
        <a
          href={resolve<'/blog'>('/blog', {})}
          aria-current={page.url.pathname === blogHref ? 'page' : undefined}
          class="text-[11px] font-medium {page.url.pathname === blogHref ? 'text-slate-900' : 'text-slate-500'}"
        >Blog</a>
        <a
          href={resolve<'/about'>('/about', {})}
          aria-current={page.url.pathname === aboutHref ? 'page' : undefined}
          class="text-[11px] font-medium {page.url.pathname === aboutHref ? 'text-slate-900' : 'text-slate-500'}"
        >About</a>
      </nav>

      {#if cta}
        {@render cta()}
      {:else}
        <a
          href={resolve<'/'>('/', {})}
          class="rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 transition-colors hover:bg-cyan-100"
        >
          Get Started
        </a>
      {/if}
    </div>
  </div>
</header>
