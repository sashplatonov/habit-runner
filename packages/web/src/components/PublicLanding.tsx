import React, { useEffect } from 'react';
import { ArrowRightIcon, CheckCircle2Icon, SparklesIcon } from 'lucide-react';
import { startOAuthLogin } from '@/lib/auth/oauth';
import { PublicPreviewCarousel } from '@/components/PublicPreviewCarousel';

type PublicLandingProps = {
  authError?: string;
  onHelpClick: (message: string) => void;
};

const featureHighlights = [
  'Daily completion targets',
  'Current and longest streak analytics',
  'Sync-ready workflow across devices'
];

function upsertMeta(name: 'description' | 'robots', content: string) {
  let element = document.querySelector(`meta[name="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('name', name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function upsertPropertyMeta(property: 'og:title' | 'og:description' | 'og:type', content: string) {
  let element = document.querySelector(`meta[property="${property}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('property', property);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

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
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-300 bg-cyan-50">
            <span className="font-mono text-xs font-bold text-cyan-700">HR</span>
          </div>
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
            Start habits with clear daily execution, not noisy motivation boards.
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
            onHelpClick('OAuth is not configured. Fill in packages/server/.env and restart the API.')
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
    const previousTitle = document.title;
    const previousDescription = document
      .querySelector('meta[name="description"]')
      ?.getAttribute('content');

    document.title = 'Habbit Runner - Build Habits With Daily Streak Tracking';
    upsertMeta(
      'description',
      'Habbit Runner helps teams and individuals build consistent habits with daily targets, streak analytics, and cross-device sync.'
    );
    upsertMeta('robots', 'index, follow');
    upsertPropertyMeta('og:title', 'Habbit Runner - Build Habits With Daily Streak Tracking');
    upsertPropertyMeta(
      'og:description',
      'See how Habbit Runner looks inside before signing in: dashboard, streak metrics, and progress insights.'
    );
    upsertPropertyMeta('og:type', 'website');

    return () => {
      document.title = previousTitle;
      if (previousDescription) {
        upsertMeta('description', previousDescription);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PublicLandingHeader />
      <main>
        <PublicLandingHero />
        <PublicPreviewCarousel />
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
