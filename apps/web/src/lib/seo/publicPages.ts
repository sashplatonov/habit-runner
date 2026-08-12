export type FaqItem = {
  question: string;
  answer: string;
};

export type PublicSeoIntent = 'habit-tracker' | 'streak-tracker' | 'daily-routine-planner';

export type PublicSeoConfig = {
  title: string;
  h1: string;
  description: string;
  keywords: string;
  pathname: string;
  bullets: string[];
  faq: FaqItem[];
};

export const PUBLIC_SITE_ORIGIN = 'https://habit-runner.freeddns.org';
export const PUBLIC_OG_IMAGE_URL = new URL('/og-image.svg', PUBLIC_SITE_ORIGIN).toString();

export const PUBLIC_LANDING_SEO = {
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
        'Yes. You can start with core habit tracking, streak monitoring, and dashboard analytics at no cost.'
    },
    {
      question: 'Can I use Habbit Runner from Telegram?',
      answer:
        'Yes. Open the Mini App in Telegram for a quick check-in. Link your account when you want to continue with the same habits in the web app.'
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
    },
    {
      question: 'What happens when my connection is unavailable?',
      answer:
        'The app can open when you are away from a connection, but saving authenticated habit changes needs you to reconnect.'
    },
    {
      question: 'Is my habit data private?',
      answer:
        'Your signed-in habit data is kept for your account. We do not sell it, share it for advertising, or use it to build an advertising profile.'
    },
    {
      question: 'Do I need to download an app from an app store?',
      answer:
        'No. You can add Habbit Runner to your home screen when your device offers that option.'
    },
    {
      question: 'Can I get reminders for a habit?',
      answer:
        'Yes. Add a reminder time to the habits where a timely nudge would help.'
    },
    {
      question: 'How does cross-device refresh work?',
      answer:
        'When you return to the app, refresh to see the latest progress saved to your account.'
    }
  ] satisfies FaqItem[]
};

export const PUBLIC_SEO_PAGES: Record<PublicSeoIntent, PublicSeoConfig> = {
  'habit-tracker': {
    title: 'Habit Tracker App - Habbit Runner',
    h1: 'Habit Tracker App For Real Daily Consistency',
    description:
      'Habbit Runner is a habit tracker app with daily targets, clean progress dashboard, and performance analytics.',
    keywords:
      'habit tracker app, best habit tracker, habit builder app, habit tracking dashboard, goal tracker',
    pathname: '/habit-tracker',
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
    pathname: '/streak-tracker',
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
    pathname: '/daily-routine-planner',
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

export function buildCanonicalUrl(pathname: string) {
  return new URL(pathname, PUBLIC_SITE_ORIGIN).toString();
}

export function buildFaqSchema(faq: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      }
    }))
  };
}

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Habbit Runner',
    url: PUBLIC_SITE_ORIGIN,
    logo: PUBLIC_OG_IMAGE_URL
  };
}

export function buildWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Habbit Runner',
    url: PUBLIC_SITE_ORIGIN,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${PUBLIC_SITE_ORIGIN}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };
}

export function buildSoftwareSchema(description: string, pathname: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Habbit Runner',
    applicationCategory: 'ProductivityApplication',
    operatingSystem: 'Web',
    url: buildCanonicalUrl(pathname),
    description,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    }
  };
}

export const PUBLIC_ABOUT_SEO = {
  title: 'About Habbit Runner — A Clear Habit Tracker',
  description:
    'Learn about Habbit Runner, a habit tracker built for daily consistency, useful progress signals, and privacy-minded design.',
  keywords:
    'about habbit runner, habit tracking team, habit tracking app, daily consistency',
  pathname: '/about'
};

export const PUBLIC_SHOWCASE_SEO = {
  title: 'Habbit Runner Showcase — Try the Real UI Without Sign-In',
  description:
    'Try the Habbit Runner dashboard, habit details, editing, check-ins, and progress screens in a temporary sample with no sign-in required.',
  keywords:
    'habit tracker showcase, interactive habit dashboard demo, no sign-in habit tracker, streak analytics demo',
  pathname: '/showcase'
};

export const PUBLIC_PRIVACY_SEO = {
  title: 'Privacy Policy — Habbit Runner',
  description:
    'Habbit Runner privacy policy: how we handle account data, advertising, sharing, and reminders.',
  keywords: 'habbit runner privacy policy, habit tracker data privacy, gdpr habit tracker',
  pathname: '/privacy-policy'
};

export const PUBLIC_FEATURES_SEO = {
  title: 'Features — Habbit Runner Habit Tracker',
  description:
    'Explore Habbit Runner features: streak tracking, reminders, Google sign-in, daily routine planning, and more.',
  keywords:
    'habit tracker features, streak tracker features, habit reminders, daily routine planning',
  pathname: '/features'
};
