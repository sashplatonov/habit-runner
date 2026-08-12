<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import { ArrowRight, CheckCircle2 } from 'lucide-svelte';
  import { startOAuthLogin } from '$lib/auth/oauth';
  import { readAuthSession } from '$lib/auth/session';
  import PublicNav from '$lib/components/PublicNav.svelte';
  import PublicFooter from '$lib/components/PublicFooter.svelte';
  import PublicSeoHead from '$lib/components/PublicSeoHead.svelte';
  import { PUBLIC_SEO_PAGES, type PublicSeoIntent } from '$lib/seo/publicPages';

  type Props = {
    intent: PublicSeoIntent;
  };

  let { intent }: Props = $props();

  const content = $derived(PUBLIC_SEO_PAGES[intent]);

  onMount(() => {
    if (readAuthSession()) {
      void goto(resolve<'/app/(protected)/dashboard'>('/app/(protected)/dashboard', {}), { replaceState: true });
    }
  });
</script>

<PublicSeoHead
  title={content.title}
  description={content.description}
  keywords={content.keywords}
  pathname={content.pathname}
  faq={content.faq}
/>

<div class="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fb_52%,#f7fbff_100%)] text-slate-900">
  <PublicNav />

  <main class="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
    <section class="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/92 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.1)] sm:p-8">
      <p class="text-[10px] uppercase tracking-[0.28em] text-slate-400">Practical guide</p>
      <div class="mt-4 grid gap-8 lg:grid-cols-[1.15fr,0.85fr] lg:items-start">
        <div>
          <h1 class="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight text-slate-950 sm:text-5xl">{content.h1}</h1>
          <p class="mt-4 max-w-2xl text-base leading-7 text-slate-600">{content.description}</p>

          <div class="mt-6 flex flex-wrap gap-2">
            <a href={resolve<'/'>('/', {})} class="inline-flex min-h-11 items-center rounded-full border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm">Home</a>
            <a href={resolve<'/habit-tracker'>('/habit-tracker', {})} class="inline-flex min-h-11 items-center rounded-full border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm">Habit Tracker</a>
            <a href={resolve<'/streak-tracker'>('/streak-tracker', {})} class="inline-flex min-h-11 items-center rounded-full border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm">Streak Tracker</a>
            <a href={resolve<'/daily-routine-planner'>('/daily-routine-planner', {})} class="inline-flex min-h-11 items-center rounded-full border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm">Daily Routine Planner</a>
            <a href={resolve<'/features'>('/features', {})} class="inline-flex min-h-11 items-center rounded-full border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm">Features</a>
            <a href={resolve<'/blog'>('/blog', {})} class="inline-flex min-h-11 items-center rounded-full border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm">Blog</a>
          </div>
        </div>

        <div class="rounded-[1.5rem] border border-sky-100 bg-[linear-gradient(135deg,rgba(49,105,255,0.08),rgba(16,179,154,0.08))] p-5">
          <p class="text-[10px] uppercase tracking-[0.24em] text-slate-400">Why it matters</p>
          <p class="mt-3 text-xl font-semibold tracking-tight text-slate-950">A good routine should survive an ordinary week.</p>
          <p class="mt-3 text-sm leading-6 text-slate-600">Use this guide to choose a starting point, then keep only the detail that helps you continue.</p>
        </div>
      </div>

      <div class="mt-8 grid gap-3 sm:grid-cols-2">
        {#each content.bullets as item, i (item + '-' + i)}
          <div class="rounded-[1.25rem] border border-slate-200/80 bg-slate-50/90 px-4 py-4 text-sm text-slate-700 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
            <CheckCircle2 size={14} class="mb-3 text-emerald-600" />
            {item}
          </div>
        {/each}
      </div>
    </section>

    <div class="mt-8 grid gap-6 lg:grid-cols-[0.95fr,1.05fr]">
      <section class="rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_54px_rgba(15,23,42,0.08)]">
        <h2 class="text-xl font-semibold text-slate-950">A practical starting point</h2>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          Habbit Runner is for the part after the plan: showing up, checking in, and learning what
          makes the next attempt easier. Start with one routine and let the useful patterns emerge.
        </p>
      </section>

      <section class="rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_54px_rgba(15,23,42,0.08)]">
        <h2 class="text-xl font-semibold text-slate-950">FAQ</h2>
        <div class="mt-4 space-y-3">
          {#each content.faq as item, j (item.question + '-' + j)}
            <details class="rounded-[1.25rem] border border-slate-200/80 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
              <summary class="cursor-pointer text-sm font-semibold text-slate-900">
                {item.question}
              </summary>
              <p class="mt-2 text-sm leading-6 text-slate-600">{item.answer}</p>
            </details>
          {/each}
        </div>
      </section>
    </div>

    <div class="mt-8 rounded-[1.75rem] border border-slate-900 bg-slate-950 p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
      <p class="text-[10px] uppercase tracking-[0.24em] text-sky-200">Try the product</p>
      <div class="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-2xl font-semibold tracking-tight">Move from reading to doing.</h2>
          <p class="mt-2 max-w-2xl text-sm text-slate-300">Open the app, set one habit, and keep the loop tight enough to survive real life.</p>
        </div>
        <button
          type="button"
          onclick={() => {
            startOAuthLogin();
          }}
          class="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/20 bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-sky-50"
        >
          Start Using Habbit Runner
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  </main>
  <PublicFooter />
</div>
