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
      'Comparing Habbit Runner and Habitica for habit tracking. Habbit Runner focuses on clear progress signals; Habitica adds role-playing game motivation.',
    habbitRunnerAngle: 'useful progress signals without gamification noise',
    keywords:
      'habitica vs habbit runner, habitica alternative, habit tracker no gamification',
    features: [
      { name: 'Daily workflow', habbitRunner: 'Focused habit check-ins', competitor: 'Tasks, habits, and rewards' },
      { name: 'Reminders', habbitRunner: true, competitor: true },
      { name: 'Streak tracking', habbitRunner: 'Yes — current + longest', competitor: 'Yes — via XP streaks' },
      { name: 'Analytics dashboard', habbitRunner: 'Yes — completion rate, trends', competitor: 'Basic' },
      { name: 'Gamification (RPG)', habbitRunner: false, competitor: 'Yes — core feature' },
      { name: 'Multiplayer / social', habbitRunner: false, competitor: 'Yes — guilds, parties' },
      { name: 'Core access', habbitRunner: 'Free', competitor: 'Free tier with optional membership' },
      { name: 'Account progress', habbitRunner: 'Available when signed in', competitor: 'Available with an account' }
    ],
    competitorStrengths: [
      'Strong social motivation through guilds and party challenges',
      'RPG system (XP, level-ups, equipment) is motivating for gamers',
      'Large active community',
      'Wide native app support (iOS, Android)'
    ],
    habbitRunnerStrengths: [
      'Reliable tracking with a focused daily workflow',
      'Clean analytics focused on data, not fiction',
      'No subscription required for core features',
      'Free core habit tracking',
      'A private account experience without advertising'
    ],
    verdict:
      'Choose Habitica if social gamification and RPG mechanics keep you engaged. Choose Habbit Runner if you want clean data analytics and no subscription pressure.'
  },
  'streaks-app': {
    slug: 'streaks-app',
    name: 'Streaks',
    tagline: 'Habbit Runner vs Streaks App — Cross-Platform vs iOS-Only',
    description:
      'Comparing Habbit Runner and Streaks for habit tracking. Streaks is built around Apple devices; Habbit Runner focuses on a shared habit view and progress review.',
    habbitRunnerAngle: 'cross-platform access without iOS lock-in',
    keywords:
      'streaks app alternative, streaks apple alternative, habit tracker across devices',
    features: [
      { name: 'Device choice', habbitRunner: 'Use it on the devices in your routine', competitor: 'Apple devices' },
      { name: 'Habit logging', habbitRunner: 'Focused daily check-ins', competitor: 'Apple-focused habit tracking' },
      { name: 'Health data connection', habbitRunner: false, competitor: true },
      { name: 'Reminders', habbitRunner: true, competitor: true },
      { name: 'Streak tracking', habbitRunner: 'Yes — current + longest', competitor: 'Yes — core feature' },
      { name: 'Account progress', habbitRunner: 'Available when signed in', competitor: 'Available within the Apple ecosystem' },
      { name: 'Core access', habbitRunner: 'Free', competitor: 'Paid' }
    ],
    competitorStrengths: [
      'Deep HealthKit integration for automatic health habit logging',
      'Beautiful, polished iOS native UI',
      'One-time purchase, no subscription',
      'Excellent widget support on iOS'
    ],
    habbitRunnerStrengths: [
      'Use the same habit view across the devices in your routine',
      'Keep daily tracking close without an extra purchase',
      'Free with no purchase required',
      'Cross-platform web app with account access',
      'Analytics visible across all devices'
    ],
    verdict:
      'Choose Streaks if you are in the Apple ecosystem and want health data connections. Choose Habbit Runner if you use multiple device types or prefer a free, focused option.'
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
      { name: 'Daily workflow', habbitRunner: 'Focused habit check-ins', competitor: 'Goal graphs and commitments' },
      { name: 'Financial accountability', habbitRunner: false, competitor: 'Yes — core feature (pledges)' },
      { name: 'Streak tracking', habbitRunner: 'Yes — current + longest', competitor: 'Goal progress graphs' },
      { name: 'Reminders', habbitRunner: true, competitor: 'Goal alerts' },
      { name: 'Analytics dashboard', habbitRunner: 'Yes — completion rates, trends', competitor: 'Yes — Yellow Brick Road graphs' },
      { name: 'External connections', habbitRunner: false, competitor: true },
      { name: 'Core access', habbitRunner: 'Free', competitor: 'Free goals; paid commitments and optional premium' },
      { name: 'Account progress', habbitRunner: 'Available when signed in', competitor: 'Available with an account' }
    ],
    competitorStrengths: [
      'Financial accountability is uniquely effective for deadline-driven people',
      'Excellent integrations with Fitbit, Apple Health, Duolingo, GitHub',
      'Long track record (founded 2012)',
      'Strong anti-procrastination design'
    ],
    habbitRunnerStrengths: [
      'No financial stress — track habits without pledge anxiety',
      'Reliable habit tracking',
      'Faster daily logging with a clean dashboard',
      'Free with no hidden pledge mechanics',
      'Privacy-first: no third-party integrations required'
    ],
    verdict:
      'Choose Beeminder if external financial accountability is what you need to stay on track. Choose Habbit Runner if you want positive, data-driven habit tracking without monetary pressure.'
  }
};

export function getCompetitor(slug: string): CompetitorData | undefined {
  return COMPETITORS[slug];
}

export function getCompetitorSlugs(): string[] {
  return Object.keys(COMPETITORS);
}
