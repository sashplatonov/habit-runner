import { useCallback, useState, useRef, useEffect } from 'react';
import type { DragEvent } from 'react';
import type { Habit } from '@/types/habit';

type DropHint = { habitId: string; position: 'above' | 'below' } | null;

function reorderHabits(
  habits: Habit[],
  sourceId: string,
  targetId: string,
  position: 'above' | 'below'
): Habit[] | null {
  const sourceIndex = habits.findIndex((habit) => habit.id === sourceId);
  const targetIndex = habits.findIndex((habit) => habit.id === targetId);
  if (sourceIndex === -1 || targetIndex === -1) {
    return null;
  }

  const ordered = [...habits];
  const [moved] = ordered.splice(sourceIndex, 1);
  let insertIndex = targetIndex + (position === 'below' ? 1 : 0);
  if (sourceIndex < insertIndex) {
    insertIndex = Math.max(0, insertIndex - 1);
  }
  insertIndex = Math.max(0, Math.min(ordered.length, insertIndex));
  ordered.splice(insertIndex, 0, moved);
  return ordered;
}

function getDropPosition(clientY: number, element: HTMLElement): 'above' | 'below' {
  const bounds = element.getBoundingClientRect();
  return clientY < bounds.top + bounds.height / 2 ? 'above' : 'below';
}

function buildTouchGhost(row: HTMLElement): HTMLDivElement {
  const rect = row.getBoundingClientRect();
  const ghost = row.cloneNode(true) as HTMLDivElement;
  Object.assign(ghost.style, {
    position: 'fixed',
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    pointerEvents: 'none',
    zIndex: '9999',
    opacity: '0.92',
    transform: 'scale(1.04) rotate(-0.8deg)',
    boxShadow: '0 16px 48px rgba(0,0,0,0.55)',
    transition: 'none',
    borderRadius: '0.75rem'
  });
  document.body.appendChild(ghost);
  return ghost;
}

function useTouchDragEvents({
  draggedHabitId,
  applyOrder,
  cleanupGhost,
  habitsRef,
  ghostRef,
  touchOriginY,
  touchOriginTop,
  touchDraggedId,
  touchDropHintRef,
  setDraggedHabitId,
  setDragOverHabitId,
  setDropHint
}: {
  draggedHabitId: string | null;
  applyOrder: (orderedHabits: Habit[]) => Promise<void>;
  cleanupGhost: () => void;
  habitsRef: React.MutableRefObject<Habit[]>;
  ghostRef: React.MutableRefObject<HTMLDivElement | null>;
  touchOriginY: React.MutableRefObject<number>;
  touchOriginTop: React.MutableRefObject<number>;
  touchDraggedId: React.MutableRefObject<string | null>;
  touchDropHintRef: React.MutableRefObject<DropHint>;
  setDraggedHabitId: React.Dispatch<React.SetStateAction<string | null>>;
  setDragOverHabitId: React.Dispatch<React.SetStateAction<string | null>>;
  setDropHint: React.Dispatch<React.SetStateAction<DropHint>>;
}) {
  useEffect(() => {
    if (!draggedHabitId) {
      return;
    }

    const onMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];

      if (ghostRef.current) {
        const delta = touch.clientY - touchOriginY.current;
        ghostRef.current.style.top = `${touchOriginTop.current + delta}px`;
      }

      if (ghostRef.current) {
        ghostRef.current.style.visibility = 'hidden';
      }
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      if (ghostRef.current) {
        ghostRef.current.style.visibility = '';
      }

      const row = el?.closest('[data-habit-id]');
      if (row) {
        const targetId = row.getAttribute('data-habit-id');
        if (targetId && targetId !== touchDraggedId.current) {
          const position = getDropPosition(touch.clientY, row as HTMLElement);
          const hint = { habitId: targetId, position } as const;
          touchDropHintRef.current = hint;
          setDropHint(hint);
          setDragOverHabitId(targetId);
          return;
        }
      }

      touchDropHintRef.current = null;
      setDropHint(null);
      setDragOverHabitId(null);
    };

    const onEnd = async () => {
      cleanupGhost();
      const id = touchDraggedId.current;
      const hint = touchDropHintRef.current;

      setDraggedHabitId(null);
      setDragOverHabitId(null);
      setDropHint(null);
      touchDraggedId.current = null;
      touchDropHintRef.current = null;

      if (!id || !hint) {
        return;
      }

      const ordered = reorderHabits(habitsRef.current, id, hint.habitId, hint.position);
      if (!ordered) {
        return;
      }
      await applyOrder(ordered);
    };

    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
    document.addEventListener('touchcancel', onEnd);

    return () => {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onEnd);
      cleanupGhost();
    };
  }, [
    applyOrder,
    cleanupGhost,
    draggedHabitId,
    ghostRef,
    habitsRef,
    setDragOverHabitId,
    setDraggedHabitId,
    setDropHint,
    touchDraggedId,
    touchDropHintRef,
    touchOriginTop,
    touchOriginY
  ]);
}

