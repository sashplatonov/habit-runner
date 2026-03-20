import React from 'react';
import { HabitRow, HabitTile, DropIndicator } from './DashboardView.helpers';
import type { Habit } from '@/types/habit';
import type { DashboardViewProps, ViewDensity } from './DashboardHero';

const FILTER_EMPTY_STATES: Record<
  DashboardViewProps['filter'],
  { title: string; subtitle: string; emoji: string }
> = {
  pending: {
    title: 'All done for today!',
    subtitle: 'Enjoy the break or set up a new habit when you’re ready.',
    emoji: '🎉'
  },
  done: {
    title: 'No completed habits yet',
    subtitle: 'Complete a habit to track streaks and stats.',
    emoji: '✨'
  },
  all: {
    title: 'No habits yet',
    subtitle: 'Add your first habit to start building momentum.',
    emoji: '👋'
  },
  archived: {
    title: 'No archived habits',
    subtitle: 'Archive habits here once you want to pause them.',
    emoji: '🗂️'
  }
};

function EmptyHabitState({
  filter,
  selectedTags,
  navigate
}: Pick<DashboardViewProps, 'filter' | 'selectedTags' | 'navigate'>) {
  const emptyState = FILTER_EMPTY_STATES[filter];
  const message = selectedTags.length > 0
    ? `No habits match ${selectedTags.join(', ')} under this filter.`
    : emptyState.subtitle;

  return (
    <div className="max-w-2xl mx-auto py-16 flex flex-col items-center justify-center gap-3 text-center text-muted">
      <div className="text-4xl">{emptyState.emoji}</div>
      <h2 className="text-2xl font-semibold text-foreground">{emptyState.title}</h2>
      <p className="text-sm text-muted max-w-md">{message}</p>
      <button
        type="button"
        onClick={() => navigate('/habit/new')}
        className="px-5 py-2 rounded-2xl bg-accent text-white text-sm font-semibold uppercase tracking-widest transition hover:opacity-90"
      >
        Add a habit
      </button>
    </div>
  );
}

function GroupedHabitItems({
  selectedTags,
  filtered,
  renderHabitItem,
  listClassName,
  headingClassName
}: {
  selectedTags: string[];
  filtered: Habit[];
  renderHabitItem: (habit: Habit, key: string) => React.ReactNode;
  listClassName: string;
  headingClassName: string;
}) {
  if (selectedTags.length === 0) {
    return <>{filtered.map((habit) => renderHabitItem(habit, habit.id))}</>;
  }

  return (
    <>
      {selectedTags.map((tag) => {
        const habitsInTag = filtered.filter((habit) => habit.tags.includes(tag));
        if (habitsInTag.length === 0) {
          return null;
        }
        return (
          <div key={tag} className={listClassName}>
            <div className={headingClassName}>
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted">{tag}</h3>
            </div>
            {habitsInTag.map((habit) => renderHabitItem(habit, `${tag}-${habit.id}`))}
          </div>
        );
      })}
    </>
  );
}

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
  handleTouchStart,
  navigate,
  selectedTags,
  viewDensity,
  filter
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
  | 'handleTouchStart'
  | 'navigate'
  | 'selectedTags'
  | 'viewDensity'
  | 'filter'
>) {
  if (filtered.length === 0) {
    return <EmptyHabitState filter={filter} selectedTags={selectedTags} navigate={navigate} />;
  }
  const isGrid = viewDensity === 'comfortable';
  let animationIndex = 0;

  const renderHabitItem = (habit: Habit, key: string) => {
    const index = animationIndex++;
    if (isGrid) {
      return (
        <HabitTile
          key={key}
          habit={habit}
          onToggle={() => { void handleToggle(habit); }}
          onDetail={() => navigate(`/habit/${habit.id}`)}
          appearanceIndex={index}
        />
      );
    }
    return (
      <HabitRowEntry
        key={key}
        habit={habit}
        dropHint={dropHint}
        dragOverHabitId={dragOverHabitId}
        draggedHabitId={draggedHabitId}
        handleToggle={handleToggle}
        handleDrop={handleDrop}
        handleDragStart={handleDragStart}
        handleDragOver={handleDragOver}
        handleDragEnd={handleDragEnd}
        handleTouchStart={handleTouchStart}
        navigate={navigate}
        viewDensity={viewDensity}
        appearanceIndex={index}
      />
    );
  };

  if (isGrid) {
    return (
      <div
        className="w-full max-w-6xl mx-auto py-3 px-4 sm:px-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
        role="list"
        aria-label="Habit list"
      >
        <GroupedHabitItems
          selectedTags={selectedTags}
          filtered={filtered}
          renderHabitItem={renderHabitItem}
          listClassName="col-span-full"
          headingClassName="flex items-center gap-2 px-1 mt-2 first:mt-0"
        />
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-2xl mx-auto py-3 flex flex-col px-4 sm:px-6"
      style={{ gap: '0.25rem' }}
      role="list"
      aria-label="Habit list"
    >
      <GroupedHabitItems
        selectedTags={selectedTags}
        filtered={filtered}
        renderHabitItem={renderHabitItem}
        listClassName="space-y-1 mb-3"
        headingClassName="flex items-center gap-2 px-1"
      />
    </div>
  );
}

type HabitRowEntryProps = {
  habit: Habit;
  dropHint: { habitId: string; position: 'above' | 'below' } | null;
  dragOverHabitId: string | null;
  draggedHabitId: string | null;
  handleToggle: (habit: Habit) => Promise<void>;
  handleDrop: (event: React.DragEvent<HTMLDivElement>, habitId: string) => Promise<void>;
  handleDragStart: (event: React.DragEvent<HTMLDivElement>, habitId: string) => void;
  handleDragOver: (event: React.DragEvent<HTMLDivElement>, habitId: string) => void;
  handleDragEnd: () => void;
  handleTouchStart: (event: React.TouchEvent, habitId: string) => void;
  navigate: (to: string) => void;
  viewDensity: ViewDensity;
  appearanceIndex: number;
};

function HabitRowEntry({
  habit,
  dropHint,
  dragOverHabitId,
  draggedHabitId,
  handleToggle,
  handleDrop,
  handleDragStart,
  handleDragOver,
  handleDragEnd,
  handleTouchStart,
  navigate,
  viewDensity,
  appearanceIndex
}: HabitRowEntryProps) {
  const dropHintPosition = dropHint?.habitId === habit.id ? dropHint.position : null;
  const isDragging = draggedHabitId === habit.id;
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
        onTouchStart={(event) => handleTouchStart(event, habit.id)}
        isDropTarget={dragOverHabitId === habit.id}
        isDragging={isDragging}
        dropHintPosition={dropHintPosition}
        viewDensity={viewDensity}
        appearanceIndex={appearanceIndex}
      />
      {showDropBelow && <DropIndicator />}
    </React.Fragment>
  );
}
