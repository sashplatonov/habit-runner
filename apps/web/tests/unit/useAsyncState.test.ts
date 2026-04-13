import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { useAsyncState } from '@/hooks/useAsyncState';

// ---------------------------------------------------------------------------
// P3.1: useAsyncState hook tests
// ---------------------------------------------------------------------------

describe('useAsyncState', () => {
  it('starts in idle state', () => {
    const { result } = renderHook(() => useAsyncState(async () => 'value'));
    expect(result.current.status).toBe('idle');
    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('transitions to loading then success', async () => {
    const fn = vi.fn().mockResolvedValue('hello');
    const { result } = renderHook(() => useAsyncState(fn));

    let runPromise: Promise<void>;
    act(() => {
      runPromise = result.current.run();
    });
    expect(result.current.status).toBe('loading');
    expect(result.current.isLoading).toBe(true);

    await act(async () => { await runPromise; });
    expect(result.current.status).toBe('success');
    expect(result.current.data).toBe('hello');
    expect(result.current.isSuccess).toBe(true);
  });

  it('transitions to error state on rejection', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useAsyncState(fn));

    await act(async () => { await result.current.run(); });
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('boom');
    expect(result.current.isError).toBe(true);
  });

  it('resets back to idle', async () => {
    const fn = vi.fn().mockResolvedValue(42);
    const { result } = renderHook(() => useAsyncState(fn));

    await act(async () => { await result.current.run(); });
    expect(result.current.status).toBe('success');

    act(() => { result.current.reset(); });
    expect(result.current.status).toBe('idle');
    expect(result.current.data).toBeNull();
  });
});


