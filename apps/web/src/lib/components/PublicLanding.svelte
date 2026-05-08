<script lang="ts">
  import { resolve } from '$app/paths';
  import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-svelte';
  import { startOAuthLogin } from '$lib/auth/oauth';
  import PublicNav from '$lib/components/PublicNav.svelte';
  import PublicPreviewCarousel from '$lib/components/PublicPreviewCarousel.svelte';
  import PublicSeoHead from '$lib/components/PublicSeoHead.svelte';
  import { PUBLIC_LANDING_SEO } from '$lib/seo/publicPages';

  type Props = {
    redirecting?: boolean;
  };

  let { redirecting = false }: Props = $props();
  let noticeMessage = $state<string | null>(null);

  const featureHighlights = [
    'Daily completion targets',
    'Current and longest streak analytics',
    'Sync-ready workflow across devices'
  ];

  function scrollToPreview() {
    document.getElementById('product-preview')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  function showAuthHelp() {
    noticeMessage = 'OAuth is not configured. Export backend Google OAuth env vars (or set them in root .env for Docker) and restart the API.';
    window.setTimeout(() => {
      noticeMessage = null;
    }, 6000);
  }
</script>

<PublicSeoHead
  title={PUBLIC_LANDING_SEO.title}
  description={PUBLIC_LANDING_SEO.description}
  keywords={PUBLIC_LANDING_SEO.keywords}
  pathname={PUBLIC_LANDING_SEO.pathname}
  faq={PUBLIC_LANDING_SEO.faq}
/>

<div class="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fb_46%,#f7fbff_100%)] text-slate-900">
  <PublicNav>
    {#snippet cta()}
      <button
        type="button"
        onclick={() => { startOAuthLogin(); }}
        class="hidden sm:inline-flex rounded-full border border-sky-200 bg-white px-4 py-2 text-xs font-semibold text-slate-900 shadow-[0_12px_24px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:text-sky-700"
      >
        Continue with Google
      </button>
    {/snippet}
  </PublicNav>

  <main>
    <section class="border-b border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(49,105,255,0.18),transparent_34%),radial-gradient(circle_at_85%_15%,rgba(16,179,154,0.16),transparent_24%),linear-gradient(180deg,#f9fcff_0%,#eef4fb_100%)]">
      <div class="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.08fr_0.92fr] md:py-16">
        <div>
          <div class="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-white/85 px-3 py-1.5 text-xs font-medium text-sky-700 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
            <Sparkles size={14} />
            See your progress before you even sign in
          </div>
          <h1 class="max-w-2xl text-4xl font-semibold leading-[1.02] tracking-tight text-slate-950 sm:text-5xl">
            Habit tracker app for daily routine planning and reliable streak growth.
          </h1>
          <p class="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            You can see how the product looks before sign-in. Habbit Runner focuses on daily
            completion, streak integrity, and fast overview of what is done right now.
          </p>
          <div class="mt-7 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onclick={() => {
                startOAuthLogin();
              }}
              class="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-0.5 hover:bg-sky-700"
            >
              Continue with Google
              <ArrowRight size={15} />
            </button>
            <button
              type="button"
              onclick={scrollToPreview}
              class="rounded-full border border-slate-300 bg-white/90 px-4 py-2.5 text-sm text-slate-700 shadow-[0_12px_24px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-0.5 hover:border-slate-400 hover:text-slate-900"
            >
              See product preview
            </button>
            <a
              href={resolve<'/habit-tracker'>('/habit-tracker', {})}
              class="rounded-full border border-slate-300 bg-white/90 px-4 py-2.5 text-sm text-slate-700 shadow-[0_12px_24px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-0.5 hover:border-slate-400 hover:text-slate-900"
            >
              Explore habit tracker page
            </a>
          </div>
          <div class="mt-8 grid gap-3 sm:grid-cols-3">
            {#each featureHighlights as item, i (item + '-' + i)}
              <div class="rounded-2xl border border-white/80 bg-white/86 px-4 py-3 text-xs text-slate-600 shadow-[0_14px_32px_rgba(15,23,42,0.07)]">
                <CheckCircle2 size={13} class="mb-3 text-emerald-600" />
                <p>{item}</p>
              </div>
            {/each}
          </div>
        </div>

        <div class="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-[0_26px_80px_rgba(15,23,42,0.12)]">
          <div class="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-sky-300 to-transparent"></div>
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xs uppercase tracking-[0.22em] text-slate-400">What you get</p>
              <h2 class="mt-3 text-2xl font-semibold tracking-tight text-slate-950">A calmer surface for daily follow-through.</h2>
            </div>
            <div class="rounded-2xl bg-slate-950 px-4 py-2 text-right text-white shadow-[0_14px_32px_rgba(15,23,42,0.18)]">
              <p class="text-[10px] uppercase tracking-[0.22em] text-sky-200">Offline ready</p>
              <p class="mt-1 text-lg font-semibold">From day one</p>
            </div>
          </div>

          <div class="mt-6 grid gap-3 sm:grid-cols-3">
            <div class="rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
              <p class="text-[10px] uppercase tracking-[0.22em] text-slate-400">Daily view</p>
              <p class="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Now</p>
              <p class="mt-2 text-sm text-slate-600">Rate, done count, and active habits in one compact block.</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
              <p class="text-[10px] uppercase tracking-[0.22em] text-slate-400">Habit rows</p>
              <p class="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Signal</p>
              <p class="mt-2 text-sm text-slate-600">Completion, context tags, streak state, and momentum in one pass.</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
              <p class="text-[10px] uppercase tracking-[0.22em] text-slate-400">Stats and edit flow</p>
              <p class="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Depth</p>
              <p class="mt-2 text-sm text-slate-600">Browse dashboard, edit habits, and review detailed trends without context switching.</p>
            </div>
          </div>

          <div class="mt-4 rounded-[1.5rem] border border-sky-100 bg-[linear-gradient(135deg,rgba(49,105,255,0.08),rgba(16,179,154,0.08))] p-4 text-sm text-slate-700">
            <div class="flex items-center justify-between gap-3">
              <p class="font-semibold text-slate-950">Built for momentum, not theatrics.</p>
              <span class="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">PWA</span>
            </div>
            <p class="mt-2 text-slate-600">The product stays readable under pressure: fewer panels, clearer progress, and calmer defaults.</p>
          </div>
        </div>
      </div>
    </section>

    {#if redirecting}
      <div class="mx-auto mt-6 max-w-6xl px-4 sm:px-6">
        <p class="rounded-[1.75rem] border border-slate-200/80 bg-white/90 px-5 py-4 text-sm text-slate-600 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          Restoring your session and redirecting to the dashboard…
        </p>
      </div>
    {/if}

    <PublicPreviewCarousel />

    <section class="border-b border-slate-200/80 bg-white/70 px-4 py-12 sm:px-6">
      <div class="mx-auto grid w-full max-w-6xl gap-6 md:grid-cols-2">
        <article class="rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
          <h2 class="text-xl font-semibold text-slate-900">What Makes Habbit Runner Different</h2>
          <p class="mt-3 text-sm text-slate-600">
            Habbit Runner is a habit tracking app focused on execution. You set daily targets, check
            progress in a clear dashboard, and monitor streaks without clutter.
          </p>
          <ul class="mt-4 space-y-2 text-sm text-slate-700">
            <li>Simple habit tracker for consistent daily routines.</li>
            <li>Streak tracker with current streak and longest streak history.</li>
            <li>Goal tracking with completion rates and trend visibility.</li>
          </ul>
          <div class="mt-4 flex flex-wrap gap-2">
            <a href={resolve<'/streak-tracker'>('/streak-tracker', {})} class="text-xs text-cyan-700 underline">Streak tracker details</a>
            <a href={resolve<'/daily-routine-planner'>('/daily-routine-planner', {})} class="text-xs text-cyan-700 underline">Daily routine planner details</a>
          </div>
        </article>

        <article class="rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
          <h2 class="text-xl font-semibold text-slate-900">Best For</h2>
          <p class="mt-3 text-sm text-slate-600">
            This productivity app is built for people who want clear data instead of motivational
            noise: founders, creators, athletes, students, and teams building daily discipline.
          </p>
          <ul class="mt-4 space-y-2 text-sm text-slate-700">
            <li>Personal habit planning and consistency tracking.</li>
            <li>Routine management for work, health, learning, and focus.</li>
            <li>Weekly and monthly performance review from one place.</li>
          </ul>
        </article>
      </div>
    </section>

    <section class="bg-[linear-gradient(180deg,rgba(255,255,255,0.5),rgba(239,246,255,0.78))] px-4 py-12 sm:px-6">
      <div class="mx-auto w-full max-w-6xl">
        <h2 class="text-2xl font-semibold text-slate-900">Habit Tracker FAQ</h2>
        <div class="mt-5 space-y-3">
          {#each PUBLIC_LANDING_SEO.faq as item, k (item.question + '-' + k)}
            <details class="rounded-[1.25rem] border border-slate-200/80 bg-white/92 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
              <summary class="cursor-pointer text-sm font-semibold text-slate-900">
                {item.question}
              </summary>
              <p class="mt-2 text-sm text-slate-600">{item.answer}</p>
            </details>
          {/each}
        </div>
      </div>
    </section>
  </main>

  <footer class="border-t border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.4),rgba(239,246,255,0.9))] px-4 py-10 sm:px-6">
    <div class="mx-auto w-full max-w-6xl">
      <div class="grid grid-cols-2 gap-8 sm:grid-cols-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-slate-500">Product</p>
          <ul class="mt-3 space-y-2">
            <li><a href={resolve<'/features'>('/features', {})} class="text-xs text-slate-600 transition-colors hover:text-slate-900">Features</a></li>
            <li><a href={resolve<'/blog'>('/blog', {})} class="text-xs text-slate-600 transition-colors hover:text-slate-900">Blog</a></li>
            <li><a href={resolve<'/about'>('/about', {})} class="text-xs text-slate-600 transition-colors hover:text-slate-900">About</a></li>
          </ul>
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-slate-500">Tools</p>
          <ul class="mt-3 space-y-2">
            <li><a href={resolve<'/habit-tracker'>('/habit-tracker', {})} class="text-xs text-slate-600 transition-colors hover:text-slate-900">Habit Tracker</a></li>
            <li><a href={resolve<'/streak-tracker'>('/streak-tracker', {})} class="text-xs text-slate-600 transition-colors hover:text-slate-900">Streak Tracker</a></li>
            <li><a href={resolve<'/daily-routine-planner'>('/daily-routine-planner', {})} class="text-xs text-slate-600 transition-colors hover:text-slate-900">Daily Routine Planner</a></li>
          </ul>
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-slate-500">Compare</p>
          <ul class="mt-3 space-y-2">
            <li><a href={resolve<'/vs/[slug]'>('/vs/[slug]', { slug: 'habitica' })} class="text-xs text-slate-600 transition-colors hover:text-slate-900">vs Habitica</a></li>
            <li><a href={resolve<'/vs/[slug]'>('/vs/[slug]', { slug: 'streaks-app' })} class="text-xs text-slate-600 transition-colors hover:text-slate-900">vs Streaks</a></li>
            <li><a href={resolve<'/vs/[slug]'>('/vs/[slug]', { slug: 'beeminder' })} class="text-xs text-slate-600 transition-colors hover:text-slate-900">vs Beeminder</a></li>
          </ul>
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-slate-500">Legal</p>
          <ul class="mt-3 space-y-2">
            <li><a href={resolve<'/privacy-policy'>('/privacy-policy', {})} class="text-xs text-slate-600 transition-colors hover:text-slate-900">Privacy Policy</a></li>
          </ul>
          <div class="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onclick={() => {
                startOAuthLogin();
              }}
              class="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-0.5 hover:border-cyan-300 hover:text-cyan-700"
            >
              Sign in
            </button>
            <button
              type="button"
              onclick={showAuthHelp}
              class="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-0.5 hover:border-slate-400 hover:text-slate-900"
            >
              Sign-in not working?
            </button>
          </div>
        </div>
      </div>
      <p class="mt-8 text-xs text-slate-400">Built for clarity and consistent daily execution.</p>
    </div>
  </footer>

  {#if noticeMessage}
    <div class="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full border border-emerald-300 bg-emerald-50/95 px-4 py-2 text-xs text-emerald-700 shadow-[0_18px_40px_rgba(16,185,129,0.18)] backdrop-blur-sm">
      {noticeMessage}
    </div>
  {/if}
</div>