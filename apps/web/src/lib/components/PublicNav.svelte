<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import type { Snippet } from 'svelte';
  import { Menu, X } from 'lucide-svelte';
  import { startOAuthLogin } from '$lib/auth/oauth';

  type Props = {
    cta?: Snippet;
    maxWidth?: string;
  };

  let { cta, maxWidth = 'max-w-6xl' }: Props = $props();
  let mobileNavigationOpen = $state(false);
  let menuButton = $state<HTMLButtonElement>();

  const featuresHref = resolve<'/features'>('/features', {});
  const blogHref = resolve<'/blog'>('/blog', {});
  const aboutHref = resolve<'/about'>('/about', {});
  const showcaseHref = resolve<'/showcase'>('/showcase', {});

  function closeMobileNavigation() {
    mobileNavigationOpen = false;
  }

  function closeMobileNavigationAndRestoreFocus() {
    closeMobileNavigation();
    menuButton?.focus();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeMobileNavigationAndRestoreFocus();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<header data-theme="cloud" class="sticky top-0 z-30 border-b border-border/70 bg-[rgba(244,246,241,0.82)] backdrop-blur-xl supports-[backdrop-filter]:bg-[rgba(244,246,241,0.68)]">
  <div class="mx-auto flex w-full {maxWidth} items-center gap-4 px-4 py-4 sm:px-6">
    <a href={resolve<'/'>('/', {})} class="group flex flex-shrink-0 items-center gap-3 text-sm font-semibold text-foreground">
      <span class="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-bg-card shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition-transform duration-200 group-hover:scale-[1.03]">
        <img src="/app-icon.svg" alt="Habbit Runner" width="32" height="32" class="h-8 w-8 flex-shrink-0 rounded-xl object-contain" />
      </span>
      <span class="hidden sm:block">
        <span class="block text-[10px] uppercase tracking-[0.26em] text-muted">Daily practice</span>
        <span class="block text-sm font-semibold tracking-tight text-foreground">Habbit Runner</span>
      </span>
    </a>

    <nav class="hidden flex-1 items-center gap-1 sm:flex" aria-label="Main navigation">
        <a
          href={resolve<'/features'>('/features', {})}
          aria-current={page.url.pathname === featuresHref ? 'page' : undefined}
          class="inline-flex min-h-11 items-center rounded-full px-3 py-2 text-xs font-medium transition-[background-color,color,box-shadow] {page.url.pathname === featuresHref ? 'bg-bg-card text-foreground shadow-[0_12px_24px_rgba(15,23,42,0.12)]' : 'text-muted hover:bg-bg-card hover:text-foreground'}"
        >Features</a>
        <a
          href={resolve<'/blog'>('/blog', {})}
          aria-current={page.url.pathname === blogHref ? 'page' : undefined}
          class="inline-flex min-h-11 items-center rounded-full px-3 py-2 text-xs font-medium transition-[background-color,color,box-shadow] {page.url.pathname === blogHref ? 'bg-bg-card text-foreground shadow-[0_12px_24px_rgba(15,23,42,0.12)]' : 'text-muted hover:bg-bg-card hover:text-foreground'}"
        >Blog</a>
        <a
          href={showcaseHref}
          aria-current={page.url.pathname === showcaseHref ? 'page' : undefined}
          class="inline-flex min-h-11 items-center rounded-full px-3 py-2 text-xs font-medium transition-[background-color,color,box-shadow] {page.url.pathname === showcaseHref ? 'bg-bg-card text-foreground shadow-[0_12px_24px_rgba(15,23,42,0.12)]' : 'text-muted hover:bg-bg-card hover:text-foreground'}"
        >Showcase</a>
        <a
          href={resolve<'/about'>('/about', {})}
          aria-current={page.url.pathname === aboutHref ? 'page' : undefined}
          class="inline-flex min-h-11 items-center rounded-full px-3 py-2 text-xs font-medium transition-[background-color,color,box-shadow] {page.url.pathname === aboutHref ? 'bg-bg-card text-foreground shadow-[0_12px_24px_rgba(15,23,42,0.12)]' : 'text-muted hover:bg-bg-card hover:text-foreground'}"
        >About</a>
    </nav>

    <div class="ml-auto flex items-center gap-2 sm:gap-3">
      <button
        bind:this={menuButton}
        type="button"
        class="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-progress/30 hover:text-progress sm:hidden"
        aria-controls="public-mobile-navigation"
        aria-expanded={mobileNavigationOpen}
        aria-label={mobileNavigationOpen ? 'Close navigation menu' : 'Open navigation menu'}
        onclick={() => { mobileNavigationOpen = !mobileNavigationOpen; }}
      >
        {#if mobileNavigationOpen}
          <X size={18} aria-hidden="true" />
        {:else}
          <Menu size={18} aria-hidden="true" />
        {/if}
      </button>

      {#if cta}
        {@render cta()}
      {:else}
        <button
          type="button"
          onclick={startOAuthLogin}
          class="min-h-11 rounded-full border border-progress/20 bg-bg-card px-4 py-2 text-xs font-semibold text-foreground shadow-[0_12px_24px_rgba(15,23,42,0.08)] transition-[transform,border-color,color] hover:-translate-y-0.5 hover:border-progress/30 hover:text-progress"
        >
          Get Started
        </button>
      {/if}
    </div>
  </div>
  {#if mobileNavigationOpen}
    <nav id="public-mobile-navigation" class="border-t border-border/70 bg-[rgba(244,246,241,0.96)] px-4 py-3 sm:hidden" aria-label="Mobile navigation">
      <div class="mx-auto grid max-w-6xl gap-2">
        <a href={resolve<'/features'>('/features', {})} aria-current={page.url.pathname === featuresHref ? 'page' : undefined} onclick={closeMobileNavigation} class="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium transition-colors {page.url.pathname === featuresHref ? 'bg-bg-card text-foreground' : 'text-muted hover:bg-bg-card hover:text-foreground'}">Features</a>
        <a href={resolve<'/blog'>('/blog', {})} aria-current={page.url.pathname === blogHref ? 'page' : undefined} onclick={closeMobileNavigation} class="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium transition-colors {page.url.pathname === blogHref ? 'bg-bg-card text-foreground' : 'text-muted hover:bg-bg-card hover:text-foreground'}">Blog</a>
        <a href={showcaseHref} aria-current={page.url.pathname === showcaseHref ? 'page' : undefined} onclick={closeMobileNavigation} class="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium transition-colors {page.url.pathname === showcaseHref ? 'bg-bg-card text-foreground' : 'text-muted hover:bg-bg-card hover:text-foreground'}">Showcase</a>
        <a href={resolve<'/about'>('/about', {})} aria-current={page.url.pathname === aboutHref ? 'page' : undefined} onclick={closeMobileNavigation} class="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium transition-colors {page.url.pathname === aboutHref ? 'bg-bg-card text-foreground' : 'text-muted hover:bg-bg-card hover:text-foreground'}">About</a>
      </div>
    </nav>
  {/if}
</header>
