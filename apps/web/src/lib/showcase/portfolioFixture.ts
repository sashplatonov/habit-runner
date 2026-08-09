export type ShowcaseHabit = {
  name: string;
  icon: string;
  category: string;
  schedule: string;
  progress: number;
  streak: number;
  accent: string;
  status: 'Complete' | 'In progress' | 'Next up';
};

export type ShowcaseDay = {
  label: string;
  date: string;
  completed: boolean;
  current?: boolean;
};

export const portfolioFixture = {
  summary: {
    completed: 4,
    total: 6,
    streak: 12,
    completionRate: 78
  },
  habits: [
    {
      name: 'Morning pages',
      icon: '✍️',
      category: 'Focus',
      schedule: 'Daily · 15 min',
      progress: 100,
      streak: 12,
      accent: '#23835d',
      status: 'Complete'
    },
    {
      name: 'Walk outside',
      icon: '🌿',
      category: 'Energy',
      schedule: 'Daily · 20 min',
      progress: 60,
      streak: 7,
      accent: '#4e63d8',
      status: 'In progress'
    },
    {
      name: 'Read one chapter',
      icon: '📚',
      category: 'Learning',
      schedule: 'Weekdays · 1 chapter',
      progress: 0,
      streak: 3,
      accent: '#c06a3d',
      status: 'Next up'
    }
  ] satisfies ShowcaseHabit[],
  week: [
    { label: 'Mon', date: '12', completed: true },
    { label: 'Tue', date: '13', completed: true },
    { label: 'Wed', date: '14', completed: true },
    { label: 'Thu', date: '15', completed: true },
    { label: 'Fri', date: '16', completed: false, current: true },
    { label: 'Sat', date: '17', completed: false },
    { label: 'Sun', date: '18', completed: false }
  ] satisfies ShowcaseDay[],
  conflict: {
    title: 'A change needs your attention',
    message: 'This item changed elsewhere. Refresh and try again.',
    detail: 'Optimistic versioning keeps two sessions from silently overwriting each other.'
  }
} as const;

