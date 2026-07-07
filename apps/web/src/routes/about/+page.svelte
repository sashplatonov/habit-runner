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
    name: 'Habbit Runner',
    url: 'https://habbit-runner.app',
    logo: 'https://habbit-runner.app/og-image.svg',
    description:
      'Habbit Runner is an offline-first habit tracker PWA built for daily consistency and streak analytics.',
    sameAs: []
  }).replace(/</g, '\u003c')}</script>
</svelte:head>

<div class="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fb_52%,#f7fbff_100%)] text-slate-900">
  <PublicNav maxWidth="max-w-5xl" />

  <main class="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
    <section class="max-w-4xl overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/92 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.1)] sm:p-8">
      <p class="text-[10px] uppercase tracking-[0.28em] text-slate-400">About the product</p>
      <h1 class="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight text-slate-950 sm:text-5xl">
        About Habbit Runner
      </h1>
      <p class="mt-4 max-w-2xl text-base leading-7 text-slate-600">
        Habbit Runner is an offline-first habit tracker Progressive Web App built for people who
        want clear progress data without noise.
      </p>
    </section>

    <div class="mt-10 max-w-4xl">

      <section class="mt-10">
        <h2 class="text-xl font-semibold text-slate-900">Mission</h2>
        <p class="mt-3 text-sm text-slate-600">
          Building habits requires consistency over motivation. Habbit Runner is designed to make
          daily execution visible, streak progress measurable, and the entire product accessible
          whether you have internet or not.
        </p>
        <p class="mt-3 text-sm text-slate-600">
          We believe a habit tracker should get out of your way: no gamification noise, no dark
          patterns, no paywalls blocking core features.
        </p>
      </section>

      <section class="mt-10">
        <h2 class="text-xl font-semibold text-slate-900">Technology</h2>
        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          <div class="rounded-[1.5rem] border border-slate-200/80 bg-white/92 p-5 shadow-[0_14px_38px_rgba(15,23,42,0.06)]">
            <p class="text-sm font-semibold text-slate-900">Offline-First Architecture</p>
            <p class="mt-2 text-xs text-slate-600">
              Habits and check-ins are cached locally in IndexedDB (via Dexie) so the interface
              stays fast and responsive during daily use.
            </p>
          </div>
          <div class="rounded-[1.5rem] border border-slate-200/80 bg-white/92 p-5 shadow-[0_14px_38px_rgba(15,23,42,0.06)]">
            <p class="text-sm font-semibold text-slate-900">Progressive Web App</p>
            <p class="mt-2 text-xs text-slate-600">
              Install directly from your browser. No App Store required. Works on Android, iOS
              (Safari 16.4+), and desktop Chrome/Edge.
            </p>
          </div>
          <div class="rounded-[1.5rem] border border-slate-200/80 bg-white/92 p-5 shadow-[0_14px_38px_rgba(15,23,42,0.06)]">
            <p class="text-sm font-semibold text-slate-900">Secure REST Backend</p>
            <p class="mt-2 text-xs text-slate-600">
              Signed-in sessions use JWT-protected HTTPS requests to save and load habits and
              check-ins directly from the backend API.
            </p>
          </div>
          <div class="rounded-[1.5rem] border border-slate-200/80 bg-white/92 p-5 shadow-[0_14px_38px_rgba(15,23,42,0.06)]">
            <p class="text-sm font-semibold text-slate-900">Built With</p>
            <p class="mt-2 text-xs text-slate-600">
              SvelteKit 5, TypeScript, Tailwind CSS, Dexie, Quarkus (Java), PostgreSQL, Flyway.
            </p>
          </div>
        </div>
      </section>

      <section class="mt-10">
        <h2 class="text-xl font-semibold text-slate-900">Privacy Commitment</h2>
        <p class="mt-3 text-sm text-slate-600">
          Your habit data is your data. We do not sell data, do not use it for advertising, and do
          not share it with third parties. Data is stored locally on your device first and only
          synced to our servers when you choose to sign in.
        </p>
        <p class="mt-3 text-sm text-slate-600">
          See our full <a href={resolve<'/privacy-policy'>('/privacy-policy', {})} class="text-cyan-700 underline">Privacy Policy</a> for details.
        </p>
      </section>

      <section class="mt-10">
        <h2 class="text-xl font-semibold text-slate-900">Contact</h2>
        <p class="mt-3 text-sm text-slate-600">
          For questions, feedback, or support, reach us at
          <a href="mailto:hello@habbit-runner.app" class="text-cyan-700 underline">hello@habbit-runner.app</a>.
        </p>
      </section>
    </div>
  </main>

  <PublicFooter maxWidth="max-w-5xl" />
</div>
