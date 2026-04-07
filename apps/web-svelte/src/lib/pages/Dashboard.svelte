<script lang="ts">
  import { goto } from '$app/navigation';
  import { Plus } from 'lucide-svelte';
  import { habitsStore, toggleCompletion, updateHabit, getTodayCompletionRate } from '$lib/stores/habitsStore';
  import { undoStore } from '$lib/stores/undoStore';
  import { db, removePendingReminder, getPendingReminders } from '$lib/storage/db';
  import { formatDate } from '$lib/habits/habitStats';
  import { isMandatoryToday } from '$lib/habits/schedule';
  import { formatHabitLabel } from '$lib/habits/formatHabitLabel';
  import { filterAndSortHabits, calculateOverallStreak, getAllTags, exportHabitsCsv, reorderHabits } from '$lib/dashboard/dashboardHelpers';
  import type { DashboardFilter } from '$lib/dashboard/dashboardHelpers';
  import type { Habit } from '$lib/types/habit';
  import type { ViewDensity } from './dashboard/FilterBar.svelte';

  import DashboardHero from './dashboard/DashboardHero.svelte';
  import RemindersPanel from './dashboard/RemindersPanel.svelte';
  import FilterBar from './dashboard/FilterBar.svelte';
  import HabitListSection from './dashboard/HabitListSection.svelte';
  import Onboarding from '$lib/components/Onboarding.svelte';

  // --- State ---
  let filter = $state<DashboardFilter>('all');
  let searchQuery = $state('');
  let selectedTags = $state<string[]>([]);
  let sortMode = $state<'custom' | 'smart'>('custom');
  let viewDensity = $state<ViewDensity>('compact');
  let heroCollapsed = $state(false);

  // Reminders
  type Reminder = { id: string; habitId: string; time: string; message: string };
  let reminders = $state<Reminder[]>([]);

  // Drag-and-drop
  let draggedHabitId = $state<string | null>(null);
  let dragOverHabitId = $state<string | null>(null);
  let dropHintPosition = $state<'above' | 'below' | null>(null);

  // --- Derived from store ---
  const habits = $derived($habitsStore);
  const today = $derived(formatDate(new Date()));
  const todayDate = $derived.by(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });

  const activeHabits = $derived(habits.filter((h) => !h.archived));
  const totalActive = $derived(
    activeHabits.filter((h) => isMandatoryToday(h, todayDate)).length
  );
  const completedToday = $derived(
    activeHabits.filter((h) => {
      if (!isMandatoryToday(h, todayDate)) return false;
      const target = Math.max(1, h.dailyTarget ?? 1);
      return (h.completions[today] ?? 0) >= target;
    }).length
  );
  const todayRate = $derived(totalActive > 0 ? Math.round((completedToday / totalActive) * 100) : 0);
  const overallStreak = $derived(calculateOverallStreak(habits));
  const daysSinceLastCompletion = $derived.by(() => {
    let min = Infinity;
    for (const h of activeHabits) {
      const keys = Object.keys(h.completions).filter((k) => (h.completions[k] ?? 0) > 0).sort().reverse();
      if (keys.length > 0) {
        const diff = Math.floor((Date.now() - new Date(keys[0]).getTime()) / 86400000);
        if (diff < min) min = diff;
      }
    }
    return min === Infinity ? 0 : min;
  });

  const allTags = $derived(getAllTags(habits));
  const allCheckins = $derived.by(() => {
    const merged: Record<string, number> = {};
    for (const h of habits) {
      for (const [k, v] of Object.entries(h.completions)) {
        merged[k] = (merged[k] ?? 0) + v;
      }
    }
    return merged;
  });

  const filteredHabits = $derived(
    filterAndSortHabits(habits, filter, searchQuery, selectedTags, sortMode, today)
  );

  const dateStr = $derived(
    new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  );

  const showOnboarding = $derived(habits.length === 0);

  // --- Reminder tracker ---
  $effect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    async function checkReminders() {
      const pending = await getPendingReminders();
      reminders = pending.map((r) => ({
        id: r.id,
        habitId: r.habitId,
        time: r.time,
        message: r.message
      }));
    }

    void checkReminders();
    interval = setInterval(() => void checkReminders(), 30_000);

    const onVisibility = () => { if (document.visibilityState === 'visible') void checkReminders(); };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  });

  // --- Handlers ---
  async function handleToggle(habit: Habit) {
    const result = await toggleCompletion(habit.id, today);
    if (result?.undo) {
      undoStore.push({
        label: `${formatHabitLabel(habit)} ${result.newCompleted ? 'completed' : 'undone'}`,
        execute: result.undo
      });
    }
  }

  function handleDetail(habit: Habit) {
    void goto(`/habit/${habit.id}`);
  }

  function handleExport() {
    exportHabitsCsv(habits);
  }

  function handleDismissReminder(reminderId: string) {
    void removePendingReminder(reminderId);
    reminders = reminders.filter((r) => r.id !== reminderId);
  }

  async function handleDisableReminder(habit: Habit) {
    await updateHabit(habit.id, { reminderTime: undefined });
    reminders = reminders.filter((r) => r.habitId !== habit.id);
  }

  function handleNavigateAdd() {
    void goto('/habit/new');
  }

  // --- Drag and Drop (desktop) ---
  function handleDragStart(habit: Habit, e: DragEvent) {
    if (sortMode !== 'custom') return;
    draggedHabitId = habit.id;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', habit.id);
    }
  }

  function handleDragOver(habit: Habit, e: DragEvent) {
    if (!draggedHabitId || habit.id === draggedHabitId || sortMode !== 'custom') return;
    e.preventDefault();
    dragOverHabitId = habit.id;
    const el = (e.currentTarget as HTMLElement).closest('[data-habit-id]');
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dropHintPosition = e.clientY < rect.top + rect.height / 2 ? 'above' : 'below';
  }

  function handleDrop(targetHabit: Habit, e: DragEvent) {
    e.preventDefault();
    if (!draggedHabitId || draggedHabitId === targetHabit.id || sortMode !== 'custom') return;
    const ordered = filteredHabits.filter((h) => !h.archived);
    void reorderHabits(ordered, draggedHabitId, targetHabit.id, dropHintPosition ?? 'below', db);
    resetDrag();
  }

  function handleDragEnd() {
    resetDrag();
  }

  function resetDrag() {
    draggedHabitId = null;
    dragOverHabitId = null;
    dropHintPosition = null;
  }

  // --- Touch drag ---
  let touchGhostEl: HTMLDivElement | undefined = $state();
  let touchStartY = 0;
  let touchCurrentHabitId: string | null = null;

  function handleTouchStart(habit: Habit, e: TouchEvent) {
    if (sortMode !== 'custom') return;
    touchCurrentHabitId = habit.id;
    draggedHabitId = habit.id;
    const touch = e.touches[0];
    touchStartY = touch.clientY;

    // Create ghost element
    const targetEl = (e.currentTarget as HTMLElement).closest('[data-habit-id]');
    if (!targetEl) return;
    const ghost = document.createElement('div');
    ghost.className = 'fixed z-[200] pointer-events-none opacity-80 rounded-xl border border-accent shadow-2xl bg-bg-secondary';
    const rect = targetEl.getBoundingClientRect();
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    ghost.style.left = `${rect.left}px`;
    ghost.style.top = `${rect.top}px`;
    ghost.textContent = habit.name;
    ghost.style.display = 'flex';
    ghost.style.alignItems = 'center';
    ghost.style.justifyContent = 'center';
    ghost.style.fontSize = '14px';
    ghost.style.fontWeight = '600';
    document.body.appendChild(ghost);
    touchGhostEl = ghost;

    const onTouchMove = (ev: TouchEvent) => {
      ev.preventDefault();
      const t = ev.touches[0];
      if (touchGhostEl) {
        touchGhostEl.style.top = `${t.clientY - 24}px`;
      }
      // Determine drop target
      const elBelow = document.elementFromPoint(t.clientX, t.clientY);
      const habitEl = elBelow?.closest('[data-habit-id]') as HTMLElement | null;
      if (habitEl) {
        const id = habitEl.dataset.habitId ?? null;
        dragOverHabitId = id !== touchCurrentHabitId ? id : null;
        if (dragOverHabitId) {
          const r = habitEl.getBoundingClientRect();
          dropHintPosition = t.clientY < r.top + r.height / 2 ? 'above' : 'below';
        }
      }
    };

    const onTouchEnd = () => {
      if (dragOverHabitId && touchCurrentHabitId && touchCurrentHabitId !== dragOverHabitId) {
        const ordered = filteredHabits.filter((h) => !h.archived);
        void reorderHabits(ordered, touchCurrentHabitId, dragOverHabitId, dropHintPosition ?? 'below', db);
      }
      if (touchGhostEl) {
        touchGhostEl.remove();
        touchGhostEl = undefined;
      }
      resetDrag();
      touchCurrentHabitId = null;
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };

    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
  }

  async function handleTemplateSelect(habits: Array<{ name: string; icon: string; type: string; frequency: string; tags: string[] }>) {
    const { addHabit } = await import('$lib/stores/habitsStore');
    for (const tmpl of habits) {
      await addHabit({
        name: tmpl.name,
        icon: tmpl.icon,
        type: (tmpl.type ?? 'boolean') as 'boolean' | 'numeric' | 'negative',
        frequency: (tmpl.frequency ?? 'daily') as 'daily' | 'weekly' | 'custom',
        tags: tmpl.tags ?? [],
        color: 'indigo'
      });
    }
  }
