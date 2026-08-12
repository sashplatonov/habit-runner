<script lang="ts">
  import PublicSeoHead from '$lib/components/PublicSeoHead.svelte';
  import PublicNav from '$lib/components/PublicNav.svelte';
  import PublicFooter from '$lib/components/PublicFooter.svelte';
  import { resolve } from '$app/paths';
  import { PUBLIC_ABOUT_SEO } from '$lib/seo/publicPages';

</script>

<PublicSeoHead
  title={PUBLIC_ABOUT_SEO.title}
  description={PUBLIC_ABOUT_SEO.description}
  keywords={PUBLIC_ABOUT_SEO.keywords}
  pathname={PUBLIC_ABOUT_SEO.pathname}
 />

<svelte:head>
  <script type="application/ld+json">{JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Habit Runner',
    url: 'https://habit-runner.freeddns.org',
    logo: 'https://habit-runner.freeddns.org/og-image.svg',
    description:
      'Habit Runner is a habit tracker built for daily consistency and useful progress signals.',
    sameAs: []
  }).replace(/</g, '\u003c')}</script>
</svelte:head>

<div class="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fb_52%,#f7fbff_100%)] text-slate-900">
  <PublicNav maxWidth="max-w-5xl" />

  <main class="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
    <section class="max-w-4xl overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/92 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.1)] sm:p-8">
      <p class="text-[10px] uppercase tracking-[0.28em] text-slate-400">About the product</p>
      <h1 class="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight text-slate-950 sm:text-5xl">
        About Habit Runner
      </h1>
      <p class="mt-4 max-w-2xl text-base leading-7 text-slate-600">
        Habit Runner is a habit tracker for people who want clear progress without noise.
      </p>
    </section>

    <div class="mt-10 max-w-4xl">

      <section class="mt-10">
        <h2 class="text-xl font-semibold text-slate-900">Mission</h2>
        <p class="mt-3 text-sm text-slate-600">
          Building habits requires consistency over motivation. Habit Runner is designed to make
          daily execution visible, streak progress measurable, and the entire product accessible
          whenever your connection is available.
        </p>
        <p class="mt-3 text-sm text-slate-600">
          We believe a habit tracker should get out of your way: no gamification noise, no dark
          patterns, no paywalls blocking core features.
        </p>
      </section>

      <section class="mt-10">
        <h2 class="text-xl font-semibold text-slate-900">What guides the product</h2>
        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          <div class="rounded-[1.5rem] border border-slate-200/80 bg-white/92 p-5 shadow-[0_14px_38px_rgba(15,23,42,0.06)]">
            <p class="text-sm font-semibold text-slate-900">A clear daily view</p>
            <p class="mt-2 text-xs text-slate-600">
              The day starts with the habits that matter now, so progress stays easy to see and act on.
            </p>
          </div>
          <div class="rounded-[1.5rem] border border-slate-200/80 bg-white/92 p-5 shadow-[0_14px_38px_rgba(15,23,42,0.06)]">
            <p class="text-sm font-semibold text-slate-900">Fits your routine</p>
            <p class="mt-2 text-xs text-slate-600">
              Keep it close on the devices you use, and add it to your home screen when that is useful.
            </p>
          </div>
          <div class="rounded-[1.5rem] border border-slate-200/80 bg-white/92 p-5 shadow-[0_14px_38px_rgba(15,23,42,0.06)]">
            <p class="text-sm font-semibold text-slate-900">Private by default</p>
            <p class="mt-2 text-xs text-slate-600">
              Your account is designed for personal routines, with privacy commitments explained in our policy.
            </p>
          </div>
          <div class="rounded-[1.5rem] border border-slate-200/80 bg-white/92 p-5 shadow-[0_14px_38px_rgba(15,23,42,0.06)]">
            <p class="text-sm font-semibold text-slate-900">Made for real schedules</p>
            <p class="mt-2 text-xs text-slate-600">
              Flexible targets and reminders help the routine adapt when the week does not go to plan.
            </p>
          </div>
        </div>
      </section>

      <section class="mt-10">
        <h2 class="text-xl font-semibold text-slate-900">Privacy Commitment</h2>
        <p class="mt-3 text-sm text-slate-600">
          Your habit data is your data. We do not sell data, do not use it for advertising, and do
          not share it with third parties. Habit data is stored for your signed-in account and
          is not used for advertising.
        </p>
        <p class="mt-3 text-sm text-slate-600">
          See our full <a href={resolve<'/privacy-policy'>('/privacy-policy', {})} class="text-cyan-700 underline">Privacy Policy</a> for details.
        </p>
      </section>

      <section class="mt-10">
        <h2 class="text-xl font-semibold text-slate-900">Contact</h2>
        <p class="mt-3 text-sm text-slate-600">
          For questions, feedback, or support, reach us through our
          <a href="https://github.com/sashplatonov" class="text-cyan-700 underline">GitHub profile</a>.
        </p>
      </section>
    </div>
  </main>

  <PublicFooter maxWidth="max-w-5xl" />
</div>
