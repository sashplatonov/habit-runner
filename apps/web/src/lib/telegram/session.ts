import { API_BASE_URL } from '@/lib/core/config';
import { ApiError } from '@/lib/api/ApiError';
import { authenticatedFetch, saveAuthSession, type AuthSession } from '@/lib/auth/session';
import { loadTelegramWebApp, telegramStartParam, type TelegramWebAppAdapter } from './webApp';

export async function authenticateTelegramMiniApp(): Promise<AuthSession> {
  const webApp = await loadTelegramWebApp();
  if (!webApp || !webApp.initData) {
    throw new Error('Open this page from the Habbit Runner Telegram Mini App.');
  }
  const response = await authenticatedFetch(`${API_BASE_URL}/auth/telegram/session`, {
    method: 'POST',
    body: JSON.stringify({ initData: webApp.initData })
  });
  if (!response.ok) {
    throw await telegramAuthenticationError(response);
  }
  const payload = await response.json() as { userId?: string; email?: string };
  if (!payload.userId) {
    throw new Error('Telegram session response did not include a userId.');
  }
  return saveAuthSession({ userId: payload.userId, email: payload.email });
}

async function telegramAuthenticationError(response: Response): Promise<Error> {
  const error = await ApiError.fromResponse(response);
  if (error.detail === 'Telegram authentication is not configured') {
    return new Error('Telegram sign-in is not configured for this environment.');
  }
  if (error.detail === 'Expired Telegram initData') {
    return new Error('Your Telegram session expired. Close and reopen the Mini App.');
  }
  if (error.detail === 'Invalid Telegram hash') {
    return new Error('Telegram credentials do not match this bot. Please contact support.');
  }
  return new Error(`Telegram authentication failed: ${response.status}`);
}

export async function completeTelegramPairing(webApp: TelegramWebAppAdapter): Promise<AuthSession | null> {
  const startParam = telegramStartParam(webApp);
  if (!startParam) {
    return null;
  }
  const response = await authenticatedFetch('/api/auth/link/telegram/complete', {
    method: 'POST',
    body: JSON.stringify({ token: startParam, initData: webApp.initData })
  });
  if (!response.ok) {
    const responseCopy = response.clone();
    const error = await ApiError.fromResponse(response);
    let detail = error.detail;
    if (!detail) {
      try {
        const payload = await responseCopy.json() as { detail?: unknown };
        detail = typeof payload.detail === 'string' ? payload.detail : null;
      } catch {
        detail = null;
      }
    }
    throw new Error(detail
      ? `Telegram account linking failed: ${detail}`
      : `Telegram account linking failed: ${response.status}`);
  }
  const payload = await response.json() as { userId?: string; email?: string };
  if (!payload.userId) {
    throw new Error('Telegram account linking response did not include a userId.');
  }
  return saveAuthSession({ userId: payload.userId, email: payload.email });
}
