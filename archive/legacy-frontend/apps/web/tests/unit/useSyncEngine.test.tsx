import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('@/lib/sync/syncEngine', () => ({
  runSyncCycle: vi.fn()
}));

import { runSyncCycle } from '@/lib/sync/syncEngine';
import { useSyncEngine } from '@/hooks/useSyncEngine';

// RTL v14+ removed waitForNextUpdate; use act + vi.advanceTimersByTimeAsync.
describe('useSyncEngine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes syncing and calls runSyncCycle when online', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    (runSyncCycle as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 'idle',
      pending: 0,
      conflicts: 0
    });

    const { result } = renderHook(() => useSyncEngine(true));
    // initial status is syncing (set before runSyncCycle resolves)
    expect(result.current.status).toBe('syncing');

    // advance enough for the promise microtasks to flush, but not to trigger the 30s interval
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });

    expect(runSyncCycle).toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });

  it('sets offline when navigator offline', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    const { result } = renderHook(() => useSyncEngine(true));
    expect(result.current.status).toBe('offline');
  });

  it('syncNow triggers runSyncCycle', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    (runSyncCycle as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 'idle',
      pending: 0,
      conflicts: 0
    });
    const { result } = renderHook(() => useSyncEngine(true));

    // let initial sync settle
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });

    (runSyncCycle as ReturnType<typeof vi.fn>).mockClear();

    await act(async () => {
      await result.current.syncNow();
    });

    expect(runSyncCycle).toHaveBeenCalledTimes(1);
  });
});