export function useDragHandlers(habits: Habit[], applyOrder: (orderedHabits: Habit[]) => Promise<void>) {
  const [draggedHabitId, setDraggedHabitId] = useState<string | null>(null);
  const [dragOverHabitId, setDragOverHabitId] = useState<string | null>(null);
  const [dropHint, setDropHint] = useState<DropHint>(null);

  // Keep stable refs for use inside document-level touch handlers
  const habitsRef = useRef(habits);
  useEffect(() => { habitsRef.current = habits; }, [habits]);

  const ghostRef = useRef<HTMLDivElement | null>(null);
  const touchOriginY = useRef(0);
  const touchOriginTop = useRef(0);
  const touchDraggedId = useRef<string | null>(null);
  const touchDropHintRef = useRef<DropHint>(null);

  const cleanupGhost = useCallback(() => {
    if (ghostRef.current) {
      ghostRef.current.remove();
      ghostRef.current = null;
    }
  }, []);

  // ─── Desktop drag handlers ──────────────────────────────────────────────────

  const handleDragStart = useCallback((event: DragEvent<HTMLDivElement>, habitId: string) => {
    event.dataTransfer?.setData('text/plain', habitId);
    // Let the browser render its own drag ghost (visible feedback)
    setDraggedHabitId(habitId);
    setDropHint(null);
  }, []);

  const handleDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>, habitId: string) => {
      event.preventDefault();
      if (!draggedHabitId || draggedHabitId === habitId) {
        setDropHint(null);
        setDragOverHabitId(null);
        return;
      }
      const bounds = event.currentTarget.getBoundingClientRect();
      const midpoint = bounds.top + bounds.height / 2;
      const position = event.clientY < midpoint ? 'above' : 'below';
      setDropHint({ habitId, position });
      setDragOverHabitId(habitId);
    },
    [draggedHabitId]
  );

  const handleDrop = useCallback(
    async (event: DragEvent<HTMLDivElement>, habitId: string) => {
      event.preventDefault();
      if (!draggedHabitId || draggedHabitId === habitId) {
        setDragOverHabitId(null);
        setDraggedHabitId(null);
        return;
      }

      const position = dropHint?.habitId === habitId
        ? dropHint.position
        : getDropPosition(event.clientY, event.currentTarget);
      const ordered = reorderHabits(habits, draggedHabitId, habitId, position);
      if (!ordered) {
        setDragOverHabitId(null);
        setDraggedHabitId(null);
        return;
      }
      await applyOrder(ordered);

      setDragOverHabitId(null);
      setDraggedHabitId(null);
      setDropHint(null);
    },
    [applyOrder, draggedHabitId, habits, dropHint]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedHabitId(null);
    setDragOverHabitId(null);
    setDropHint(null);
  }, []);

  // ─── Touch drag handlers ────────────────────────────────────────────────────

  const handleTouchStart = useCallback((event: React.TouchEvent, habitId: string) => {
    event.preventDefault(); // prevent scroll while dragging on the grip
    const touch = event.touches[0];
    const row = (event.currentTarget as HTMLElement).closest('[data-habit-id]') as HTMLElement | null;
    if (!row) {return;}

    touchDraggedId.current = habitId;
    touchDropHintRef.current = null;
    touchOriginY.current = touch.clientY;
    const rect = row.getBoundingClientRect();
    touchOriginTop.current = rect.top;

    setDraggedHabitId(habitId);
    setDropHint(null);
    setDragOverHabitId(null);

    ghostRef.current = buildTouchGhost(row);
  }, []);

  useTouchDragEvents({
    draggedHabitId,
    applyOrder,
    cleanupGhost,
    habitsRef,
    ghostRef,
    touchOriginY,
    touchOriginTop,
    touchDraggedId,
    touchDropHintRef,
    setDraggedHabitId,
    setDragOverHabitId,
    setDropHint
  });

  return {
    dropHint,
    dragOverHabitId,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    handleTouchStart,
    draggedHabitId
  };
}
