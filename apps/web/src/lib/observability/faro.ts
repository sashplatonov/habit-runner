type FaroConfig = {
  url: string;
  apiKey?: string;
  appName: string;
  appVersion: string;
  environment: string;
  samplingRate: number;
  persistent: boolean;
  storageKey: string;
};

function readFaroConfig(): FaroConfig | null {
  const url = (import.meta.env.VITE_FARO_URL as string | undefined);
  if (!url) {
    return null;
  }

  return {
    url,
    apiKey: (import.meta.env.VITE_FARO_API_KEY as string | undefined),
    appName: import.meta.env.VITE_FARO_APP_NAME ?? 'Habbit Runner',
    appVersion: import.meta.env.VITE_FARO_APP_VERSION ?? '1.0.0',
    environment: import.meta.env.VITE_FARO_ENVIRONMENT ?? 'production',
    samplingRate: Number(import.meta.env.VITE_FARO_SAMPLING_RATE ?? '1'),
    persistent: (import.meta.env.VITE_FARO_PERSISTENT_SESSIONS ?? 'false') === 'true',
    storageKey: 'habbit_runner_faro_sampled_v1',
  };
}

function shouldSample(samplingRate: number, persistent: boolean, storageKey: string): boolean {
  let sampled: boolean | null = null;

  if (persistent) {
    try {
      const s = localStorage.getItem(storageKey);
      if (s !== null) {
        sampled = s === '1';
      }
    } catch {
      // ignore storage errors
    }
  }

  if (sampled === null) {
    sampled = Math.random() < Math.max(0, Math.min(1, samplingRate));
    if (persistent) {
      try {
        localStorage.setItem(storageKey, sampled ? '1' : '0');
      } catch {
        // ignore
      }
    }
  }

  return Boolean(sampled);
}

export async function initFaro(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  const cfg = readFaroConfig();
  if (!cfg) {
    return;
  }

  const { url, apiKey, appName, appVersion, environment, samplingRate, persistent, storageKey } = cfg;

  if (!shouldSample(samplingRate, persistent, storageKey)) {
    return;
  }

  try {
    const faroPkg = await import('@grafana/faro-web-sdk');
    const tracingPkg = await import('@grafana/faro-web-tracing');

    const { getWebInstrumentations, initializeFaro } = faroPkg;
    const { TracingInstrumentation } = tracingPkg;

    initializeFaro({
      url,
      apiKey,
      app: { name: appName, version: appVersion, environment },
      instrumentations: [...getWebInstrumentations(), new TracingInstrumentation()],
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Faro init failed', err);
  }
}
