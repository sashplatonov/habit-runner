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

<div class="min-h-screen bg-white text-slate-900">
  <PublicNav>
    {#snippet cta()}
      <button
        type="button"
        onclick={() => { startOAuthLogin(); }}
        class="hidden sm:inline-flex rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 transition-colors hover:bg-cyan-100"
      >
        Continue with Google
      </button>
    {/snippet}
  </PublicNav>

  <main>
    <section class="border-b border-slate-200 bg-[radial-gradient(circle_at_top,rgba(186,230,253,0.65),transparent_58%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
      <div class="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.08fr_0.92fr] md:py-16">
        <div>
          <div class="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs text-cyan-700">
            <Sparkles size={14} />
            See your progress before you even sign in
          </div>
          <h1 class="max-w-xl text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
            Habit tracker app for daily routine planning and reliable streak growth.
          </h1>
          <p class="mt-4 max-w-xl text-sm text-slate-600 sm:text-base">
            You can see how the product looks before sign-in. Habbit Runner focuses on daily
            completion, streak integrity, and fast overview of what is done right now.
          </p>
          <div class="mt-7 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onclick={() => {
                startOAuthLogin();
              }}
              class="inline-flex items-center gap-2 rounded-lg border border-cyan-300 bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-700 transition-all hover:bg-cyan-100"
            >
              Continue with Google
              <ArrowRight size={15} />
            </button>
            <button
              type="button"
              onclick={scrollToPreview}
              class="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900"
            >
              See product preview
            </button>
            <a
              href={resolve<'/habit-tracker'>('/habit-tracker', {})}
              class="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900"
            >
              Explore habit tracker page
            </a>
          </div>
          <div class="mt-8 grid gap-3 sm:grid-cols-3">
            {#each featureHighlights as item, i (item + '-' + i)}
              <div class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                <CheckCircle2 size={13} class="mb-2 text-emerald-600" />
                <p>{item}</p>
              </div>
            {/each}
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p class="mb-3 text-xs uppercase tracking-[0.18em] text-slate-500">What you get</p>
          <div class="space-y-3 text-sm text-slate-700">
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p class="font-medium text-slate-900">Daily view</p>
              <p class="mt-1 text-xs text-slate-600">
                Rate, done count, and active habits in one compact block.
              </p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p class="font-medium text-slate-900">Habit rows</p>
              <p class="mt-1 text-xs text-slate-600">
                Completion checkbox, tags, streak and weekly bars on every row.
              </p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p class="font-medium text-slate-900">Stats and edit flow</p>
              <p class="mt-1 text-xs text-slate-600">
                Browse dashboard, edit habits, and check detailed statistics.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    {#if redirecting}
      <div class="mx-auto mt-6 max-w-6xl px-4 sm:px-6">
        <p class="rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
          Restoring your session and redirecting to the dashboard...
        </p>
      </div>
    {/if}

    <PublicPreviewCarousel />

    <section class="border-b border-slate-200 bg-white px-4 py-12 sm:px-6">
      <div class="mx-auto grid w-full max-w-6xl gap-6 md:grid-cols-2">
        <article class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
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

        <article class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
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

    <section class="bg-[#f8fafc] px-4 py-12 sm:px-6">
      <div class="mx-auto w-full max-w-6xl">
        <h2 class="text-2xl font-semibold text-slate-900">Habit Tracker FAQ</h2>
        <div class="mt-5 space-y-3">
          {#each PUBLIC_LANDING_SEO.faq as item, k (item.question + '-' + k)}
            <details class="rounded-xl border border-slate-200 bg-white p-4">
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

  <footer class="border-t border-slate-200 bg-[#f8fafc] px-4 py-10 sm:px-6">
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
              class="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 transition-colors hover:border-cyan-300 hover:text-cyan-700"
            >
              Sign in
            </button>
            <button
              type="button"
              onclick={showAuthHelp}
              class="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900"
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
    <div class="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs text-emerald-700 shadow-lg">
      {noticeMessage}
    </div>
  {/if}
</div>