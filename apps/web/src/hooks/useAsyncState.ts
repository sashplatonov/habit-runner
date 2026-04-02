import { useState, useCallback, useRef } from 'react';

// ---------------------------------------------------------------------------
// Shared async state hook — P1.2 standardisation
// ---------------------------------------------------------------------------
// Provides a unified { data, status, error } pattern for any async operation.
// Replaces ad-hoc { isLoading, data, error } triads scattered across pages.
//
// Usage:
//   const { data, status, error, run } = useAsyncState(() => fetchSomething());
//   // trigger manually:  run()
//   // status: 'idle' | 'loading' | 'success' | 'error'

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  status: AsyncStatus;
  error: string | null;
  /** True when status === 'loading' */
  isLoading: boolean;
  /** True when status === 'success' */
  isSuccess: boolean;
  /** True when status === 'error' */
  isError: boolean;
  /** Re-run the async function */
  run: (...args: unknown[]) => Promise<void>;
  /** Reset to idle */
  reset: () => void;
}

export function useAsyncState<T>(
  asyncFn: (...args: unknown[]) => Promise<T>
): AsyncState<T> {
  const [state, setState] = useState<{
    data: T | null;
    status: AsyncStatus;
    error: string | null;
  }>({ data: null, status: 'idle', error: null });

  // Track mounted state to prevent setState after unmount
  const mountedRef = useRef(true);
  useState(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  });

  const run = useCallback(async (...args: unknown[]) => {
    setState((prev) => ({ ...prev, status: 'loading', error: null }));
    try {
      const result = await asyncFn(...args);
      if (mountedRef.current) {
        setState({ data: result, status: 'success', error: null });
      }
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : String(err);
        setState((prev) => ({ ...prev, status: 'error', error: message }));
      }
    }
  }, [asyncFn]);

  const reset = useCallback(() => {
    setState({ data: null, status: 'idle', error: null });
  }, []);

  return {
    ...state,
    isLoading: state.status === 'loading',
    isSuccess: state.status === 'success',
    isError: state.status === 'error',
    run,
    reset
  };
}

