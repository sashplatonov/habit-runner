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
  | 'cloud';

export interface Theme {
  id: ThemeId;
  name: string;
  accent: string;
  accentSecondary: string;
  group: 'dark' | 'light';
}

export const THEMES: Theme[] = [
  {
    id: 'midnight',
    name: 'Midnight',
    accent: '#65d6a0',
    accentSecondary: '#9aa8ff',
    group: 'dark'
  },
  {
    id: 'ember',
    name: 'Ember',
    accent: '#f2a36b',
    accentSecondary: '#ff8b85',
    group: 'dark'
  },
  {
    id: 'violet',
    name: 'Violet',
    accent: '#9aa8ff',
    accentSecondary: '#c69bff',
    group: 'dark'
  },
  {
    id: 'matrix',
    name: 'Matrix',
    accent: '#65d6a0',
    accentSecondary: '#9be2bb',
    group: 'dark'
  },
  {
    id: 'arctic',
    name: 'Arctic',
    accent: '#7eb8ff',
    accentSecondary: '#dce7f7',
    group: 'dark'
  },
  {
    id: 'sakura',
    name: 'Sakura',
    accent: '#e56e93',
    accentSecondary: '#c95cb7',
    group: 'light'
  },
  {
    id: 'lavender',
    name: 'Lavender',
    accent: '#8b7bff',
    accentSecondary: '#6fb4ff',
    group: 'light'
  },
  {
    id: 'mint',
    name: 'Mint',
    accent: '#3fc48a',
    accentSecondary: '#56b8c9',
    group: 'light'
  },
  {
    id: 'peach',
    name: 'Peach',
    accent: '#f08d52',
    accentSecondary: '#dd6d86',
    group: 'light'
  },
  {
    id: 'cloud',
    name: 'Cloud',
    accent: '#4e63d8',
    accentSecondary: '#23835d',
    group: 'light'
  }
];

export const THEME_IDS = new Set<ThemeId>(THEMES.map((theme) => theme.id));
