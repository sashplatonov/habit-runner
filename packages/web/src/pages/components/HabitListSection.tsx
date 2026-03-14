import React from 'react';
import { HabitRow, DropIndicator } from './DashboardView.helpers';
import type { Habit } from '@/types/habit';
import type { DashboardViewProps } from './DashboardHero';

export function HabitListSection({
  filtered,
  dropHint,
  dragOverHabitId,
  draggedHabitId,
  handleToggle,
  handleDrop,
  handleDragStart,
  handleDragOver,
  handleDragEnd,
  navigate,
  reorderMode,
  moveHabit,
  selectedTags
}: Pick<
  DashboardViewProps,
  | 'filtered'
  | 'dropHint'
  | 'dragOverHabitId'
  | 'draggedHabitId'
  | 'handleToggle'
  | 'handleDrop'
  | 'handleDragStart'
  | 'handleDragOver'
  | 'handleDragEnd'
  | 'navigate'
  | 'reorderMode'
  | 'moveHabit'
  | 'selectedTags'
>) {
  if (filtered.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-muted flex flex-col items-center justify-center">
        <div className="text-4xl mb-3">✓</div>
        <p className="font-mono text-sm">All habits are currently paused</p>
      </div>
    );
  }
  return (
    <div className="max-w-2xl mx-auto py-3 flex flex-col gap-2 px-4" role="list" aria-label="Habit list">
      {selectedTags.length > 0 ? (
        selectedTags.map((tag) => {
          const habitsInTag = filtered.filter((h) => h.tags.includes(tag));
          if (habitsInTag.length === 0) {return null;}
          return (
            <div key={tag} className="space-y-2 mb-4">
              <div className="flex items-center gap-2 px-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted">{tag}</h3>
              </div>
              {habitsInTag.map((habit, index) => (
                <HabitRowEntry
                  key={`${tag}-${habit.id}`}
                  habit={habit}
                  index={index}
                  filteredLength={habitsInTag.length}
                  dropHint={dropHint}
                  dragOverHabitId={dragOverHabitId}
                  draggedHabitId={draggedHabitId}
                  handleToggle={handleToggle}
                  handleDrop={handleDrop}
                  handleDragStart={handleDragStart}
                  handleDragOver={handleDragOver}
                  handleDragEnd={handleDragEnd}
                  navigate={navigate}
                  reorderMode={reorderMode}
                  moveHabit={moveHabit}
                />
              ))}
            </div>
          );
        })
      ) : (
        filtered.map((habit, index) => (
          <HabitRowEntry
            key={habit.id}
            habit={habit}
            index={index}
            filteredLength={filtered.length}
            dropHint={dropHint}
            dragOverHabitId={dragOverHabitId}
            draggedHabitId={draggedHabitId}
            handleToggle={handleToggle}
            handleDrop={handleDrop}
            handleDragStart={handleDragStart}
            handleDragOver={handleDragOver}
            handleDragEnd={handleDragEnd}
            navigate={navigate}
            reorderMode={reorderMode}
            moveHabit={moveHabit}
          />
        ))
      )}
    </div>
  );
}

type HabitRowEntryProps = {
  habit: Habit;
  index: number;
  filteredLength: number;
  dropHint: { habitId: string; position: 'above' | 'below' } | null;
  dragOverHabitId: string | null;
  draggedHabitId: string | null;
  handleToggle: (habit: Habit) => Promise<void>;
  handleDrop: (event: React.DragEvent<HTMLDivElement>, habitId: string) => Promise<void>;
  handleDragStart: (event: React.DragEvent<HTMLDivElement>, habitId: string) => void;
  handleDragOver: (event: React.DragEvent<HTMLDivElement>, habitId: string) => void;
  handleDragEnd: () => void;
  navigate: (to: string) => void;
  reorderMode: boolean;
  moveHabit: (habitId: string, direction: 'up' | 'down') => Promise<void>;
};

function HabitRowEntry({
  habit,
  index,
  filteredLength,
  dropHint,
  dragOverHabitId,
  draggedHabitId,
  handleToggle,
  handleDrop,
  handleDragStart,
  handleDragOver,
  handleDragEnd,
  navigate,
  reorderMode,
  moveHabit
}: HabitRowEntryProps) {
  const dropHintPosition = dropHint?.habitId === habit.id ? dropHint.position : null;
  const isDragging = draggedHabitId === habit.id;
  const canMoveUp = reorderMode && index > 0;
  const canMoveDown = reorderMode && index < filteredLength - 1;
  const showDropAbove = dropHintPosition === 'above';
  const showDropBelow = dropHintPosition === 'below';

  return (
    <React.Fragment>
      {showDropAbove && <DropIndicator />}
      <HabitRow
        habit={habit}
        onToggle={() => {
          void handleToggle(habit);
        }}
        onDetail={() => navigate(`/habit/${habit.id}`)}
        onDragStart={(event) => handleDragStart(event, habit.id)}
        onDragOver={(event) => handleDragOver(event, habit.id)}
        onDrop={(event) => {
          void handleDrop(event, habit.id);
        }}
        onDragEnd={handleDragEnd}
        isDropTarget={dragOverHabitId === habit.id}
        isDragging={isDragging}
        dropHintPosition={dropHintPosition}
        reorderMode={reorderMode}
        onMoveUp={canMoveUp ? () => void moveHabit(habit.id, 'up') : undefined}
        onMoveDown={canMoveDown ? () => void moveHabit(habit.id, 'down') : undefined}
        disableMoveUp={!canMoveUp}
        disableMoveDown={!canMoveDown}
      />
      {showDropBelow && <DropIndicator />}
    </React.Fragment>
  );
}
