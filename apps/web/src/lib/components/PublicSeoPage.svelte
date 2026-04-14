<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import { ArrowRight, CheckCircle2 } from 'lucide-svelte';
  import { startOAuthLogin } from '$lib/auth/oauth';
  import { readAuthSession } from '$lib/auth/session';
  import PublicSeoHead from '$lib/components/PublicSeoHead.svelte';
  import { PUBLIC_SEO_PAGES, type PublicSeoIntent } from '$lib/seo/publicPages';

  type Props = {
    intent: PublicSeoIntent;
  };

  let { intent }: Props = $props();

  const content = $derived(PUBLIC_SEO_PAGES[intent]);

  onMount(() => {
    if (readAuthSession()) {
      void goto(resolve<'/(protected)/dashboard'>('/(protected)/dashboard', {}), { replaceState: true });
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

<div class="min-h-screen bg-white text-slate-900">
  <header class="border-b border-slate-200 bg-white">
    <div class="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
      <a href={resolve<'/'>('/', {})} class="flex items-center gap-2.5 text-sm font-semibold text-slate-900">
        <img src="/app-icon.svg" alt="Habbit Runner" class="h-8 w-8 flex-shrink-0 rounded-lg object-contain" />
        Habbit Runner
      </a>
      <button
        type="button"
        onclick={() => {
          startOAuthLogin();
        }}
        class="rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 transition-colors hover:bg-cyan-100"
      >
        Continue with Google
      </button>
    </div>
  </header>

  <main class="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
    <div class="max-w-3xl">
      <h1 class="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">{content.h1}</h1>
      <p class="mt-4 text-base text-slate-600">{content.description}</p>

      <div class="mt-6 flex flex-wrap gap-2">
        <a href={resolve<'/'>('/', {})} class="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700">Home</a>
        <a href={resolve<'/habit-tracker'>('/habit-tracker', {})} class="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700">Habit Tracker</a>
        <a href={resolve<'/streak-tracker'>('/streak-tracker', {})} class="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700">Streak Tracker</a>
        <a href={resolve<'/daily-routine-planner'>('/daily-routine-planner', {})} class="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700">Daily Routine Planner</a>
      </div>

      <div class="mt-8 grid gap-3">
        {#each content.bullets as item (item)}
          <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <CheckCircle2 size={14} class="mb-2 text-emerald-600" />
            {item}
          </div>
        {/each}
      </div>

      <section class="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h2 class="text-xl font-semibold text-slate-900">About The Product Team</h2>
        <p class="mt-3 text-sm text-slate-600">
          Habbit Runner is built by engineers focused on reliability, clear metrics, and practical
          habit workflows. Product updates prioritize stability, measurable progress, and simple
          daily execution.
        </p>
      </section>

      <section class="mt-10">
        <h2 class="text-xl font-semibold text-slate-900">FAQ</h2>
        <div class="mt-4 space-y-3">
          {#each content.faq as item (item.question)}
            <details class="rounded-xl border border-slate-200 bg-white p-4">
              <summary class="cursor-pointer text-sm font-semibold text-slate-900">
                {item.question}
              </summary>
              <p class="mt-2 text-sm text-slate-600">{item.answer}</p>
            </details>
          {/each}
        </div>
      </section>

      <div class="mt-10">
        <button
          type="button"
          onclick={() => {
            startOAuthLogin();
          }}
          class="inline-flex items-center gap-2 rounded-lg border border-cyan-300 bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-700 transition-all hover:bg-cyan-100"
        >
          Start Using Habbit Runner
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  </main>
</div>