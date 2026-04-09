import { useEffect } from 'react';
import { ArrowRightIcon, CheckCircle2Icon, SparklesIcon } from 'lucide-react';
import { startOAuthLogin } from '@/lib/auth/oauth';
import { PublicPreviewCarousel } from '@/components/PublicPreviewCarousel';
import { applyPublicSeo } from '@/lib/seo/publicSeo';

type PublicLandingProps = {
  authError?: string;
  onHelpClick: (message: string) => void;
};

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

function PublicLandingHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/90 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <img src="/app-icon.svg" alt="Habbit Runner" className="w-9 h-9 rounded-xl flex-shrink-0 object-contain" />
          <div>
            <p className="text-sm font-semibold text-slate-900">Habbit Runner</p>
            <p className="text-xs text-slate-500">Habit tracking with real progress analytics</p>
          </div>
        </div>
        <button
          type="button"
          onClick={startOAuthLogin}
          className="rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 transition-colors hover:bg-cyan-100"
        >
          Continue with Google
        </button>
      </div>
    </header>
  );
}

function PublicLandingHero() {
  return (
    <section className="border-b border-slate-200 bg-[radial-gradient(circle_at_top,rgba(186,230,253,0.65),transparent_58%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.08fr_0.92fr] md:py-16">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs text-cyan-700">
            <SparklesIcon size={14} />
            See your progress before you even sign in
          </div>
          <h1 className="max-w-xl text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
            Habit tracker app for daily routine planning and reliable streak growth.
          </h1>
          <p className="mt-4 max-w-xl text-sm text-slate-600 sm:text-base">
            You can see how the product looks before sign-in. Habbit Runner focuses on daily
            completion, streak integrity, and fast overview of what is done right now.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={startOAuthLogin}
              className="inline-flex items-center gap-2 rounded-lg border border-cyan-300 bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-700 transition-all hover:bg-cyan-100"
            >
              Start now
              <ArrowRightIcon size={15} />
            </button>
            <button
              type="button"
              onClick={scrollToPreview}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900"
            >
              See product preview
            </button>
            <a
              href="/habit-tracker"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900"
            >
              Explore habit tracker page
            </a>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {featureHighlights.map((item) => (
              <div
                key={item}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
              >
                <CheckCircle2Icon size={13} className="mb-2 text-emerald-600" />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs uppercase tracking-[0.18em] text-slate-500">What you get</p>
          <div className="space-y-3 text-sm text-slate-700">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="font-medium text-slate-900">Daily view</p>
              <p className="mt-1 text-xs text-slate-600">
                Rate, done count, and active habits in one compact block.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="font-medium text-slate-900">Habit rows</p>
              <p className="mt-1 text-xs text-slate-600">
                Completion checkbox, tags, streak and weekly bars on every row.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="font-medium text-slate-900">Stats and edit flow</p>
              <p className="mt-1 text-xs text-slate-600">
                Browse dashboard, edit habits, and check detailed statistics.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PublicLandingSeoContent() {
  return (
    <section className="border-b border-slate-200 bg-white px-4 py-12 sm:px-6">
      <div className="mx-auto grid w-full max-w-6xl gap-6 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-xl font-semibold text-slate-900">What Makes Habbit Runner Different</h2>
          <p className="mt-3 text-sm text-slate-600">
            Habbit Runner is a habit tracking app focused on execution. You set daily targets, check
            progress in a clear dashboard, and monitor streaks without clutter.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            <li>Simple habit tracker for consistent daily routines.</li>
            <li>Streak tracker with current streak and longest streak history.</li>
            <li>Goal tracking with completion rates and trend visibility.</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href="/streak-tracker" className="text-xs text-cyan-700 underline">
              Streak tracker details
            </a>
            <a href="/daily-routine-planner" className="text-xs text-cyan-700 underline">
              Daily routine planner details
            </a>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-xl font-semibold text-slate-900">Best For</h2>
          <p className="mt-3 text-sm text-slate-600">
            This productivity app is built for people who want clear data instead of motivational
            noise: founders, creators, athletes, students, and teams building daily discipline.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            <li>Personal habit planning and consistency tracking.</li>
            <li>Routine management for work, health, learning, and focus.</li>
            <li>Weekly and monthly performance review from one place.</li>
          </ul>
        </article>
      </div>
    </section>
  );
}

function PublicLandingFaq() {
  return (
    <section className="bg-[#f8fafc] px-4 py-12 sm:px-6">
      <div className="mx-auto w-full max-w-6xl">
        <h2 className="text-2xl font-semibold text-slate-900">Habit Tracker FAQ</h2>
        <div className="mt-5 space-y-3">
          <details className="rounded-xl border border-slate-200 bg-white p-4">
            <summary className="cursor-pointer text-sm font-semibold text-slate-900">
              Is Habbit Runner a free habit tracker app?
            </summary>
            <p className="mt-2 text-sm text-slate-600">
              Yes. You can start with the core habit tracking flow, streak monitoring, and dashboard
              analytics without a paid plan.
            </p>
          </details>
          <details className="rounded-xl border border-slate-200 bg-white p-4">
            <summary className="cursor-pointer text-sm font-semibold text-slate-900">
              Does it support streak tracking and long-term progress?
            </summary>
            <p className="mt-2 text-sm text-slate-600">
              Yes. Each habit includes current streak, longest streak, completion rate, and trend
              views for weekly and monthly analysis.
            </p>
          </details>
          <details className="rounded-xl border border-slate-200 bg-white p-4">
            <summary className="cursor-pointer text-sm font-semibold text-slate-900">
              Can I use it as a daily routine planner?
            </summary>
            <p className="mt-2 text-sm text-slate-600">
              Yes. You can define daily targets, set reminders, and track routines for fitness,
              study, work, and personal growth.
            </p>
          </details>
        </div>
      </div>
    </section>
  );
}

function PublicLandingFooter({ onHelpClick }: Pick<PublicLandingProps, 'onHelpClick'>) {
  return (
    <footer className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p>Built for clarity and consistent daily execution.</p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={startOAuthLogin}
          className="rounded border border-slate-300 bg-white px-3 py-1.5 text-slate-700 transition-colors hover:border-cyan-300 hover:text-cyan-700"
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() =>
            onHelpClick('OAuth is not configured. Export backend Google OAuth env vars (or set them in root .env for Docker) and restart the API.')
          }
          className="rounded border border-slate-300 bg-white px-3 py-1.5 text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900"
        >
          Sign-in not working?
        </button>
      </div>
    </footer>
  );
}

export function PublicLanding({ authError, onHelpClick }: PublicLandingProps) {
  useEffect(() => {
    return applyPublicSeo({
      title: 'Habbit Runner - Habit Tracker App With Streak Analytics',
      description:
        'Habbit Runner is a habit tracker app for daily routines, streak tracking, and productivity analytics with a clean dashboard.',
      keywords:
        'habit tracker app, streak tracker app, daily routine planner, goal tracker app, productivity habit app',
      pathname: '/',
      faq: [
        {
          question: 'Is Habbit Runner a free habit tracker app?',
          answer:
            'Yes. You can start with core habit tracking, streak monitoring, and dashboard analytics.'
        },
        {
          question: 'Does it support streak tracking and long-term progress?',
          answer:
            'Yes. Each habit includes current streak, longest streak, completion rate, and trend views.'
        },
        {
          question: 'Can I use it as a daily routine planner?',
          answer:
            'Yes. You can define daily targets, set reminders, and track routines for work and personal goals.'
        }
      ]
    });
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PublicLandingHeader />
      <main>
        <PublicLandingHero />
        <PublicPreviewCarousel />
        <PublicLandingSeoContent />
        <PublicLandingFaq />
      </main>
      <PublicLandingFooter onHelpClick={onHelpClick} />

      {authError && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs text-emerald-700">
          {authError}
        </div>
      )}
    </div>
  );
}
