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
    accent: '#00d4ff',
    accentSecondary: '#00ff88',
    group: 'dark'
  },
  {
    id: 'ember',
    name: 'Ember',
    accent: '#ff8c42',
    accentSecondary: '#ff4d6a',
    group: 'dark'
  },
  {
    id: 'violet',
    name: 'Violet',
    accent: '#bf6bff',
    accentSecondary: '#ff6bb5',
    group: 'dark'
  },
  {
    id: 'matrix',
    name: 'Matrix',
    accent: '#33ff33',
    accentSecondary: '#00cc66',
    group: 'dark'
  },
  {
    id: 'arctic',
    name: 'Arctic',
    accent: '#64b5f6',
    accentSecondary: '#e0e0e0',
    group: 'dark'
  },
  {
    id: 'sakura',
    name: 'Sakura',
    accent: '#e8457a',
    accentSecondary: '#c44dbb',
    group: 'light'
  },
  {
    id: 'lavender',
    name: 'Lavender',
    accent: '#7c5cbf',
    accentSecondary: '#5b8def',
    group: 'light'
  },
  {
    id: 'mint',
    name: 'Mint',
    accent: '#2eaa6e',
    accentSecondary: '#1a8fb8',
    group: 'light'
  },
  {
    id: 'peach',
    name: 'Peach',
    accent: '#e07830',
    accentSecondary: '#d04880',
    group: 'light'
  },
  {
    id: 'cloud',
    name: 'Cloud',
    accent: '#4a7aef',
    accentSecondary: '#3abba0',
    group: 'light'
  }
];

export const THEME_IDS = new Set<ThemeId>(THEMES.map((theme) => theme.id));
