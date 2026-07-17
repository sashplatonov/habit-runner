export type ThemeId =
  | 'midnight'
  | 'ember'
  | 'violet'
  | 'matrix'
  | 'arctic'
  | 'sakura'
  | 'lavender'
  | 'mint'
  | 'peach'
  | 'graphite'
  | 'aurora'
  | 'dune'
  | 'lagoon'
  | 'cloud';

export interface Theme {
  id: ThemeId;
  name: string;
  accent: string;
  accentSecondary: string;
  progress: string;
  group: 'dark' | 'light';
  themeColor: string;
}

export const DEFAULT_THEME_ID: ThemeId = 'cloud';

export const THEMES: readonly Theme[] = [
  {
    id: 'midnight',
    name: 'Midnight',
    accent: '#65d6a0',
    accentSecondary: '#9aa8ff',
    progress: '#65d6a0',
    group: 'dark',
    themeColor: '#0b100d'
  },
  {
    id: 'ember',
    name: 'Ember',
    accent: '#f2a36b',
    accentSecondary: '#ff8b85',
    progress: '#f2a36b',
    group: 'dark',
    themeColor: '#0d0b09'
  },
  {
    id: 'violet',
    name: 'Violet',
    accent: '#9aa8ff',
    accentSecondary: '#c69bff',
    progress: '#9aa8ff',
    group: 'dark',
    themeColor: '#0c0b13'
  },
  {
    id: 'matrix',
    name: 'Matrix',
    accent: '#65d6a0',
    accentSecondary: '#9be2bb',
    progress: '#65d6a0',
    group: 'dark',
    themeColor: '#08110a'
  },
  {
    id: 'arctic',
    name: 'Arctic',
    accent: '#7eb8ff',
    accentSecondary: '#dce7f7',
    progress: '#7eb8ff',
    group: 'dark',
    themeColor: '#0a1118'
  },
  {
    id: 'sakura',
    name: 'Sakura',
    accent: '#e56e93',
    accentSecondary: '#c95cb7',
    progress: '#e56e93',
    group: 'light',
    themeColor: '#fff8f8'
  },
  {
    id: 'lavender',
    name: 'Lavender',
    accent: '#8b7bff',
    accentSecondary: '#6fb4ff',
    progress: '#8b7bff',
    group: 'light',
    themeColor: '#f8f7ff'
  },
  {
    id: 'mint',
    name: 'Mint',
    accent: '#3fc48a',
    accentSecondary: '#56b8c9',
    progress: '#3fc48a',
    group: 'light',
    themeColor: '#f5fbf8'
  },
  {
    id: 'peach',
    name: 'Peach',
    accent: '#f08d52',
    accentSecondary: '#dd6d86',
    progress: '#f08d52',
    group: 'light',
    themeColor: '#fffaf5'
  },
  {
    id: 'graphite',
    name: 'Graphite',
    accent: '#77c8ff',
    accentSecondary: '#a78bfa',
    progress: '#48d7a3',
    group: 'dark',
    themeColor: '#101216'
  },
  {
    id: 'aurora',
    name: 'Aurora',
    accent: '#98a7ff',
    accentSecondary: '#f28ccb',
    progress: '#5dd6b0',
    group: 'dark',
    themeColor: '#0c1020'
  },
  {
    id: 'dune',
    name: 'Dune',
    accent: '#93451f',
    accentSecondary: '#3d6f73',
    progress: '#26785f',
    group: 'light',
    themeColor: '#faf7f0'
  },
  {
    id: 'lagoon',
    name: 'Lagoon',
    accent: '#155e75',
    accentSecondary: '#2563eb',
    progress: '#087a63',
    group: 'light',
    themeColor: '#f3f9fa'
  },
  {
    id: 'cloud',
    name: 'Cloud',
    accent: '#4e63d8',
    accentSecondary: '#23835d',
    progress: '#23835d',
    group: 'light',
    themeColor: '#f4f6f1'
  }
];

export const THEME_IDS: ReadonlySet<ThemeId> = new Set(THEMES.map((theme) => theme.id));

export function getTheme(themeId: ThemeId): Theme {
  return THEMES.find((theme) => theme.id === themeId)
    ?? THEMES.find((theme) => theme.id === DEFAULT_THEME_ID)!;
}
