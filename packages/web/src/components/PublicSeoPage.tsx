import React, { useEffect } from 'react';
import { ArrowRightIcon, CheckCircle2Icon } from 'lucide-react';
import { startOAuthLogin } from '@/lib/auth/oauth';
import { applyPublicSeo } from '@/lib/seo/publicSeo';

type PublicSeoPageProps = {
  intent: 'habit-tracker' | 'streak-tracker' | 'daily-routine-planner';
};

type SeoContent = {
  title: string;
  h1: string;
  description: string;
  keywords: string;
  faq: Array<{ question: string; answer: string }>;
  bullets: string[];
};

const CONTENT: Record<PublicSeoPageProps['intent'], SeoContent> = {
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

function getPath(intent: PublicSeoPageProps['intent']) {
  return `/${intent}`;
}

export function PublicSeoPage({ intent }: PublicSeoPageProps) {
  const content = CONTENT[intent];

  useEffect(() => {
    return applyPublicSeo({
      title: content.title,
      description: content.description,
      keywords: content.keywords,
      pathname: getPath(intent),
      faq: content.faq
    });
  }, [content, intent]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <a href="/" className="text-sm font-semibold text-slate-900">Habbit Runner</a>
          <button
            type="button"
            onClick={startOAuthLogin}
            className="rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 transition-colors hover:bg-cyan-100"
          >
            Continue with Google
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">{content.h1}</h1>
          <p className="mt-4 text-base text-slate-600">{content.description}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            <a href="/" className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700">
              Home
            </a>
            <a href="/habit-tracker" className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700">
              Habit Tracker
            </a>
            <a href="/streak-tracker" className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700">
              Streak Tracker
            </a>
            <a
              href="/daily-routine-planner"
              className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700"
            >
              Daily Routine Planner
            </a>
          </div>

          <div className="mt-8 grid gap-3">
            {content.bullets.map((item) => (
              <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <CheckCircle2Icon size={14} className="mb-2 text-emerald-600" />
                {item}
              </div>
            ))}
          </div>

          <section className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-xl font-semibold text-slate-900">About The Product Team</h2>
            <p className="mt-3 text-sm text-slate-600">
              Habbit Runner is built by engineers focused on reliability, clear metrics, and practical
              habit workflows. Product updates prioritize stability, measurable progress, and simple
              daily execution.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-semibold text-slate-900">FAQ</h2>
            <div className="mt-4 space-y-3">
              {content.faq.map((item) => (
                <details key={item.question} className="rounded-xl border border-slate-200 bg-white p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-900">
                    {item.question}
                  </summary>
                  <p className="mt-2 text-sm text-slate-600">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>

          <div className="mt-10">
            <button
              type="button"
              onClick={startOAuthLogin}
              className="inline-flex items-center gap-2 rounded-lg border border-cyan-300 bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-700 transition-all hover:bg-cyan-100"
            >
              Start Using Habbit Runner
              <ArrowRightIcon size={15} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
