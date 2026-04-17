import { reportWebVital } from '@/lib/observability/webVitals';
import { trackWebVital } from '$lib/observability/faro';
import type { Metric } from 'web-vitals';

vi.mock('$lib/observability/faro', () => ({
  trackWebVital: vi.fn(),
}));

const mockedTrackWebVital = vi.mocked(trackWebVital);

const metric: Metric = {
  name: 'LCP',
  value: 1234,
  rating: 'good',
  delta: 1234,
  entries: [],
  id: 'metric-1',
  navigationType: 'navigate',
} as Metric;

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(globalThis, 'navigator', {
    value: {
      sendBeacon: vi.fn(),
    },
    configurable: true,
  });
});

test('reports vitals through observability helper without using sendBeacon', () => {
  reportWebVital(metric, '/blog/example-post', false);

  expect(mockedTrackWebVital).toHaveBeenCalledWith({
    name: 'LCP',
    value: 1234,
    rating: 'good',
    id: 'metric-1',
    url: '/blog/example-post',
  });
  expect(globalThis.navigator.sendBeacon).not.toHaveBeenCalled();
});

test('skips production reporting in dev mode', () => {
  const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => undefined);

  reportWebVital(metric, '/blog/example-post', true);

  expect(mockedTrackWebVital).not.toHaveBeenCalled();
  expect(globalThis.navigator.sendBeacon).not.toHaveBeenCalled();
  expect(debugSpy).toHaveBeenCalledWith('[web-vitals]', 'LCP', 1234, 'good');

  debugSpy.mockRestore();
});
