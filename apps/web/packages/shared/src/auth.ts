export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface UserPreferences {
  theme: string;
  timezone: string | null;
  dashboard: DashboardPreferences;
}

export interface DashboardPreferences {
  version: number;
  filter: 'pending' | 'all' | 'done' | 'archived';
  tags: string[];
  sort: 'custom' | 'smart';
  density: 'comfortable' | 'compact';
  themeUsage: Record<string, number>;
}
