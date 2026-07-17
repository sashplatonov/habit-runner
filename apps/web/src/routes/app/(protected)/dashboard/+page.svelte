<script lang="ts">
  type ConfettiFn = typeof import('canvas-confetti');

  // canvas-confetti is browser-only. Load it lazily to avoid SSR import errors.
  let confetti: ConfettiFn | null = null;

  async function getConfetti() {
    if (confetti) {
      return confetti;
    }

    const mod = await import('canvas-confetti') as ConfettiFn & { default?: ConfettiFn };
    confetti = mod.default ?? mod;
    return confetti;
  }
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import HabitTile from '$lib/components/HabitTile.svelte';
  import Onboarding from '$lib/components/Onboarding.svelte';
  import RemindersPanel from '$lib/components/RemindersPanel.svelte';
  import TodaySummary from '$lib/components/dashboard/TodaySummary.svelte';
  import DashboardToolbar from '$lib/components/dashboard/DashboardToolbar.svelte';
  import HabitCompactRow from '$lib/components/dashboard/HabitCompactRow.svelte';
  import type { OnboardingTemplate } from '$lib/components/onboarding';
  import { readDashboardStateFromURL, updateDashboardURL } from '$lib/dashboard/urlState';
  import { buildTodaySummary } from '$lib/dashboard/todaySummary';
  import { normalizeDashboardFilter, shouldShowDashboardOnboarding, type DashboardFilter } from '$lib/dashboard/viewState';
  import { formatAppDate } from '@/lib/i18n';
  import {
    calculateScheduledStreak,
    getScheduleStatusForDate,
    isMandatoryToday
  } from '$lib/habits/schedule';
  import { buildCelebrationParticles, getCelebrationLabel, type CelebrationParticle } from '$lib/habits/completionCelebration';
  import { formatDate, getDaysSinceLastCompletion } from '$lib/habits/habitStats';
  import { habitsStore } from '$lib/stores/habits';
  import { HABIT_COLOR_THEMES } from '$lib/theme/habit-colors';
  import { isPhaseTransition } from '$lib/habits/phases';
  import { sortHabits } from '$lib/habits/dashboardSort';
  import { getHabitCompletionState } from '$lib/habits/completionState';
  import { logClientError } from '$lib/logging/clientLogger';
  import { formatHabitLabel } from '$lib/habits/formatHabitLabel';
  import type { Habit } from '@/types/habit';

  // ─── Types ────────────────────────────────────────────────────────────────────
  type SortMode = 'custom' | 'smart';
  type ViewDensity = 'comfortable' | 'compact';
  type DropHint = { habitId: string; position: 'above' | 'below' };
  type SwipeDirection = 'left' | 'right' | null;

  // ─── LocalStorage helpers ─────────────────────────────────────────────────────
  const LS_FILTER    = 'hr_dashboard_filter_v1';
  const LS_DENSITY   = 'hr_dashboard_density_v1';
  const LS_SORT      = 'hr_dashboard_sort_mode_v1';
  const LS_TAGS      = 'hr_dashboard_tags_v1';

  function lsGet<T>(key: string, fallback: T): T {
    if (typeof localStorage === 'undefined') { return fallback; }
    try {
      const v = localStorage.getItem(key);
      return v !== null ? (JSON.parse(v) as T) : fallback;
    } catch { return fallback; }
  }

  function lsSet(key: string, value: unknown) {
    if (typeof localStorage === 'undefined') { return; }
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }

  // ─── State ────────────────────────────────────────────────────────────────────
  let addingTemplate   = $state<string | null>(null);
  // Initialize from URL first, then localStorage as fallback
  const urlState = readDashboardStateFromURL();
  let filter           = $state<DashboardFilter>((urlState.filter as DashboardFilter) ?? lsGet<DashboardFilter>(LS_FILTER, 'pending'));
  let searchQuery      = $state(urlState.search ?? '');
  let sortMode         = $state<SortMode>((urlState.sort as SortMode) ?? lsGet<SortMode>(LS_SORT, 'custom'));
  let viewDensity      = $state<ViewDensity>((urlState.density as ViewDensity) ?? lsGet<ViewDensity>(LS_DENSITY, 'comfortable'));
  let selectedTags     = $state<string[]>(urlState.tags ? urlState.tags.split(',').map(t => t.trim()).filter(Boolean) : lsGet<string[]>(LS_TAGS, []));

  let animatingHabitId = $state<string | null>(null);
  let animParticles    = $state<CelebrationParticle[]>([]);
  let animLabel        = $state('');
  let pendingHabitIds  = $state<string[]>([]);
  let completionError  = $state<{ habitId: string; message: string } | null>(null);
  let particleCounter  = 0;
  let celebrationTimeout: number | null = null;

  let dragId     = $state<string | null>(null);
  let dragOverId = $state<string | null>(null);
  let dropHint   = $state<DropHint | null>(null);

  let swipeOffset      = $state(0);
  let swipeDirection   = $state<SwipeDirection>(null);
  let isSwipingGesture = $state(false);
  let touchDragId      = $state<string | null>(null);

  let swipeStartX = 0;
  let swipeStartY = 0;
  let swipeAxisLocked: boolean | null = null;
  let swipeTriggered = false;
  let touchDragGhost: HTMLDivElement | null = null;
  let touchDragOriginY = 0;
  let touchDragOriginTop = 0;

  // ─── Persist to localStorage ─────────────────────────────────────────────────
  $effect(() => { lsSet(LS_FILTER, filter); });
  $effect(() => { lsSet(LS_SORT, sortMode); });
  $effect(() => { lsSet(LS_DENSITY, viewDensity); });
  $effect(() => { lsSet(LS_TAGS, selectedTags); });

  // ─── Sync to URL ────────────────────────────────────────────────────
  $effect(() => {
    updateDashboardURL({
      filter: filter === 'pending' ? undefined : filter,
      search: searchQuery || undefined,
      tags: selectedTags.length > 0 ? selectedTags.join(',') : undefined,
      sort: sortMode === 'custom' ? undefined : sortMode,
      density: viewDensity === 'comfortable' ? undefined : viewDensity,
      collapsed: undefined
    });
  });

  // ─── Derived: dates ───────────────────────────────────────────────────────────
  const todayDate = $derived.by(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); });
  const todayKey  = $derived(formatDate(todayDate));
  const dateStr   = $derived(formatAppDate(todayDate, { weekday: 'long', month: 'short', day: 'numeric' }));

  function isHabitCompletedToday(habit: Habit, dateKey: string) {
    return getHabitCompletionState(habit, dateKey).completed;
  }

  // ─── Derived: habit lists ─────────────────────────────────────────────────────
  const activeHabits = $derived($habitsStore.habits);
  const archivedHabits = $derived($habitsStore.allHabits.filter((habit) => habit.archived));
  const totalHabits = $derived($habitsStore.allHabits.length);
  const isInitialHydration = $derived($habitsStore.isHydrating && !$habitsStore.hasHydrated);
  const showOnboarding = $derived(shouldShowDashboardOnboarding(totalHabits, $habitsStore.hasHydrated));

  const scheduledToday = $derived(activeHabits.filter((h) => isMandatoryToday(h, todayDate)));

  const completedTodayCount = $derived(
    scheduledToday.filter((h) => isHabitCompletedToday(h, todayKey)).length
  );

  const pendingCount = $derived(
    scheduledToday.filter((h) => !isHabitCompletedToday(h, todayKey)).length
  );

  const overallStreak = $derived.by(() => {
    if (activeHabits.length === 0) { return 0; }
    return Math.max(...activeHabits.map((h) => calculateScheduledStreak(h, h.completions).current));
  });

  // ─── More derived ────────────────────────────────────────────────────────────
  const daysSinceLast       = $derived(getDaysSinceLastCompletion(activeHabits));
  const nextPendingHabit = $derived(
    [...scheduledToday].sort((a, b) => sortHabits(a, b, sortMode, todayDate))
      .find((habit) => !isHabitCompletedToday(habit, todayKey)) ?? null
  );
  const todaySummary = $derived(
    buildTodaySummary({
      isHydrating: isInitialHydration,
      scheduledCount: scheduledToday.length,
      completedCount: completedTodayCount,
      bestStreak: overallStreak,
      daysSinceLastCompletion: daysSinceLast,
      nextHabitName: nextPendingHabit ? formatHabitLabel(nextPendingHabit) : null,
      nextHabitId: nextPendingHabit?.id ?? null
    })
  );

  const allTags = $derived.by(() => {
    const seen: string[] = [];
    const tagSource = filter === 'archived' ? $habitsStore.allHabits.filter((h) => h.archived) : activeHabits;
    tagSource.forEach((h) => h.tags.forEach((t) => { if (!seen.includes(t)) { seen.push(t); } }));
    return seen.sort();
  });

  const filteredHabits = $derived.by(() => {
    let list: Habit[];
    if (filter === 'archived') {
      list = $habitsStore.allHabits.filter((h) => h.archived);
    } else {
      list = activeHabits.filter((h) => {
        if (filter === 'pending') {
          return isMandatoryToday(h, todayDate) && !isHabitCompletedToday(h, todayKey);
        }
        if (filter === 'done') {
          return isMandatoryToday(h, todayDate) && isHabitCompletedToday(h, todayKey);
        }
        return true;
      });
    }
    if (selectedTags.length > 0) {
      list = list.filter((h) => h.tags.some((t) => selectedTags.includes(t)));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (h) => h.name.toLowerCase().includes(q)
          || h.description.toLowerCase().includes(q)
          || h.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return [...list].sort((a, b) => sortHabits(a, b, sortMode, todayDate));
  });

  const groupedHabits = $derived.by(() => {
    if (selectedTags.length === 0) {
      return [{ tag: null as string | null, habits: filteredHabits }];
    }
    return selectedTags
      .map((tag) => ({ tag, habits: filteredHabits.filter((h) => h.tags.includes(tag)) }))
      .filter((g) => g.habits.length > 0);
  });

  $effect(() => {
    const normalizedFilter = normalizeDashboardFilter(filter, activeHabits.length, archivedHabits.length);
    if (normalizedFilter !== filter) {
      filter = normalizedFilter;
    }
  });

  function detectHorizontalSwipe(dx: number, dy: number): boolean | null {
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
      return true;
    }
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
      return false;
    }
    return null;
  }

  function clampSwipeOffset(dx: number): number {
    return Math.max(-160, Math.min(160, dx));
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

  function cleanupTouchDragGhost() {
    if (touchDragGhost) {
      touchDragGhost.remove();
      touchDragGhost = null;
    }
  }

  function exportCSV() {
    if (typeof document === 'undefined' || activeHabits.length === 0) { return; }
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows: string[] = [];
    activeHabits.forEach((habit) => {
      Object.entries(habit.completions).forEach(([date, count]) => {
        if (count > 0) { rows.push([date, escape(habit.name), String(count)].join(',')); }
      });
    });
    const csv = ['Date,Habit Name,Count', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habits-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ─── Increment with animation + confetti ──────────────────────────────────────
  const BURST_COLORS = ['#fff7ed', '#fbbf24', '#fde68a'];

  function prefersReducedMotion(): boolean {
    return typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function setHabitPending(habitId: string, pending: boolean) {
    if (pending) {
      if (!pendingHabitIds.includes(habitId)) {
        pendingHabitIds = [...pendingHabitIds, habitId];
      }
    } else {
      pendingHabitIds = pendingHabitIds.filter((candidate) => candidate !== habitId);
    }
  }

  function showHabitCelebration(habit: Habit, nextCount: number, target: number, isMilestone: boolean) {
    if (prefersReducedMotion()) {
      return;
    }

    const accent = HABIT_COLOR_THEMES[habit.color];
    animatingHabitId = habit.id;
    animLabel = getCelebrationLabel(nextCount, target);

    const burst = buildCelebrationParticles({
      startId: particleCounter,
      colors: [accent.hex, ...BURST_COLORS],
      count: 12,
      spread: 26,
      lift: 14
    });
    animParticles = burst.particles;
    particleCounter = burst.nextId;

    window.setTimeout(async () => {
      try {
        const launch = await getConfetti();
        if (isMilestone) {
          void launch({
            particleCount: 180,
            spread: 165,
            startVelocity: 42,
            origin: { y: 0.6 },
            colors: [accent.hex, '#fbbf24', '#fff7ed'],
            zIndex: 1000
          });
        } else {
          void launch({
            particleCount: 26,
            angle: 60,
            spread: 84,
            startVelocity: 30,
            origin: { x: 0.42, y: 0.74 },
            colors: [accent.hex, '#fff7ed', '#fbbf24'],
            scalar: 0.88,
            zIndex: 900
          });
          void launch({
            particleCount: 26,
            angle: 120,
            spread: 84,
            startVelocity: 30,
            origin: { x: 0.58, y: 0.74 },
            colors: [accent.hex, '#fff7ed', '#fbbf24'],
            scalar: 0.88,
            zIndex: 900
          });
        }
      } catch {
        // ignore errors from confetti (non-critical visual affordance)
      }
    }, 180);

    if (celebrationTimeout) {
      window.clearTimeout(celebrationTimeout);
    }
    celebrationTimeout = window.setTimeout(() => {
      animatingHabitId = null;
      animParticles = [];
      animLabel = '';
      celebrationTimeout = null;
    }, 900);
  }

  async function toggleHabit(habit: Habit) {
    if (pendingHabitIds.includes(habit.id)) {
      return;
    }

    const completion = getHabitCompletionState(habit, todayKey);
    const previousStreak = calculateScheduledStreak(habit, habit.completions).current;
    const completesToday = isMandatoryToday(habit, todayDate) && pendingCount === 1;
    completionError = null;
    setHabitPending(habit.id, true);

    try {
      if (completion.isNegative) {
        await habitsStore.setCompletionCount(habit.id, todayKey, completion.count > 0 ? 0 : 1);
        return;
      }

      if (completion.completed) {
        await habitsStore.setCompletionCount(habit.id, todayKey, Math.max(0, completion.target - 1));
        return;
      }

      const result = await habitsStore.incrementCompletionCount(habit.id, todayKey);
      const isMilestone = result.previousCount < completion.target
        && result.count >= completion.target
        && isPhaseTransition(previousStreak + 1);
      if (completesToday && result.count >= completion.target) {
        showHabitCelebration(habit, result.count, completion.target, isMilestone);
      }
    } catch (error) {
      completionError = {
        habitId: habit.id,
        message: `Could not update ${formatHabitLabel(habit)}. Try again.`
      };
      logClientError('dashboard.completion_failed', 'Failed to update habit completion', {
        habitId: habit.id,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setHabitPending(habit.id, false);
    }
  }

  // ─── Navigation ───────────────────────────────────────────────────────────────
  function navigateToDetail(habitId: string) {
    void goto(resolve('/app/(protected)/habit/[id]', { id: habitId }));
  }

  function navigateToNewHabit() {
    void goto(resolve<'/app/(protected)/habit/new'>('/app/(protected)/habit/new', {}));
  }

  function navigateToNextHabit() {
    if (todaySummary.nextHabitId) {
      navigateToDetail(todaySummary.nextHabitId);
    }
  }

  // ─── Drag-and-drop ────────────────────────────────────────────────────────────
  function isDragActive() {
    return sortMode === 'custom' && filter !== 'archived';
  }

  function onDragStart(e: DragEvent, habitId: string) {
    dragId = habitId;
    dropHint = null;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', habitId);
    }
  }

  function onDragOver(e: DragEvent, habitId: string) {
    e.preventDefault();
    if (e.dataTransfer) { e.dataTransfer.dropEffect = 'move'; }
    if (habitId === dragId) { return; }

    dragOverId = habitId;
    const currentTarget = e.currentTarget as HTMLElement | null;
    const rect = currentTarget?.getBoundingClientRect();
    const position = rect && e.clientY < rect.top + rect.height / 2 ? 'above' : 'below';
    dropHint = { habitId, position };
  }

  function onDragLeave(e: DragEvent) {
    const currentTarget = e.currentTarget as HTMLElement | null;
    const nextTarget = e.relatedTarget as Node | null;
    if (currentTarget && nextTarget && currentTarget.contains(nextTarget)) {
      return;
    }
    dragOverId = null;
    dropHint = null;
  }

  async function applyCustomReorder(sourceId: string, targetId: string, position: 'above' | 'below') {
    const fullItems = [...activeHabits].sort((a, b) => sortHabits(a, b, 'custom', todayDate));
    const visibleIds = new Set(filteredHabits.map((habit) => habit.id));
    const items = fullItems.filter((habit) => visibleIds.has(habit.id));
    const fromIdx = items.findIndex((habit) => habit.id === sourceId);
    const toIdx = items.findIndex((habit) => habit.id === targetId);
    if (fromIdx < 0 || toIdx < 0) {
      return;
    }

    const [movedHabit] = items.splice(fromIdx, 1);
    let insertIdx = toIdx + (position === 'below' ? 1 : 0);
    if (fromIdx < insertIdx) {
      insertIdx -= 1;
    }
    insertIdx = Math.max(0, Math.min(items.length, insertIdx));
    items.splice(insertIdx, 0, movedHabit);

    let visibleIndex = 0;
    const reorderedHabits = fullItems.map((habit) => (visibleIds.has(habit.id) ? items[visibleIndex++] : habit));
    const base = Date.now();
    for (let i = 0; i < reorderedHabits.length; i++) {
      const newOrder = base + i * 1_000;
      if (reorderedHabits[i].sortOrder !== newOrder) {
        void habitsStore.updateHabit(reorderedHabits[i].id, { sortOrder: newOrder });
      }
    }
  }

  async function onDrop(e: DragEvent, targetId: string) {
    e.preventDefault();
    const currentDropHint = dropHint;
    dragOverId = null;
    dropHint = null;
    if (!dragId || dragId === targetId) { dragId = null; return; }
    await applyCustomReorder(dragId, targetId, currentDropHint?.habitId === targetId ? currentDropHint.position : 'above');
    dragId = null;
  }

  function onDragEnd() { dragId = null; dragOverId = null; dropHint = null; }

  // ─── Tags ────────────────────────────────────────────────────────────────────
  function toggleTag(tag: string) {
    if (selectedTags.includes(tag)) {
      selectedTags = selectedTags.filter((t) => t !== tag);
    } else {
      selectedTags = [...selectedTags, tag];
    }
  }

  // ─── Swipe gestures (mobile) ─────────────────────────────────────────────────
  let swipeHabitId = $state('');

  function resetSwipeState() {
    swipeStartX = 0;
    swipeStartY = 0;
    swipeAxisLocked = null;
    swipeTriggered = false;
    swipeHabitId = '';
    swipeOffset = 0;
    swipeDirection = null;
    isSwipingGesture = false;
  }

  function onRowTouchStart(e: TouchEvent, habitId: string) {
    if (touchDragId || e.touches.length !== 1) { return; }
    swipeStartX  = e.touches[0]?.clientX ?? 0;
    swipeStartY  = e.touches[0]?.clientY ?? 0;
    swipeAxisLocked = null;
    swipeTriggered = false;
    swipeHabitId = habitId;
    swipeOffset = 0;
    swipeDirection = null;
    isSwipingGesture = false;
  }

  function onRowTouchMove(e: TouchEvent, habit: Habit) {
    if (touchDragId || swipeHabitId !== habit.id || e.touches.length !== 1) { return; }
    const dx = (e.touches[0]?.clientX ?? 0) - swipeStartX;
    const dy = (e.touches[0]?.clientY ?? 0) - swipeStartY;

    if (swipeAxisLocked === null) {
      const detected = detectHorizontalSwipe(dx, dy);
      if (detected === false) {
        resetSwipeState();
        return;
      }
      if (detected === null) {
        return;
      }
      swipeAxisLocked = detected;
    }

    if (!swipeAxisLocked) {
      return;
    }

    e.preventDefault();
    const clampedOffset = clampSwipeOffset(dx);
    swipeOffset = clampedOffset;
    swipeDirection = clampedOffset === 0 ? null : clampedOffset > 0 ? 'right' : 'left';
    isSwipingGesture = true;

    if (!swipeTriggered && Math.abs(clampedOffset) >= 60) {
      swipeTriggered = true;
      if (clampedOffset > 0) {
        if (getScheduleStatusForDate(habit, todayDate) !== 'frozen') {
          void toggleHabit(habit);
        }
      } else {
        navigateToDetail(habit.id);
      }
      setTimeout(() => {
        if (swipeHabitId === habit.id) {
          resetSwipeState();
        }
      }, 150);
    }
  }

  function onRowTouchEnd() {
    if (touchDragId) {
      return;
    }
    if (!swipeTriggered) {
      resetSwipeState();
    }
  }

  function onGripTouchStart(e: TouchEvent, habitId: string) {
    if (!isDragActive()) { return; }
    e.preventDefault();
    e.stopPropagation();
    const row = (e.currentTarget as HTMLElement | null)?.closest('[data-habit-id]') as HTMLElement | null;
    const touch = e.touches[0];
    if (!row || !touch) { return; }

    touchDragId = habitId;
    dragId = habitId;
    dragOverId = null;
    dropHint = null;
    touchDragOriginY = touch.clientY;
    touchDragOriginTop = row.getBoundingClientRect().top;
    cleanupTouchDragGhost();
    touchDragGhost = buildTouchGhost(row);
  }

  $effect(() => {
    if (!touchDragId || typeof document === 'undefined') {
      return;
    }

    function onTouchDragMove(e: TouchEvent) {
      e.preventDefault();
      const touch = e.touches[0];
      if (!touch) { return; }

      if (touchDragGhost) {
        const delta = touch.clientY - touchDragOriginY;
        touchDragGhost.style.top = `${touchDragOriginTop + delta}px`;
      }

      if (touchDragGhost) {
        touchDragGhost.style.visibility = 'hidden';
      }
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      if (touchDragGhost) {
        touchDragGhost.style.visibility = '';
      }

      const row = element?.closest('[data-habit-id]');
      if (row) {
        const targetId = row.getAttribute('data-habit-id');
        if (targetId && targetId !== touchDragId) {
          const position = getDropPosition(touch.clientY, row as HTMLElement);
          dropHint = { habitId: targetId, position };
          dragOverId = targetId;
          return;
        }
      }

      dropHint = null;
      dragOverId = null;
    }

    async function onTouchDragEnd() {
      cleanupTouchDragGhost();
      const draggedId = touchDragId;
      const hint = dropHint;

      touchDragId = null;
      dragId = null;
      dragOverId = null;
      dropHint = null;

      if (!draggedId || !hint) {
        return;
      }

      await applyCustomReorder(draggedId, hint.habitId, hint.position);
    }

    document.addEventListener('touchmove', onTouchDragMove, { passive: false });
    document.addEventListener('touchend', onTouchDragEnd);
    document.addEventListener('touchcancel', onTouchDragEnd);

    return () => {
      document.removeEventListener('touchmove', onTouchDragMove);
      document.removeEventListener('touchend', onTouchDragEnd);
      document.removeEventListener('touchcancel', onTouchDragEnd);
      cleanupTouchDragGhost();
    };
  });

  // ─── Onboarding ───────────────────────────────────────────────────────────────
  async function handleTemplateSelect(template: OnboardingTemplate) {
    addingTemplate = template.name;
    try {
      const allHabits = $habitsStore.allHabits;
      const sortOrder =
        allHabits.length > 0
          ? Math.max(...allHabits.map((h) => h.sortOrder ?? 0)) + 1
          : 0;
      const habitId = await habitsStore.addHabit({
        name: template.name,
        description: template.description,
        icon: template.icon,
        color: template.color,
        tags: template.tags,
        frequency: template.frequency,
        customDays: template.customDays,
        targetStreak: template.targetStreak,
        dailyTarget: 1,
        type: 'positive',
        freezeDays: [],
        archived: false,
        sortOrder
      });
      await goto(resolve('/app/(protected)/habit/[id]', { id: habitId }));
    } finally {
      addingTemplate = null;
    }
  }
</script>

<svelte:head>
  <title>Dashboard - Habbit Runner</title>
</svelte:head>

{#if isInitialHydration}
  <div class="min-h-[60vh] px-4 py-10 sm:px-6">
    <div class="mx-auto flex max-w-4xl flex-col items-center justify-center rounded-[2rem] border border-border bg-bg-secondary/88 px-6 py-16 text-center shadow-[0_26px_70px_rgba(15,23,42,0.1)] backdrop-blur-xl">
      <div class="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-accent"></div>
      <p class="mt-5 text-sm font-semibold text-foreground">Loading your habits…</p>
      <p class="mt-2 text-xs font-mono uppercase tracking-wider text-muted">Syncing dashboard data from the server</p>
    </div>
  </div>
{:else if showOnboarding}
  <Onboarding onCreateCustom={navigateToNewHabit} onTemplateSelect={handleTemplateSelect} activeTemplate={addingTemplate} />
{:else}
  <div class="min-h-screen bg-transparent px-4 pt-4 sm:px-6">
    <div class="mx-auto flex max-w-6xl flex-col gap-4">
      <TodaySummary
        summary={todaySummary}
        dateLabel={dateStr}
        onPrimaryAction={todaySummary.nextHabitId ? navigateToNextHabit : undefined}
      />

      <div class="sticky top-0 z-[70]">
        <DashboardToolbar
          filter={filter}
          {searchQuery}
          {sortMode}
          {viewDensity}
          {pendingCount}
          activeTags={selectedTags}
          availableTags={allTags}
          onFilterChange={(nextFilter) => {
            filter = nextFilter;
          }}
          onSearchChange={(nextQuery) => {
            searchQuery = nextQuery;
          }}
          onClearSearch={() => {
            searchQuery = '';
          }}
          onSortChange={(nextSortMode) => {
            sortMode = nextSortMode;
          }}
          onDensityChange={(nextDensity) => {
            viewDensity = nextDensity;
          }}
          onToggleTag={(tag) => {
            toggleTag(tag);
          }}
          onClearTags={() => {
            selectedTags = [];
          }}
          onAddHabit={navigateToNewHabit}
          onExportCsv={exportCSV}
        />
      </div>

      {#if completionError}
        <div role="alert" class="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {completionError.message}
        </div>
      {/if}

      <RemindersPanel />

      <div class="w-full max-w-6xl">
        {#if filteredHabits.length === 0}
          <div class="rounded-[1.75rem] border border-border bg-bg-secondary/88 py-16 text-center text-muted shadow-[0_20px_54px_rgba(15,23,42,0.08)]">
            <p class="text-4xl mb-3">
              {filter === 'pending' ? '🎉' : filter === 'done' ? '✨' : filter === 'archived' ? '🗂️' : '👋'}
            </p>
            <p class="text-lg font-semibold text-foreground">
              {filter === 'pending' ? 'All done for today!' : filter === 'done' ? 'No completed habits yet' : filter === 'archived' ? 'No archived habits' : searchQuery ? 'No habits match your search' : 'No habits found'}
            </p>
            <button
              type="button"
              onclick={navigateToNewHabit}
              class="mt-4 rounded-2xl bg-accent px-5 py-2 text-sm font-semibold uppercase tracking-widest text-bg-primary transition hover:opacity-90"
            >Add a habit</button>
          </div>
        {:else if viewDensity === 'comfortable'}
          <div
            class={`${selectedTags.length === 0 ? 'grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(18rem,1fr))]' : ''}`}
            role="list"
            aria-label="Habit list"
          >
            {#if selectedTags.length === 0}
              {#each filteredHabits as habit, idx (habit.id)}
                <HabitTile
                  {habit}
                  {todayKey}
                  {todayDate}
                  appearanceIndex={idx}
                  pending={pendingHabitIds.includes(habit.id)}
                  error={completionError?.habitId === habit.id}
                  animating={animatingHabitId === habit.id}
                  {animParticles}
                  {animLabel}
                  onToggle={() => void toggleHabit(habit)}
                  onDetail={() => navigateToDetail(habit.id)}
                />
              {/each}
            {:else}
              {#each groupedHabits as group (group.tag ?? 'all')}
                {#if group.tag}
                  <div class="col-span-full">
                    <div class="mt-2 flex items-center gap-2 px-1 first:mt-0">
                      <span class="h-1.5 w-1.5 rounded-full bg-accent"></span>
                      <h3 class="text-[10px] font-mono font-bold uppercase tracking-widest text-muted">{group.tag}</h3>
                    </div>
                    <div class="mt-3 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(18rem,1fr))]">
                      {#each group.habits as habit, idx (habit.id)}
                        <HabitTile
                          {habit}
                          {todayKey}
                          {todayDate}
                          appearanceIndex={idx}
                          pending={pendingHabitIds.includes(habit.id)}
                          error={completionError?.habitId === habit.id}
                          animating={animatingHabitId === habit.id}
                          {animParticles}
                          {animLabel}
                          onToggle={() => void toggleHabit(habit)}
                          onDetail={() => navigateToDetail(habit.id)}
                        />
                      {/each}
                    </div>
                  </div>
                {/if}
              {/each}
            {/if}
          </div>
        {:else}
          <div class="flex w-full flex-col gap-3" role="list" aria-label="Habit list">
            {#if selectedTags.length === 0}
              {#each filteredHabits as habit, idx (habit.id)}
                <HabitCompactRow
                  {habit}
                  {todayKey}
                  {todayDate}
                  appearanceIndex={idx}
                  isDragActive={isDragActive()}
                  {dragId}
                  {dropHint}
                  {animatingHabitId}
                  {animParticles}
                  {animLabel}
                  swipeHabitId={swipeHabitId}
                  {swipeOffset}
                  {swipeDirection}
                  {isSwipingGesture}
                  isDragOver={dragOverId === habit.id}
                  pending={pendingHabitIds.includes(habit.id)}
                  error={completionError?.habitId === habit.id}
                  on:toggle={() => void toggleHabit(habit)}
                  on:detail={() => navigateToDetail(habit.id)}
                  on:dragstart={(event: CustomEvent<DragEvent>) => onDragStart(event.detail, habit.id)}
                  on:dragover={(event: CustomEvent<DragEvent>) => onDragOver(event.detail, habit.id)}
                  on:dragleave={(event: CustomEvent<DragEvent>) => onDragLeave(event.detail)}
                  on:drop={(event: CustomEvent<DragEvent>) => void onDrop(event.detail, habit.id)}
                  on:dragend={() => onDragEnd()}
                  on:touchstart={(event: CustomEvent<TouchEvent>) => onRowTouchStart(event.detail, habit.id)}
                  on:touchmove={(event: CustomEvent<TouchEvent>) => onRowTouchMove(event.detail, habit)}
                  on:touchend={() => onRowTouchEnd()}
                  on:touchcancel={() => onRowTouchEnd()}
                  on:gripTouchStart={(event: CustomEvent<TouchEvent>) => onGripTouchStart(event.detail, habit.id)}
                />
              {/each}
            {:else}
              {#each groupedHabits as group (group.tag ?? 'all')}
                {#if group.tag}
                  <div class="space-y-2">
                    <div class="flex items-center gap-2 px-1">
                      <span class="h-1.5 w-1.5 rounded-full bg-accent"></span>
                      <h3 class="text-[10px] font-mono font-bold uppercase tracking-widest text-muted">{group.tag}</h3>
                    </div>
                    <div class="space-y-2">
                      {#each group.habits as habit, idx (habit.id)}
                        <HabitCompactRow
                          {habit}
                          {todayKey}
                          {todayDate}
                          appearanceIndex={idx}
                          isDragActive={isDragActive()}
                          {dragId}
                          {dropHint}
                          {animatingHabitId}
                          {animParticles}
                          {animLabel}
                          swipeHabitId={swipeHabitId}
                          {swipeOffset}
                          {swipeDirection}
                          {isSwipingGesture}
                          isDragOver={dragOverId === habit.id}
                          pending={pendingHabitIds.includes(habit.id)}
                          error={completionError?.habitId === habit.id}
                          on:toggle={() => void toggleHabit(habit)}
                          on:detail={() => navigateToDetail(habit.id)}
                          on:dragstart={(event: CustomEvent<DragEvent>) => onDragStart(event.detail, habit.id)}
                          on:dragover={(event: CustomEvent<DragEvent>) => onDragOver(event.detail, habit.id)}
                          on:dragleave={(event: CustomEvent<DragEvent>) => onDragLeave(event.detail)}
                          on:drop={(event: CustomEvent<DragEvent>) => void onDrop(event.detail, habit.id)}
                          on:dragend={() => onDragEnd()}
                          on:touchstart={(event: CustomEvent<TouchEvent>) => onRowTouchStart(event.detail, habit.id)}
                          on:touchmove={(event: CustomEvent<TouchEvent>) => onRowTouchMove(event.detail, habit)}
                          on:touchend={() => onRowTouchEnd()}
                          on:touchcancel={() => onRowTouchEnd()}
                          on:gripTouchStart={(event: CustomEvent<TouchEvent>) => onGripTouchStart(event.detail, habit.id)}
                        />
                      {/each}
                    </div>
                  </div>
                {/if}
              {/each}
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
