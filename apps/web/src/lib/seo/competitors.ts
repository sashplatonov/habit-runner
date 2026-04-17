export type CompetitorFeature = {
  name: string;
  habbitRunner: string | boolean;
  competitor: string | boolean;
};

export type CompetitorData = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  habbitRunnerAngle: string;
  keywords: string;
  features: CompetitorFeature[];
  competitorStrengths: string[];
  habbitRunnerStrengths: string[];
  verdict: string;
};

export const COMPETITORS: Record<string, CompetitorData> = {
  habitica: {
    slug: 'habitica',
    name: 'Habitica',
    tagline: 'Habbit Runner vs Habitica — Productivity Over Gamification',
    description:
      'Comparing Habbit Runner and Habitica for habit tracking. Habbit Runner focuses on offline-first data and streak analytics; Habitica adds RPG gamification on top of a cloud-only model.',
    habbitRunnerAngle: 'offline-first analytics without gamification noise',
    keywords:
      'habitica vs habbit runner, habitica alternative offline, habitica alternative pwa, habit tracker no gamification',
    features: [
      { name: 'Offline support', habbitRunner: 'Full — IndexedDB', competitor: 'No — requires internet' },
      { name: 'PWA installable', habbitRunner: true, competitor: 'Limited' },
      { name: 'Push notifications', habbitRunner: 'Yes — web push', competitor: 'Yes — native' },
      { name: 'Streak tracking', habbitRunner: 'Yes — current + longest', competitor: 'Yes — via XP streaks' },
      { name: 'Analytics dashboard', habbitRunner: 'Yes — completion rate, trends', competitor: 'Basic' },
      { name: 'Gamification (RPG)', habbitRunner: false, competitor: 'Yes — core feature' },
      { name: 'Multiplayer / social', habbitRunner: false, competitor: 'Yes — guilds, parties' },
      { name: 'Price', habbitRunner: 'Free', competitor: 'Free + subscription ($4.99/mo)' },
      { name: 'Background sync', habbitRunner: 'Yes — automatic', competitor: 'Cloud-sync always on' }
    ],
    competitorStrengths: [
      'Strong social motivation through guilds and party challenges',
      'RPG system (XP, level-ups, equipment) is motivating for gamers',
      'Large active community',
      'Wide native app support (iOS, Android)'
    ],
    habbitRunnerStrengths: [
      'Works fully offline — no internet required for tracking',
      'Clean analytics focused on data, not fiction',
      'No subscription required for core features',
      'Installable PWA — no App Store download',
      'Privacy-first: data stored locally first'
    ],
    verdict:
      'Choose Habitica if social gamification and RPG mechanics keep you engaged. Choose Habbit Runner if you want reliable offline tracking with clean data analytics and no subscription pressure.'
  },
  'streaks-app': {
    slug: 'streaks-app',
    name: 'Streaks',
    tagline: 'Habbit Runner vs Streaks App — Cross-Platform vs iOS-Only',
    description:
      'Comparing Habbit Runner and Streaks for habit tracking. Streaks is a polished iOS native app; Habbit Runner is a cross-platform PWA with offline-first sync.',
    habbitRunnerAngle: 'cross-platform offline access without iOS lock-in',
    keywords:
      'streaks app alternative, streaks ios alternative android, streaks app offline alternative, habit tracker cross platform',
    features: [
      { name: 'Platform support', habbitRunner: 'Any browser — Android, iOS, desktop', competitor: 'iOS / macOS only' },
      { name: 'Offline support', habbitRunner: 'Full — IndexedDB', competitor: 'Full — local storage' },
      { name: 'PWA installable', habbitRunner: true, competitor: 'No — App Store only' },
      { name: 'HealthKit integration', habbitRunner: false, competitor: 'Yes — deep integration' },
      { name: 'Push notifications', habbitRunner: 'Yes — web push', competitor: 'Yes — native iOS' },
      { name: 'Streak tracking', habbitRunner: 'Yes — current + longest', competitor: 'Yes — core feature' },
      { name: 'Cross-device sync', habbitRunner: 'Yes — background sync', competitor: 'iCloud (Apple only)' },
      { name: 'Price', habbitRunner: 'Free', competitor: 'Paid (~$4.99 one-time)' },
      { name: 'Open source', habbitRunner: false, competitor: false }
    ],
    competitorStrengths: [
      'Deep HealthKit integration for automatic health habit logging',
      'Beautiful, polished iOS native UI',
      'One-time purchase, no subscription',
      'Excellent widget support on iOS'
    ],
    habbitRunnerStrengths: [
      'Works on Android, iOS, Windows, Mac, Linux — any device with a browser',
      'No App Store required — install directly from browser',
      'Free with no purchase required',
      'Offline-first with cross-platform background sync',
      'Analytics visible across all devices'
    ],
    verdict:
      'Choose Streaks if you are in the Apple ecosystem and want deep HealthKit integration. Choose Habbit Runner if you use multiple device types, want Android support, or prefer a free cross-platform option.'
  },
  beeminder: {
    slug: 'beeminder',
    name: 'Beeminder',
    tagline: 'Habbit Runner vs Beeminder — Habit Tracking Without Commitment Contracts',
    description:
      'Comparing Habbit Runner and Beeminder for habit building. Beeminder uses financial accountability with pledges; Habbit Runner focuses on positive streak analytics without monetary pressure.',
    habbitRunnerAngle: 'positive reinforcement analytics without financial penalties',
    keywords:
      'beeminder alternative, beeminder without pledges, habit tracker no commitment contract, beeminder free alternative',
    features: [
      { name: 'Offline support', habbitRunner: 'Full — IndexedDB', competitor: 'No — requires internet' },
      { name: 'PWA installable', habbitRunner: true, competitor: 'Limited' },
      { name: 'Financial accountability', habbitRunner: false, competitor: 'Yes — core feature (pledges)' },
      { name: 'Streak tracking', habbitRunner: 'Yes — current + longest', competitor: 'Goal progress graphs' },
      { name: 'Push notifications', habbitRunner: 'Yes — web push', competitor: 'Yes — derailment alerts' },
      { name: 'Analytics dashboard', habbitRunner: 'Yes — completion rates, trends', competitor: 'Yes — Yellow Brick Road graphs' },
      { name: 'IFTTT / Zapier integration', habbitRunner: false, competitor: 'Yes' },
      { name: 'Price', habbitRunner: 'Free', competitor: 'Free tier + $0 pledges possible' },
      { name: 'Background sync', habbitRunner: 'Yes — automatic', competitor: 'Yes — cloud only' }
    ],
    competitorStrengths: [
      'Financial accountability is uniquely effective for deadline-driven people',
      'Excellent integrations with Fitbit, Apple Health, Duolingo, GitHub',
      'Long track record (founded 2012)',
      'Strong anti-procrastination design'
    ],
    habbitRunnerStrengths: [
      'No financial stress — track habits without pledge anxiety',
      'Works fully offline',
      'Faster daily logging with a clean dashboard',
      'Free with no hidden pledge mechanics',
      'Privacy-first: no third-party integrations required'
    ],
    verdict:
      'Choose Beeminder if external financial accountability is what you need to stay on track. Choose Habbit Runner if you want positive, data-driven habit tracking without monetary pressure or internet dependency.'
  }
};

export function getCompetitor(slug: string): CompetitorData | undefined {
  return COMPETITORS[slug];
}

export function getCompetitorSlugs(): string[] {
  return Object.keys(COMPETITORS);
}
