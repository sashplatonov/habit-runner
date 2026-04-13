const rawApiBase = import.meta.env.VITE_API_BASE_URL;
export const API_BASE_URL = (rawApiBase && rawApiBase.length > 0)
  ? rawApiBase
  : (import.meta.env.MODE === 'development' ? 'http://localhost:3000' : '/api');

export const DEFAULT_USER_ID = import.meta.env.VITE_DEFAULT_USER_ID ?? 'demo-user';

const rawSyncFlag = import.meta.env.VITE_SYNC_ENABLED;
export const SYNC_ENABLED = rawSyncFlag !== 'false';
export const SYNC_DISABLED_REASON = 'syncing disabled via VITE_SYNC_ENABLED=false';
