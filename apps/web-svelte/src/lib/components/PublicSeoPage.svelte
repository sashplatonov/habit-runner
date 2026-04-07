<script lang="ts">
  import { onMount } from 'svelte';
  import { ArrowRight, CheckCircle2 } from 'lucide-svelte';
  import { startOAuthLogin } from '$lib/auth/oauth';
  import { applyPublicSeo } from '$lib/seo/publicSeo';

  type Intent = 'habit-tracker' | 'streak-tracker' | 'daily-routine-planner';

  let { intent }: { intent: Intent } = $props();

  type SeoContent = {
    title: string;
    h1: string;
    description: string;
    keywords: string;
    faq: Array<{ question: string; answer: string }>;
    bullets: string[];
  };

  const CONTENT: Record<Intent, SeoContent> = {
    'habit-tracker': {
      title: 'Habit Tracker App - Habbit Runner',
      h1: 'Habit Tracker App For Real Daily Consistency',
      description:
        'Habbit Runner is a habit tracker app with daily targets, clean progress dashboard, and performance analytics.',
      keywords:
        'habit tracker app, best habit tracker, habit builder app, habit tracking dashboard, goal tracker',
      bullets: [
        'Track habits with clear daily completion targets.',
        'Review dashboard progress and habit health in seconds.',
        'Edit habit frequency, reminders, tags, and targets quickly.'
      ],
      faq: [
        {
          question: 'How does this habit tracker app help me stay consistent?',
          answer:
            'It keeps your daily targets, completion history, and progress view in one place so execution stays visible.'
        },
        {
          question: 'Can I manage multiple habits at once?',
          answer:
            'Yes. You can track multiple routines, sort priorities, and monitor each habit performance separately.'
        }
      ]
    },
    'streak-tracker': {
      title: 'Streak Tracker App - Habbit Runner',
      h1: 'Streak Tracker App With Clear Performance Signals',
      description:
        'Use Habbit Runner as a streak tracker app to monitor current streak, longest streak, and completion rate trends.',
      keywords:
        'streak tracker app, habit streak tracker, streak counter app, productivity streak app, consistency tracker',
      bullets: [
        'See current and longest streak for each habit.',
        'Identify streak breaks quickly and recover with better planning.',
        'Compare weekly and monthly streak performance from one screen.'
      ],
      faq: [
        {
          question: 'Does the streak tracker show both current and best streak?',
          answer:
            'Yes. Every habit can display current streak and longest streak so you can track progress over time.'
        },
        {
          question: 'Can I review streak trends for multiple habits?',
          answer:
            'Yes. The stats view gives you trend context and completion rates across all active habits.'
        }
      ]
    },
    'daily-routine-planner': {
      title: 'Daily Routine Planner App - Habbit Runner',
      h1: 'Daily Routine Planner App For Work, Health, And Focus',
      description:
        'Plan your daily routine with habits, reminders, and measurable targets using Habbit Runner productivity workflows.',
      keywords:
        'daily routine planner app, routine planner, daily planner for habits, productivity routine app, schedule habits',
      bullets: [
        'Build structured routines with daily or custom frequencies.',
        'Set reminders and completion targets for repeatable routines.',
        'Use stats to improve routine quality each week.'
      ],
      faq: [
        {
          question: 'Can I use this as a daily routine planner for work and personal goals?',
          answer:
            'Yes. You can organize habits for health, learning, focus, and personal growth in one routine flow.'
        },
        {
          question: 'Does it support reminders in routine planning?',
          answer:
            'Yes. You can set reminder time and keep routine execution visible in your dashboard.'
        }
      ]
    }
  };

  const content = $derived(CONTENT[intent]);

  onMount(() => {
    return applyPublicSeo({
      title: content.title,
      description: content.description,
      keywords: content.keywords,
      pathname: `/${intent}`,
      faq: content.faq
    });
  });
</script>

<div class="min-h-screen bg-white text-slate-900">
  <header class="border-b border-slate-200 bg-white">
    <div class="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
      <a href="/" class="flex items-center gap-2.5 text-sm font-semibold text-slate-900">
        <img src="/app-icon.svg" alt="Habbit Runner" class="w-8 h-8 rounded-lg flex-shrink-0 object-contain" />
        Habbit Runner
      </a>
      <button
        type="button"
        onclick={startOAuthLogin}
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
        <a href="/" class="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700">
          Home
        </a>
        <a href="/habit-tracker" class="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700">
          Habit Tracker
        </a>
        <a href="/streak-tracker" class="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700">
          Streak Tracker
        </a>
        <a href="/daily-routine-planner" class="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700">
          Daily Routine Planner
        </a>
      </div>

      <ul class="mt-8 space-y-3">
        {#each content.bullets as bullet}
          <li class="flex items-start gap-2 text-sm text-slate-700">
            <CheckCircle2 size={16} class="mt-0.5 flex-shrink-0 text-emerald-600" />
            {bullet}
          </li>
        {/each}
      </ul>

      <div class="mt-8">
        <button
          type="button"
          onclick={startOAuthLogin}
          class="inline-flex items-center gap-2 rounded-lg border border-cyan-300 bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-700 transition-all hover:bg-cyan-100"
        >
          Get started
          <ArrowRight size={15} />
        </button>
      </div>

      {#if content.faq.length > 0}
        <div class="mt-12 space-y-3">
          <h2 class="text-lg font-semibold text-slate-900">Frequently Asked Questions</h2>
          {#each content.faq as item}
            <details class="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <summary class="cursor-pointer text-sm font-semibold text-slate-900">
                {item.question}
              </summary>
              <p class="mt-2 text-sm text-slate-600">{item.answer}</p>
            </details>
          {/each}
        </div>
      {/if}
    </div>
  </main>
</div>
