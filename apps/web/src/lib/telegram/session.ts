import { API_BASE_URL } from '@/lib/core/config';
import { authenticatedFetch, saveAuthSession, type AuthSession } from '@/lib/auth/session';
import { loadTelegramWebApp, type TelegramWebAppAdapter } from './webApp';

export async function authenticateTelegramMiniApp(): Promise<AuthSession> {
  const webApp = await loadTelegramWebApp();
  if (!webApp || !webApp.initData) {
    throw new Error('Open this page from the Habbit Runner Telegram Mini App.');
  }
  const response = await fetch(`${API_BASE_URL}/auth/telegram/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ initData: webApp.initData })
  });
  if (!response.ok) {
    throw new Error(`Telegram authentication failed: ${response.status}`);
  }
  const payload = await response.json() as { userId?: string; email?: string };
  if (!payload.userId) {
    throw new Error('Telegram session response did not include a userId.');
  }
  return saveAuthSession({ userId: payload.userId, email: payload.email });
}

export async function completeTelegramPairing(webApp: TelegramWebAppAdapter, pairingToken = webApp.startParam): Promise<void> {
  if (!pairingToken) {
    return;
  }
  const response = await authenticatedFetch('/api/auth/link/telegram/complete', {
    method: 'POST',
    body: JSON.stringify({ token: pairingToken, initData: webApp.initData })
  });
  if (!response.ok) {
    throw new Error(`Telegram account linking failed: ${response.status}`);
  }
}
