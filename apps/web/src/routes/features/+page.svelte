<script lang="ts">
  import { resolve } from '$app/paths';
  import PublicSeoHead from '$lib/components/PublicSeoHead.svelte';
  import PublicNav from '$lib/components/PublicNav.svelte';
  import PublicFooter from '$lib/components/PublicFooter.svelte';
  import { PUBLIC_FEATURES_SEO } from '$lib/seo/publicPages';
</script>

<PublicSeoHead
  title={PUBLIC_FEATURES_SEO.title}
  description={PUBLIC_FEATURES_SEO.description}
  keywords={PUBLIC_FEATURES_SEO.keywords}
  pathname={PUBLIC_FEATURES_SEO.pathname}
/>

<svelte:head>
  <script type="application/ld+json">{JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Habbit Runner',
    applicationCategory: 'ProductivityApplication',
    operatingSystem: 'Web, Android, iOS',
    url: 'https://habbit-runner.app',
    description: PUBLIC_FEATURES_SEO.description,
    featureList: [
      'Backend-backed habit tracking with a responsive PWA shell',
      'Direct habit and check-in saves over a secure REST API',
      'Streak tracking: current streak and longest streak',
      'Push notifications for habit reminders',
      'Google OAuth sign-in',
      'Daily routine planning with targets',
      'Weekly and monthly completion analytics',
      'Progressive Web App — installable without App Store',
      'Dashboard with live completion rate',
      'Undo last action support'
    ],
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    }
  }).replace(/</g, '\u003c')}</script>
  <script type="application/ld+json">{JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://habbit-runner.app' },
      { '@type': 'ListItem', position: 2, name: 'Features', item: 'https://habbit-runner.app/features' }
    ]
  }).replace(/</g, '\\u003c')}</script>
</svelte:head>

