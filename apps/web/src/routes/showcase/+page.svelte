<script lang="ts">
  import { resolve } from '$app/paths';
  import PublicFooter from '$lib/components/PublicFooter.svelte';
  import PublicNav from '$lib/components/PublicNav.svelte';
  import PublicSeoHead from '$lib/components/PublicSeoHead.svelte';
  import { portfolioFixture } from '$lib/showcase/portfolioFixture';
  import { PUBLIC_SHOWCASE_SEO } from '$lib/seo/publicPages';

  const fixture = portfolioFixture;
</script>

<PublicSeoHead
  title={PUBLIC_SHOWCASE_SEO.title}
  description={PUBLIC_SHOWCASE_SEO.description}
  keywords={PUBLIC_SHOWCASE_SEO.keywords}
  pathname={PUBLIC_SHOWCASE_SEO.pathname}
/>

<div data-theme="cloud" class="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fb_54%,#f7fbff_100%)] text-slate-900">
  <PublicNav maxWidth="max-w-6xl" />

  <main class="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
    <header class="grid gap-8 lg:grid-cols-[1.05fr,0.95fr] lg:items-end">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-700">Portfolio preview</p>
        <h1 class="mt-4 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight text-slate-950 sm:text-6xl">
          See the habit loop before you sign in.
        </h1>
        <p class="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
          A fictional, read-only snapshot of the dashboard: habits, schedule rhythm, durable progress,
          and the conflict state that protects shared data.
        </p>
      </div>
      <aside role="status" class="rounded-[1.75rem] border border-cyan-200/80 bg-white/85 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]" aria-label="Showcase status">
        <div class="flex items-start gap-3">
          <span class="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-100 text-xl" aria-hidden="true">◎</span>
          <div>
            <p class="text-sm font-semibold text-slate-950">Read-only showcase</p>
            <p class="mt-1 text-sm leading-6 text-slate-600">No account, API calls, writes, or browser persistence are used on this page.</p>
          </div>
        </div>
      </aside>
    </header>

    <section class="mt-10 grid gap-4 sm:grid-cols-3" aria-label="Fictional progress summary">
      <div class="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
        <p class="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Today</p>
        <p class="mt-3 text-3xl font-semibold text-slate-950">{fixture.summary.completed}<span class="text-base text-slate-400">/{fixture.summary.total}</span></p>
        <p class="mt-1 text-sm text-slate-500">habits completed</p>
      </div>
      <div class="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
        <p class="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Momentum</p>
        <p class="mt-3 text-3xl font-semibold text-slate-950">{fixture.summary.streak}<span class="ml-1 text-base text-slate-400">days</span></p>
        <p class="mt-1 text-sm text-slate-500">current best rhythm</p>
      </div>
      <div class="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
        <p class="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Consistency</p>
        <p class="mt-3 text-3xl font-semibold text-slate-950">{fixture.summary.completionRate}%</p>
        <p class="mt-1 text-sm text-slate-500">last 30 days</p>
      </div>
    </section>

    <section class="mt-10 grid gap-6 lg:grid-cols-[1.15fr,0.85fr]" aria-labelledby="dashboard-preview-heading">
      <div class="rounded-[2rem] border border-slate-200 bg-white/92 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-7">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Dashboard snapshot</p>
            <h2 id="dashboard-preview-heading" class="mt-2 text-2xl font-semibold tracking-tight text-slate-950">A calm next-action list</h2>
          </div>
          <span class="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">Friday · 16</span>
        </div>
        <div class="mt-6 space-y-3">
          {#each fixture.habits as habit, index (`habit-${index}`)}
            <article class="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div class="flex items-start gap-3">
                <span class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm" aria-hidden="true">{habit.icon}</span>
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <h3 class="font-semibold text-slate-950">{habit.name}</h3>
                    <span class="text-xs font-semibold {habit.status === 'Complete' ? 'text-emerald-700' : 'text-slate-500'}">{habit.status}</span>
                  </div>
                  <p class="mt-1 text-xs text-slate-500">{habit.category} · {habit.schedule} · {habit.streak} day streak</p>
                  <div class="mt-3 h-2 overflow-hidden rounded-full bg-slate-200" aria-label={`${habit.progress}% complete`} role="img">
                    <div class="h-full rounded-full" style={`width: ${habit.progress}%; background: ${habit.accent};`}></div>
                  </div>
                </div>
              </div>
            </article>
          {/each}
        </div>
        <p class="mt-5 text-xs leading-5 text-slate-500">Controls are intentionally inactive in this preview. Sign in to create and complete your own habits.</p>
      </div>

      <div class="space-y-6">
        <section class="rounded-[2rem] border border-slate-200 bg-white/92 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-7" aria-labelledby="rhythm-heading">
          <p class="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Schedule rhythm</p>
          <h2 id="rhythm-heading" class="mt-2 text-2xl font-semibold tracking-tight text-slate-950">One week at a glance</h2>
          <div class="mt-6 grid grid-cols-7 gap-1.5 sm:gap-2" aria-label="Fictional weekly completion rhythm">
            {#each fixture.week as day, index (`day-${index}`)}
              <div class="flex min-w-0 flex-col items-center gap-2 rounded-xl px-1 py-3 {day.current ? 'bg-cyan-50 ring-1 ring-cyan-200' : ''}">
                <span class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{day.label}</span>
                <span class="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold {day.completed ? 'bg-emerald-500 text-white' : 'border border-slate-200 text-slate-400'}" aria-label={day.completed ? `${day.label} completed` : `${day.label} not completed`}>
                  {day.completed ? '✓' : day.date}
                </span>
              </div>
            {/each}
          </div>
        </section>

        <section class="rounded-[2rem] border border-amber-200 bg-amber-50/75 p-5 shadow-[0_20px_60px_rgba(120,53,15,0.06)] sm:p-7" aria-labelledby="conflict-heading">
          <p class="text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-700">Reliable collaboration</p>
          <h2 id="conflict-heading" class="mt-2 text-xl font-semibold tracking-tight text-slate-950">{fixture.conflict.title}</h2>
          <p class="mt-3 text-sm font-medium leading-6 text-amber-950">{fixture.conflict.message}</p>
          <p class="mt-2 text-sm leading-6 text-amber-900/75">{fixture.conflict.detail}</p>
        </section>
      </div>
    </section>

    <section class="mt-10 flex flex-col items-start justify-between gap-5 rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] sm:flex-row sm:items-center sm:p-8">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300">Ready for the real flow?</p>
        <h2 class="mt-2 text-2xl font-semibold tracking-tight">Bring your own habits into the server-backed app.</h2>
        <p class="mt-2 max-w-xl text-sm leading-6 text-slate-300">The preview stays fictional. Authentication is required before any account data or mutation is available.</p>
      </div>
      <a href={resolve<'/'>('/', {})} class="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 py-3 text-xs font-semibold text-slate-950 transition hover:bg-cyan-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300">Sign in to use the app</a>
    </section>
  </main>

  <PublicFooter maxWidth="max-w-6xl" />
</div>
