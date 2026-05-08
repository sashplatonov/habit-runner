<script lang="ts">
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';
  import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-svelte';
  import { startOAuthLogin } from '$lib/auth/oauth';
  import PublicNav from '$lib/components/PublicNav.svelte';
  import PublicFooter from '$lib/components/PublicFooter.svelte';
  import PublicSection from '$lib/components/public/PublicSection.svelte';
  import PublicCta from '$lib/components/public/PublicCta.svelte';
  import PublicFeatureCard from '$lib/components/public/PublicFeatureCard.svelte';
  import PublicFaq from '$lib/components/public/PublicFaq.svelte';
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

  function handleCtaClick() {
    goto(resolve('/', {}));
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
  <PublicNav />

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
            You can see how the product looks before sign-in. Habit Runner focuses on daily
            completion, streak integrity, and fast overview of what is done right now.
          </p>
          <div class="mt-7 flex flex-wrap items-center gap-3">
            <PublicCta
              onclick={() => { startOAuthLogin(); }}
              variant="primary"
              size="lg"
            >
              Continue with Google
              <ArrowRight size={15} />
            </PublicCta>
            <PublicCta onclick={scrollToPreview} variant="secondary">
              See product preview
            </PublicCta>
            <a
              href={resolve('/habit-tracker', {})}
              class="rounded-full border border-slate-300 bg-white/90 px-4 py-2.5 text-sm text-slate-700 shadow-[0_12px_24px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-0.5 hover:border-slate-400 hover:text-slate-900"
            >
              Explore habit tracker page
            </a>
          </div>
          <div class="mt-8 grid gap-3 sm:grid-cols-3">
            {#each featureHighlights as item, i (item + '-' + i)}
              <PublicFeatureCard title={item} icon={CheckCircle2} class="border-white/80 bg-white/86" />
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
            <PublicFeatureCard title="Now" description="Rate, done count, and active habits in one compact block." icon={CheckCircle2} class="border-slate-200 bg-slate-50/90" />
            <PublicFeatureCard title="Signal" description="Completion, context tags, streak state, and momentum in one pass." icon={CheckCircle2} class="border-slate-200 bg-slate-50/90" />
            <PublicFeatureCard title="Depth" description="Browse dashboard, edit habits, and review detailed trends without context switching." icon={CheckCircle2} class="border-slate-200 bg-slate-50/90" />
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

    <PublicSection title="What Makes Habit Runner Different" subtitle="Habit Runner is a habit tracking app focused on execution. You set daily targets, check progress in a clear dashboard, and monitor streaks without clutter.">
      <ul class="mt-4 space-y-2 text-sm text-slate-700">
        <li>Simple habit tracker for consistent daily routines.</li>
        <li>Streak tracker with current streak and longest streak history.</li>
        <li>Goal tracking with completion rates and trend visibility.</li>
      </ul>
      <div class="mt-4 flex flex-wrap gap-2">
        <a href={resolve('/habit-tracker', {})} class="text-xs text-cyan-700 underline">Streak tracker details</a>
        <a href={resolve('/daily-routine-planner', {})} class="text-xs text-cyan-700 underline">Daily routine planner details</a>
      </div>
    </PublicSection>

    <PublicSection title="Best For" subtitle="This productivity app is built for people who want clear data instead of motivational noise: founders, creators, athletes, students, and teams building daily discipline.">
      <ul class="mt-4 space-y-2 text-sm text-slate-700">
        <li>Personal habit planning and consistency tracking.</li>
        <li>Routine management for work, health, learning, and focus.</li>
        <li>Weekly and monthly performance review from one place.</li>
      </ul>
    </PublicSection>

    <section class="bg-[linear-gradient(180deg,rgba(255,255,255,0.5),rgba(239,246,255,0.78))] px-4 py-12 sm:px-6">
      <div class="mx-auto w-full max-w-6xl">
        <h2 class="text-2xl font-semibold text-slate-900">Habit Tracker FAQ</h2>
        <div class="mt-5 space-y-3">
          <PublicFaq items={PUBLIC_LANDING_SEO.faq} />
        </div>
      </div>
    </section>
  </main>

  <PublicFooter />
  
  {#if noticeMessage}
    <div class="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full border border-emerald-300 bg-emerald-50/95 px-4 py-2 text-xs text-emerald-700 shadow-[0_18px_40px_rgba(16,185,129,0.18)] backdrop-blur-sm">
      {noticeMessage}
    </div>
  {/if}
</div>