<div class="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fb_52%,#f7fbff_100%)] text-slate-900">
  <PublicNav maxWidth="max-w-5xl" />

  <main class="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
    <nav class="mb-6 flex items-center gap-2 text-xs text-slate-500">
      <a href={resolve<'/'>('/', {})} class="hover:text-slate-900">Home</a>
      <span>/</span>
      <span class="text-slate-900">Features</span>
    </nav>

    <section class="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/92 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.1)] sm:p-8">
      <p class="text-[10px] uppercase tracking-[0.28em] text-slate-400">Product capabilities</p>
      <h1 class="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight text-slate-950 sm:text-5xl">
        Habbit Runner Features
      </h1>
      <p class="mt-4 max-w-2xl text-base leading-7 text-slate-600">
        Everything you need to build consistent daily habits — fast, focused, and without app store
        friction.
      </p>
    </section>

    <div class="mt-10 space-y-12">
      <!-- Backend-backed tracking -->
      <section class="rounded-[1.75rem] border border-slate-200/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <h2 class="text-xl font-semibold text-slate-900">Reliable Server Storage</h2>
        <p class="mt-3 text-sm text-slate-600">
          Habit data and check-ins are stored by the authenticated backend and loaded through the
          API. The installed PWA keeps its application shell available between sessions, while
          habit changes require a connection.
        </p>
        <ul class="mt-4 space-y-2 text-sm text-slate-600">
          <li class="flex gap-2"><span class="mt-0.5 text-emerald-600">✓</span> Authenticated API writes</li>
          <li class="flex gap-2"><span class="mt-0.5 text-emerald-600">✓</span> Latest server state on refresh</li>
          <li class="flex gap-2"><span class="mt-0.5 text-emerald-600">✓</span> Clear degraded state when disconnected</li>
        </ul>
        <div class="mt-4">
          <a href={resolve<'/habit-tracker'>('/habit-tracker', {})} class="text-xs text-cyan-700 underline">See habit tracker details →</a>
        </div>
      </section>

      <!-- Background Sync -->
      <section class="rounded-[1.75rem] border border-slate-200/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <h2 class="text-xl font-semibold text-slate-900">Secure Account Sync</h2>
        <p class="mt-3 text-sm text-slate-600">
          When you sign in, habit and check-in changes are saved directly through the backend REST
          API and then refreshed across your devices. The server is the canonical source for every
          signed-in session.
        </p>
        <ul class="mt-4 space-y-2 text-sm text-slate-600">
          <li class="flex gap-2"><span class="mt-0.5 text-emerald-600">✓</span> Direct saves to secure backend endpoints</li>
          <li class="flex gap-2"><span class="mt-0.5 text-emerald-600">✓</span> Application shell cached by the PWA</li>
          <li class="flex gap-2"><span class="mt-0.5 text-emerald-600">✓</span> Pull-to-refresh to reload the latest server state</li>
        </ul>
      </section>

      <!-- Streak Tracking -->
      <section class="rounded-[1.75rem] border border-slate-200/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <h2 class="text-xl font-semibold text-slate-900">Streak Tracking</h2>
        <p class="mt-3 text-sm text-slate-600">
          Every habit shows your current streak and longest streak. Identify where you break
          patterns and recover with data-backed insight.
        </p>
        <ul class="mt-4 space-y-2 text-sm text-slate-600">
          <li class="flex gap-2"><span class="mt-0.5 text-emerald-600">✓</span> Current streak per habit</li>
          <li class="flex gap-2"><span class="mt-0.5 text-emerald-600">✓</span> Longest streak history</li>
          <li class="flex gap-2"><span class="mt-0.5 text-emerald-600">✓</span> Weekly and monthly completion rate trends</li>
        </ul>
        <div class="mt-4">
          <a href={resolve<'/streak-tracker'>('/streak-tracker', {})} class="text-xs text-cyan-700 underline">See streak tracker details →</a>
        </div>
      </section>

      <!-- Push Notifications -->
      <section class="rounded-[1.75rem] border border-slate-200/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <h2 class="text-xl font-semibold text-slate-900">Push Notifications</h2>
        <p class="mt-3 text-sm text-slate-600">
          Enable reminders per habit through your browser's web push API. No native app required.
          Notifications work on Android Chrome, desktop Chrome/Edge, and Safari 16.4+ on iOS.
        </p>
        <ul class="mt-4 space-y-2 text-sm text-slate-600">
          <li class="flex gap-2"><span class="mt-0.5 text-emerald-600">✓</span> Per-habit reminder scheduling</li>
          <li class="flex gap-2"><span class="mt-0.5 text-emerald-600">✓</span> Works without native app installation</li>
          <li class="flex gap-2"><span class="mt-0.5 text-emerald-600">✓</span> Revocable at any time from browser settings</li>
        </ul>
      </section>

      <!-- Daily Routine -->
      <section class="rounded-[1.75rem] border border-slate-200/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <h2 class="text-xl font-semibold text-slate-900">Daily Routine Planning</h2>
        <p class="mt-3 text-sm text-slate-600">
          Define structured routines with daily or custom frequencies. Set targets, assign tags, and
          track execution through a clean dashboard.
        </p>
        <ul class="mt-4 space-y-2 text-sm text-slate-600">
          <li class="flex gap-2"><span class="mt-0.5 text-emerald-600">✓</span> Custom frequency (daily, weekly, etc.)</li>
          <li class="flex gap-2"><span class="mt-0.5 text-emerald-600">✓</span> Daily target with completion ring</li>
          <li class="flex gap-2"><span class="mt-0.5 text-emerald-600">✓</span> Tags and categorization</li>
        </ul>
        <div class="mt-4">
          <a href={resolve<'/daily-routine-planner'>('/daily-routine-planner', {})} class="text-xs text-cyan-700 underline">See daily routine planner details →</a>
        </div>
      </section>

      <!-- PWA -->
      <section class="rounded-[1.75rem] border border-slate-200/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <h2 class="text-xl font-semibold text-slate-900">Progressive Web App</h2>
        <p class="mt-3 text-sm text-slate-600">
          Install Habbit Runner directly from your browser. No App Store, no Play Store download
          required. Works as a standalone app on your home screen.
        </p>
        <ul class="mt-4 space-y-2 text-sm text-slate-600">
          <li class="flex gap-2"><span class="mt-0.5 text-emerald-600">✓</span> Installable on Android, iOS, and desktop</li>
          <li class="flex gap-2"><span class="mt-0.5 text-emerald-600">✓</span> Standalone display mode</li>
          <li class="flex gap-2"><span class="mt-0.5 text-emerald-600">✓</span> Automatic updates via service worker</li>
        </ul>
      </section>

      <!-- Privacy -->
      <section class="rounded-[1.75rem] border border-slate-200/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <h2 class="text-xl font-semibold text-slate-900">Privacy-First Design</h2>
        <p class="mt-3 text-sm text-slate-600">
          Your data lives on your device first. No advertising. No data selling. Sync requires
          sign-in and is opt-in via Google OAuth.
        </p>
      </section>
    </div>

    <div class="mt-12 rounded-[1.75rem] border border-sky-100 bg-[linear-gradient(135deg,rgba(49,105,255,0.08),rgba(16,179,154,0.08))] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <h2 class="text-lg font-semibold text-slate-900">Compare Habbit Runner</h2>
      <p class="mt-2 text-sm text-slate-600">See how Habbit Runner compares to other habit trackers.</p>
      <div class="mt-4 flex flex-wrap gap-3">
        <a href={resolve<'/vs/habitica'>('/vs/habitica', {})} class="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-400">vs Habitica</a>
        <a href={resolve<'/vs/streaks-app'>('/vs/streaks-app', {})} class="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-400">vs Streaks App</a>
        <a href={resolve<'/vs/beeminder'>('/vs/beeminder', {})} class="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-400">vs Beeminder</a>
      </div>
    </div>
  </main>

  <PublicFooter maxWidth="max-w-5xl" />
</div>
