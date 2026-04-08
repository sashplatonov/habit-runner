export async function initFaro(): Promise<void> {
  if (typeof window === 'undefined') return;

  const url = (import.meta.env.VITE_FARO_URL as string | undefined);
  if (!url) return;

VITE_FARO_API_KEY=
  const appName = import.meta.env.VITE_FARO_APP_NAME ?? 'Habbit Runner';
  const appVersion = import.meta.env.VITE_FARO_APP_VERSION ?? '1.0.0';
  const environment = import.meta.env.VITE_FARO_ENVIRONMENT ?? 'production';
  const samplingRate = Number(import.meta.env.VITE_FARO_SAMPLING_RATE ?? '1');
  const persistent = (import.meta.env.VITE_FARO_PERSISTENT_SESSIONS ?? 'false') === 'true';
  const storageKey = 'habbit_runner_faro_sampled_v1';

  let sampled: boolean | null = null;
  try {
    if (persistent) {
      const s = localStorage.getItem(storageKey);
      if (s !== null) sampled = s === '1';
    }
  } catch {
    // ignore storage errors
  }

  if (sampled === null) {
    sampled = Math.random() < Math.max(0, Math.min(1, samplingRate));
    try {
      if (persistent) localStorage.setItem(storageKey, sampled ? '1' : '0');
    } catch {
      // ignore
    }
  }

  if (!sampled) return;

  try {
    const faroPkg = await import('@grafana/faro-web-sdk');
    const tracingPkg = await import('@grafana/faro-web-tracing');

    const { getWebInstrumentations, initializeFaro } = faroPkg;
    const { TracingInstrumentation } = tracingPkg;

    initializeFaro({
      url,
      apiKey,
      app: {
        name: appName,
        version: appVersion,
        environment,
      },
      instrumentations: [
        ...getWebInstrumentations(),
        new TracingInstrumentation(),
      ],
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Faro init failed', err);
  }
}
