/** GA4 measurement ID from environment — optional. */
const GA4_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined;

/** Returns true if GA4 is configured and running in production. */
export function isAnalyticsEnabled(): boolean {
  return Boolean(GA4_ID) && !import.meta.env.DEV;
}

/** Load the GA4 script and configure gtag. Call once on app init. */
export function loadGA4(): void {
  if (!isAnalyticsEnabled() || !GA4_ID) { return; }

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
  document.head.appendChild(script);

  // @ts-expect-error — gtag uses window globals
  window.dataLayer = window.dataLayer ?? [];
  // @ts-expect-error — gtag uses window globals
  window.gtag = function gtag(...args: unknown[]) {
    // @ts-expect-error — window.dataLayer push
    window.dataLayer.push(args);
  };
  // @ts-expect-error — window.gtag
  window.gtag('js', new Date());
  // @ts-expect-error — window.gtag
  window.gtag('config', GA4_ID, {
    send_page_view: false // We send page views manually via trackPageView
  });
}

/** Send a page view to GA4. Call on every navigation. */
export function trackPageView(url: string): void {
  if (!isAnalyticsEnabled()) { return; }
  // @ts-expect-error — window.gtag
  window.gtag?.('event', 'page_view', { page_location: url });
}

// ---- Typed custom events ----

export function trackHabitCreated(habitName: string): void {
  if (!isAnalyticsEnabled()) { return; }
  // @ts-expect-error — window.gtag
  window.gtag?.('event', 'habit_created', { habit_name: habitName });
}

export function trackHabitCompleted(habitId: string): void {
  if (!isAnalyticsEnabled()) { return; }
  // @ts-expect-error — window.gtag
  window.gtag?.('event', 'habit_completed', { habit_id: habitId });
}

export function trackPwaInstalled(): void {
  if (!isAnalyticsEnabled()) { return; }
  // @ts-expect-error — window.gtag
  window.gtag?.('event', 'pwa_installed');
}

export function trackSyncCompleted(direction: 'push' | 'pull' | 'full'): void {
  if (!isAnalyticsEnabled()) { return; }
  // @ts-expect-error — window.gtag
  window.gtag?.('event', 'sync_completed', { direction });
}
