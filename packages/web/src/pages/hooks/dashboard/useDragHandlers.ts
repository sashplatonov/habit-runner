import { useCallback, useState } from 'react';
import type { DragEvent } from 'react';
import type { Habit } from '@/types/habit';

export function useDragHandlers(habits: Habit[], applyOrder: (orderedHabits: Habit[]) => Promise<void>) {
  const [draggedHabitId, setDraggedHabitId] = useState<string | null>(null);
  const [dragOverHabitId, setDragOverHabitId] = useState<string | null>(null);
  const [dropHint, setDropHint] = useState<{ habitId: string; position: 'above' | 'below' } | null>(null);

  const handleDragStart = useCallback((event: DragEvent<HTMLDivElement>, habitId: string) => {
    event.dataTransfer?.setData('text/plain', habitId);
    event.dataTransfer?.setDragImage(new Image(), 0, 0);
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

      const original = [...habits];
      const sourceIndex = original.findIndex((habit) => habit.id === draggedHabitId);
      const targetIndex = original.findIndex((habit) => habit.id === habitId);
      if (sourceIndex === -1 || targetIndex === -1) {
        setDragOverHabitId(null);
        setDraggedHabitId(null);
        return;
      }

      const position =
        dropHint?.habitId === habitId
          ? dropHint.position
          : (() => {
              const bounds = event.currentTarget.getBoundingClientRect();
              const midpoint = bounds.top + bounds.height / 2;
              return event.clientY < midpoint ? 'above' : 'below';
            })();

      const ordered = [...original];
      const [moved] = ordered.splice(sourceIndex, 1);
      let insertIndex = targetIndex + (position === 'below' ? 1 : 0);
      if (sourceIndex < insertIndex) {
        insertIndex = Math.max(0, insertIndex - 1);
      }
      insertIndex = Math.max(0, Math.min(ordered.length, insertIndex));
      ordered.splice(insertIndex, 0, moved);
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

  return {
    dropHint,
    dragOverHabitId,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    draggedHabitId
  };
}