</script>

<div class="min-h-screen bg-bg-primary">
  {#if showOnboarding}
    <div class="flex items-center justify-center min-h-screen px-4">
      <Onboarding onTemplateSelect={handleTemplateSelect} />
    </div>
  {:else}
    <DashboardHero
      {dateStr}
      {todayRate}
      {completedToday}
      {totalActive}
      {overallStreak}
      {daysSinceLastCompletion}
      onExport={handleExport}
      bind:heroCollapsed
    />

    <RemindersPanel
      {reminders}
      habits={activeHabits}
      onToggle={handleToggle}
      onDismissReminder={handleDismissReminder}
      onDisableReminder={handleDisableReminder}
    />

    <FilterBar
      bind:filter
      {allTags}
      bind:selectedTags
      habits={activeHabits}
      today={today}
      bind:sortMode
      bind:viewDensity
      bind:searchQuery
    />

    <HabitListSection
      {filteredHabits}
      {filter}
      {viewDensity}
      {sortMode}
      {allCheckins}
      {draggedHabitId}
      {dragOverHabitId}
      {dropHintPosition}
      onToggle={handleToggle}
      onDetail={handleDetail}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
      onTouchStart={handleTouchStart}
      onNavigateAdd={handleNavigateAdd}
    />

    <!-- FAB -->
    <a
      href="/habit/new"
      class="fixed bottom-20 right-6 z-50 w-12 h-12 rounded-full bg-accent text-bg-primary shadow-lg flex items-center justify-center hover:bg-accent/90 transition-colors"
      aria-label="Add new habit"
    >
      <Plus size={22} />
    </a>
  {/if}
</div>
