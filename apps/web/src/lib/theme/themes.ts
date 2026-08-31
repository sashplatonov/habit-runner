export type ThemeId =
  | 'cloud'
  | 'peach'
  | 'mint'
  | 'lavender'
  | 'paper'
  | 'midnight'
  | 'graphite'
  | 'ember'
  | 'violet'
  | 'matrix';

export interface Theme {
  id: ThemeId;
  name: string;
  accent: string;
  accentSecondary: string;
  progress: string;
  group: 'dark' | 'light';
  themeColor: string;
}

export type ThemeUsage = Partial<Record<ThemeId, number>>;

export const DEFAULT_THEME_ID: ThemeId = 'cloud';

export const THEMES: readonly Theme[] = [
  { id: 'cloud', name: 'Cloud', accent: '#5876e8', accentSecondary: '#48c7e9', progress: '#48c7e9', group: 'light', themeColor: '#f3f6f2' },
  { id: 'peach', name: 'Peach Paper', accent: '#ef8f6f', accentSecondary: '#ef8f6f', progress: '#ef8f6f', group: 'light', themeColor: '#fff9f5' },
  { id: 'mint', name: 'Neo Mint', accent: '#17b98b', accentSecondary: '#25d2a1', progress: '#25d2a1', group: 'light', themeColor: '#f0fbf7' },
  { id: 'lavender', name: 'Lavender Glass', accent: '#7b67e8', accentSecondary: '#9b82ff', progress: '#9b82ff', group: 'light', themeColor: '#f8f6ff' },
  { id: 'paper', name: 'Editorial Mono', accent: '#22211f', accentSecondary: '#586e5c', progress: '#22211f', group: 'light', themeColor: '#f7f5ef' },
  { id: 'midnight', name: 'Midnight OLED', accent: '#55d1bb', accentSecondary: '#55d1bb', progress: '#55d1bb', group: 'dark', themeColor: '#0b0f10' },
  { id: 'graphite', name: 'Graphite Pro', accent: '#7c9cff', accentSecondary: '#7c9cff', progress: '#7c9cff', group: 'dark', themeColor: '#17191e' },
  { id: 'ember', name: 'Ember Cyber', accent: '#ff7a45', accentSecondary: '#ff7a45', progress: '#ff7a45', group: 'dark', themeColor: '#160e0d' },
  { id: 'violet', name: 'Violet Glass', accent: '#a68cff', accentSecondary: '#b39bff', progress: '#b39bff', group: 'dark', themeColor: '#171521' },
  { id: 'matrix', name: 'Matrix Terminal', accent: '#34f07a', accentSecondary: '#34f07a', progress: '#34f07a', group: 'dark', themeColor: '#050a07' }
];

export const THEME_IDS: ReadonlySet<ThemeId> = new Set(THEMES.map((theme) => theme.id));

const THEME_USAGE_STORAGE_KEY = 'habit-theme-usage';

export function readThemeUsage(): ThemeUsage {
  if (typeof window === 'undefined') {
    return {};
  }
  try {
    const storedUsage = window.localStorage?.getItem(THEME_USAGE_STORAGE_KEY);
    const parsedUsage: unknown = storedUsage ? JSON.parse(storedUsage) : {};
    if (!parsedUsage || typeof parsedUsage !== 'object' || Array.isArray(parsedUsage)) {
      return {};
    }
    return Object.fromEntries(
      [...THEME_IDS]
        .map((themeId) => [themeId, Reflect.get(parsedUsage, themeId)] as const)
        .filter((entry): entry is readonly [ThemeId, number] => Number.isSafeInteger(entry[1]) && entry[1] >= 0)
    );
  } catch {
    return {};
  }
}

export function recordThemeSelection(themeId: ThemeId): ThemeUsage {
  const nextUsage = { ...readThemeUsage(), [themeId]: (readThemeUsage()[themeId] ?? 0) + 1 };
  if (typeof window !== 'undefined') {
    try { window.localStorage?.setItem(THEME_USAGE_STORAGE_KEY, JSON.stringify(nextUsage)); } catch { /* Storage is optional. */ }
  }
  return nextUsage;
}

export function rankThemesByUsage(themes: readonly Theme[], usage: ThemeUsage): Theme[] {
  return themes
    .map((theme, catalogIndex) => ({ theme, catalogIndex }))
    .sort((first, second) => (usage[second.theme.id] ?? 0) - (usage[first.theme.id] ?? 0) || first.catalogIndex - second.catalogIndex)
    .map(({ theme }) => theme);
}

export function getTheme(themeId: ThemeId): Theme {
  return THEMES.find((theme) => theme.id === themeId) ?? THEMES.find((theme) => theme.id === DEFAULT_THEME_ID)!;
}
