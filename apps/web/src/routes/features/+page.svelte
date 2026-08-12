<script lang="ts">
  import { resolve } from '$app/paths';
  import { Bell, ChartNoAxesCombined, ListChecks, Smartphone } from 'lucide-svelte';
  import PublicSeoHead from '$lib/components/PublicSeoHead.svelte';
  import PublicNav from '$lib/components/PublicNav.svelte';
  import PublicFooter from '$lib/components/PublicFooter.svelte';
  import { PUBLIC_FEATURES_SEO } from '$lib/seo/publicPages';

  const features = [
    { title: 'A clear daily list', text: 'Keep today’s habits and targets close, with quick check-ins that do not ask for a ceremony.', icon: ListChecks },
    { title: 'Progress with context', text: 'See streaks, completion patterns, and longer-term movement when you want more than a yes or no.', icon: ChartNoAxesCombined },
    { title: 'Reminders that fit', text: 'Add a nudge to the habits where timing matters, then change it when your schedule changes.', icon: Bell },
    { title: 'Ready where you are', text: 'Use the web app on a phone, tablet, or computer, or launch the Telegram Mini App for a quick daily check-in.', icon: Smartphone }
  ];
</script>

<PublicSeoHead title={PUBLIC_FEATURES_SEO.title} description={PUBLIC_FEATURES_SEO.description} keywords={PUBLIC_FEATURES_SEO.keywords} pathname={PUBLIC_FEATURES_SEO.pathname} />

<div data-theme="cloud" class="min-h-screen bg-[#f7f8f4] text-foreground">
  <PublicNav maxWidth="max-w-6xl" />
  <main class="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
    <nav class="mb-8 flex items-center gap-2 text-sm text-muted" aria-label="Breadcrumb">
      <a href={resolve<'/'>('/', {})} class="underline-offset-4 hover:text-foreground hover:underline">Home</a>
      <span aria-hidden="true">/</span>
      <span class="text-foreground">Features</span>
    </nav>

    <section class="grid gap-8 rounded-[2rem] border border-border bg-bg-card p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.22em] text-progress">What helps</p>
        <h1 class="mt-4 max-w-xl text-4xl font-semibold leading-[1.02] tracking-tight text-foreground sm:text-6xl">The useful parts of a habit tracker, kept close.</h1>
      </div>
      <p class="max-w-xl text-base leading-7 text-muted sm:text-lg">A calm daily view, enough context to learn from your patterns, and reminders that support the routine you actually have.</p>
    </section>

    <section class="mt-8 grid gap-3 sm:grid-cols-2" aria-label="Habbit Runner features">
      {#each features as feature, i (feature.title + '-' + i)}
        <article class="rounded-[1.5rem] border border-border bg-bg-card p-5 shadow-sm sm:p-6">
          <svelte:component this={feature.icon} size={22} class="text-progress" aria-hidden="true" />
          <h2 class="mt-5 text-xl font-semibold tracking-tight text-foreground">{feature.title}</h2>
          <p class="mt-2 max-w-md text-sm leading-6 text-muted">{feature.text}</p>
        </article>
      {/each}
    </section>

    <section class="mt-8 grid gap-6 rounded-[1.75rem] border border-border bg-[#edf1ea] p-6 sm:p-8 lg:grid-cols-[1fr_0.9fr]">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.22em] text-progress">Choose your next step</p>
        <h2 class="mt-3 text-2xl font-semibold tracking-tight text-foreground">Start with one habit. Add detail only when it earns its place.</h2>
      </div>
      <div class="flex flex-wrap items-center gap-3 lg:justify-end">
        <a href={resolve('/showcase', {})} class="inline-flex min-h-11 items-center justify-center rounded-full bg-progress px-5 py-3 text-sm font-semibold text-bg-primary hover:bg-progress/90">Try the demo</a>
        <a href={resolve('/habit-tracker', {})} class="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-bg-card px-5 py-3 text-sm font-semibold text-foreground hover:border-progress/30 hover:text-progress">Read the guide</a>
      </div>
    </section>
  </main>
  <PublicFooter />
</div>
