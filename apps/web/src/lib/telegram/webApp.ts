import { browser } from '$app/environment';

export type TelegramThemeParams = Record<string, string | undefined>;

export type TelegramInsets = {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
};

export interface TelegramWebAppAdapter {
  initData: string;
  initDataUnsafe?: { start_param?: string };
  themeParams: TelegramThemeParams;
  safeAreaInset?: TelegramInsets;
  contentSafeAreaInset?: TelegramInsets;
  viewportHeight?: number;
  viewportStableHeight?: number;
  onEvent?(eventType: 'themeChanged' | 'viewportChanged' | 'safeAreaChanged' | 'contentSafeAreaChanged', eventHandler: () => void): void;
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
const SCRIPT_STATE_ATTRIBUTE = 'data-telegram-sdk-state';

let sdkLoad: Promise<void> | null = null;
const initializedWebApps = new WeakSet<TelegramWebAppAdapter>();

export async function loadTelegramWebApp(): Promise<TelegramWebAppAdapter | null> {
  if (!browser) { return null; }
  if (window.Telegram?.WebApp) { return initializeWebApp(window.Telegram.WebApp); }

  if (!sdkLoad) {
    sdkLoad = loadTelegramSdk().catch((cause: unknown) => {
      sdkLoad = null;
      throw cause;
    });
  }
  await sdkLoad;

  const webApp = window.Telegram?.WebApp;
  if (!webApp) { return null; }
  return initializeWebApp(webApp);
}

function initializeWebApp(webApp: TelegramWebAppAdapter): TelegramWebAppAdapter {
  if (initializedWebApps.has(webApp)) {
    applyVisualState(webApp);
    return webApp;
  }

  initializedWebApps.add(webApp);
  webApp.ready();
  webApp.expand();
  applyVisualState(webApp);
  const refreshVisualState = () => applyVisualState(webApp);
  webApp.onEvent?.('themeChanged', refreshVisualState);
  webApp.onEvent?.('viewportChanged', refreshVisualState);
  webApp.onEvent?.('safeAreaChanged', refreshVisualState);
  webApp.onEvent?.('contentSafeAreaChanged', refreshVisualState);
  return webApp;
}

export function telegramStartParam(webApp: TelegramWebAppAdapter): string | null {
  return nonEmpty(webApp.initDataUnsafe?.start_param)
    ?? queryStartParam();
}

function queryStartParam(): string | null {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return nonEmpty(query.get('tgWebAppStartParam'))
    ?? nonEmpty(query.get('startapp'))
    ?? nonEmpty(hash.get('tgWebAppStartParam'))
    ?? nonEmpty(hash.get('startapp'));
}

function nonEmpty(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function loadTelegramSdk(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      const state = existing.getAttribute(SCRIPT_STATE_ATTRIBUTE);
      if (state === 'loaded') {
        resolve();
        return;
      }
      if (state === 'failed') {
        existing.remove();
        loadTelegramSdk().then(resolve, reject);
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Telegram SDK failed to load')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_URL;
    script.async = true;
    script.setAttribute(SCRIPT_STATE_ATTRIBUTE, 'loading');
    script.onload = () => {
      script.setAttribute(SCRIPT_STATE_ATTRIBUTE, 'loaded');
      resolve();
    };
    script.onerror = () => {
      script.setAttribute(SCRIPT_STATE_ATTRIBUTE, 'failed');
      reject(new Error('Telegram SDK failed to load'));
    };
    document.head.appendChild(script);
  });
}

function applyVisualState(webApp: TelegramWebAppAdapter): void {
  const root = document.documentElement;
  const params = webApp.themeParams;
  for (const [key, value] of Object.entries(params)) {
    if (value) { root.style.setProperty(`--telegram-${key.replaceAll('_', '-')}`, value); }
  }

  const safeArea = webApp.safeAreaInset ?? {};
  const contentSafeArea = webApp.contentSafeAreaInset ?? {};
  for (const side of ['top', 'bottom', 'left', 'right'] as const) {
    const inset = Math.max(safeArea[side] ?? 0, contentSafeArea[side] ?? 0);
    root.style.setProperty(`--safe-area-inset-${side}`, `${inset}px`);
  }
  const viewportHeight = webApp.viewportHeight ?? webApp.viewportStableHeight;
  if (viewportHeight && viewportHeight > 0) {
    root.style.setProperty('--telegram-viewport-height', `${viewportHeight}px`);
  }
}
