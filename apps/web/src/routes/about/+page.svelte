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

<div class="min-h-screen bg-white text-slate-900">
  <PublicNav maxWidth="max-w-5xl" />

  <main class="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
    <div class="max-w-3xl">
      <h1 class="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
        About Habbit Runner
      </h1>
      <p class="mt-4 text-base text-slate-600">
        Habbit Runner is an offline-first habit tracker Progressive Web App built for people who
        want clear progress data without noise.
      </p>

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
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-sm font-semibold text-slate-900">Offline-First Architecture</p>
            <p class="mt-2 text-xs text-slate-600">
              All data lives in IndexedDB (via Dexie) on your device. The app works fully offline
              and syncs changes when you reconnect.
            </p>
          </div>
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-sm font-semibold text-slate-900">Progressive Web App</p>
            <p class="mt-2 text-xs text-slate-600">
              Install directly from your browser. No App Store required. Works on Android, iOS
              (Safari 16.4+), and desktop Chrome/Edge.
            </p>
          </div>
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-sm font-semibold text-slate-900">Secure Sync</p>
            <p class="mt-2 text-xs text-slate-600">
              Pull-push-pull sync cycle with conflict resolution based on timestamps. JWT tokens
              over HTTPS.
            </p>
          </div>
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
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
