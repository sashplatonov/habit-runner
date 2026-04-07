<script lang="ts">
  import { Plus, Calendar, Inbox, Archive } from 'lucide-svelte';
  import HabitRow from './HabitRow.svelte';
  import HabitTile from './HabitTile.svelte';
  import type { Habit } from '$lib/types/habit';
  import type { ViewDensity } from './FilterBar.svelte';
  import type { DashboardFilter } from '$lib/dashboard/dashboardHelpers';

  type DropHintPosition = 'above' | 'below' | null;

  let {
    filteredHabits,
    filter,
    viewDensity,
    sortMode,
    allCheckins,
    draggedHabitId,
    dragOverHabitId,
    dropHintPosition,
    onToggle,
    onDetail,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    onTouchStart,
    onNavigateAdd
  }: {
    filteredHabits: Habit[];
    filter: DashboardFilter;
    viewDensity: ViewDensity;
    sortMode: 'custom' | 'smart';
    allCheckins: Record<string, number>;
    draggedHabitId: string | null;
    dragOverHabitId: string | null;
    dropHintPosition: DropHintPosition;
    onToggle: (habit: Habit) => void;
    onDetail: (habit: Habit) => void;
    onDragStart: (habit: Habit, e: DragEvent) => void;
    onDragOver: (habit: Habit, e: DragEvent) => void;
    onDrop: (habit: Habit, e: DragEvent) => void;
    onDragEnd: () => void;
    onTouchStart: (habit: Habit, e: TouchEvent) => void;
    onNavigateAdd: () => void;
  } = $props();

  const FILTER_EMPTY: Record<DashboardFilter, { icon: typeof Inbox; title: string; subtitle: string }> = {
    pending: { icon: Calendar, title: 'All done for now', subtitle: 'Nothing left pending today' },
    all: { icon: Inbox, title: 'No habits yet', subtitle: 'Create your first habit to get started' },
    done: { icon: Calendar, title: 'Nothing completed today', subtitle: 'Complete a habit and it will appear here' },
    archived: { icon: Archive, title: 'No archived habits', subtitle: 'Archived habits will appear here' }
  };

  const emptyInfo = $derived(FILTER_EMPTY[filter]);

  // Group by tag when filter is 'all' and sort is 'custom'
  const groupByTag = $derived(filter === 'all' && sortMode === 'custom');

  type GroupedHabits = Array<{ tag: string | null; habits: Habit[] }>;

  const groups: GroupedHabits = $derived.by(() => {
    if (!groupByTag || filteredHabits.length === 0) return [{ tag: null, habits: filteredHabits }];
    const tagMap = new Map<string, Habit[]>();
    const untagged: Habit[] = [];
    for (const h of filteredHabits) {
      if (h.tags.length === 0) { untagged.push(h); continue; }
      // Put in first tag group
      const first = h.tags[0];
      if (!tagMap.has(first)) tagMap.set(first, []);
      tagMap.get(first)!.push(h);
    }
    const result: GroupedHabits = [];
    for (const [tag, habits] of tagMap) result.push({ tag, habits });
    if (untagged.length > 0) result.push({ tag: null, habits: untagged });
    return result;
  });
</script>

<div class="max-w-2xl mx-auto px-4 pt-4 pb-32">
  {#if filteredHabits.length === 0}
    <div class="flex flex-col items-center justify-center py-16 text-center animate-fade-slide-up">
      <div class="w-14 h-14 rounded-2xl border border-border bg-bg-secondary flex items-center justify-center mb-3">
        <svelte:component this={emptyInfo.icon} size={24} class="text-muted" />
      </div>
      <p class="text-sm font-semibold text-foreground mb-1">{emptyInfo.title}</p>
      <p class="text-xs font-mono text-muted mb-4">{emptyInfo.subtitle}</p>
      {#if filter === 'all'}
        <button
          type="button"
          onclick={onNavigateAdd}
          class="px-4 py-2 rounded-xl border border-accent bg-accent/10 text-accent text-xs font-mono uppercase tracking-wider hover:bg-accent/20 transition-colors flex items-center gap-1.5"
        >
          <Plus size={14} /> Add first habit
        </button>
      {/if}
    </div>
  {:else}
    {#each groups as group}
      {#if groupByTag && group.tag}
        <div class="mb-2 mt-4 first:mt-0">
          <h3 class="text-[10px] font-mono text-muted uppercase tracking-widest px-2">#{group.tag}</h3>
        </div>
      {/if}
      {#if viewDensity === 'comfortable'}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {#each group.habits as habit, index (habit.id)}
            <HabitTile
              {habit}
              onToggle={() => onToggle(habit)}
              onDetail={() => onDetail(habit)}
              {allCheckins}
              appearanceIndex={index}
            />
          {/each}
        </div>
      {:else}
        <div role="list" class="space-y-0.5">
          {#each group.habits as habit, index (habit.id)}
            <HabitRow
              {habit}
              onToggle={() => onToggle(habit)}
              onDetail={() => onDetail(habit)}
              onDragStart={(e) => onDragStart(habit, e)}
              onDragOver={(e) => onDragOver(habit, e)}
              onDrop={(e) => onDrop(habit, e)}
              onDragEnd={onDragEnd}
              onTouchStart={(e) => onTouchStart(habit, e)}
              isDragging={draggedHabitId === habit.id}
              isDropTarget={dragOverHabitId === habit.id}
              dropHintPosition={dragOverHabitId === habit.id ? dropHintPosition : null}
              appearanceIndex={index}
            />
          {/each}
        </div>
      {/if}
    {/each}
  {/if}
</div>
