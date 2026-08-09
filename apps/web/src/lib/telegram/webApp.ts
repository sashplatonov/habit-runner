import { browser } from '$app/environment';

export type TelegramThemeParams = Record<string, string | undefined>;

export interface TelegramWebAppAdapter {
  initData: string;
  startParam: string | null;
  themeParams: TelegramThemeParams;
  ready(): void;
  expand(): void;
  close(): void;
}

type TelegramWebApp = TelegramWebAppAdapter;

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

const SCRIPT_ID = 'telegram-web-app-sdk';
const SCRIPT_URL = 'https://telegram.org/js/telegram-web-app.js?57';

export async function loadTelegramWebApp(): Promise<TelegramWebAppAdapter | null> {
  if (!browser) { return null; }
  if (window.Telegram?.WebApp) { return window.Telegram.WebApp; }
  await new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Telegram SDK failed to load')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Telegram SDK failed to load'));
    document.head.appendChild(script);
  });
  const webApp = window.Telegram?.WebApp;
  if (!webApp) { return null; }
  webApp.ready();
  webApp.expand();
  applySafeArea(webApp);
  return webApp;
}

function applySafeArea(webApp: TelegramWebAppAdapter): void {
  const root = document.documentElement;
  const params = webApp.themeParams;
  for (const [key, value] of Object.entries(params)) {
    if (value) { root.style.setProperty(`--telegram-${key.replaceAll('_', '-')}`, value); }
  }
}
