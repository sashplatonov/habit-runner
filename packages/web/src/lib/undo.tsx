import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { UndoToast } from '@/components/UndoToast';

type UndoAction = {
  message: string;
  actionLabel?: string;
  onUndo?: () => void | Promise<void>;
};

const UndoContext = createContext<{ push: (action: UndoAction) => void } | null>(null);

export function UndoProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<UndoAction | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const push = useCallback((action: UndoAction) => {
    clearTimer();
    setCurrent(action);
    timerRef.current = setTimeout(() => {
      setCurrent(null);
      timerRef.current = null;
    }, 5200);
  }, [clearTimer]);

  const handleClose = useCallback(() => {
    clearTimer();
    setCurrent(null);
  }, [clearTimer]);

  const wrappedOnUndo = useMemo(
    () =>
      current?.onUndo
        ? async () => {
            clearTimer();
            setCurrent(null);
            await current.onUndo?.();
          }
        : undefined,
    [current, clearTimer]
  );

  return (
    <UndoContext.Provider value={{ push }}>
      {children}
      {current && wrappedOnUndo && (
        <UndoToast
          message={current.message}
          actionLabel={current.actionLabel}
          onAction={wrappedOnUndo}
          onClose={handleClose}
        />
      )}
      {current && !wrappedOnUndo && (
        <UndoToast
          message={current.message}
          onClose={handleClose}
        />
      )}
    </UndoContext.Provider>
  );
}

export function useUndo() {
  const context = useContext(UndoContext);
  if (!context) {
    throw new Error('useUndo must be used within UndoProvider');
  }
  return context;
}
