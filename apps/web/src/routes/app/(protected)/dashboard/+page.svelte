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
  import {
    Flame, Plus, Search, Zap, TrendingUp, GripVertical,
    ChevronDown, ChevronUp, MoreHorizontal, X,
    Shield, Activity, Star, Trophy, SnowflakeIcon, Moon,
    LayoutGrid, List, SlidersHorizontal, AlignLeft
  } from 'lucide-svelte';
  import CompletionRing from '$lib/components/CompletionRing.svelte';
  import MiniHeatmap from '$lib/components/MiniHeatmap.svelte';
  import HabitTile from '$lib/components/HabitTile.svelte';
  import Onboarding from '$lib/components/Onboarding.svelte';
  import RemindersPanel from '$lib/components/RemindersPanel.svelte';
  import ChartGuideTooltip from '$lib/components/ChartGuideTooltip.svelte';
  import DescriptionTooltip from '$lib/components/DescriptionTooltip.svelte';
  import type { OnboardingTemplate } from '$lib/components/onboarding';
  import { formatAppDate } from '@/lib/i18n';
  import {
    calculateScheduledCompletionRate,
    calculateScheduledStreak,
    getScheduleStatusForDate,
    isMandatoryToday
  } from '$lib/habits/schedule';
  import { formatDate, getDaysSinceLastCompletion } from '$lib/habits/habitStats';
  import { habitsStore } from '$lib/stores/habits';
  import { HABIT_COLOR_THEMES } from '$lib/theme/habit-colors';
  import { getHabitPhase, isPhaseTransition } from '$lib/habits/phases';
  import { computeTileHint } from '$lib/habits/tileHint';
  import { sortHabits } from '$lib/habits/dashboardSort';
  import type { Habit } from '@/types/habit';

  // ─── Types ────────────────────────────────────────────────────────────────────
  type DashboardFilter = 'pending' | 'all' | 'done' | 'archived';
  type SortMode = 'custom' | 'smart';
  type ViewDensity = 'comfortable' | 'compact';
  type DropHint = { habitId: string; position: 'above' | 'below' };
  type SwipeDirection = 'left' | 'right' | null;

  // ─── LocalStorage helpers ─────────────────────────────────────────────────────
  const LS_FILTER    = 'hr_dashboard_filter_v1';
  const LS_DENSITY   = 'hr_dashboard_density_v1';
  const LS_COLLAPSED = 'hr_dashboard_hero_collapsed_v1';
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
  let filter           = $state<DashboardFilter>(lsGet<DashboardFilter>(LS_FILTER, 'pending'));
  let searchQuery      = $state('');
  let sortMode         = $state<SortMode>(lsGet<SortMode>(LS_SORT, 'custom'));
  let viewDensity      = $state<ViewDensity>(lsGet<ViewDensity>(LS_DENSITY, 'comfortable'));
  let heroCollapsed    = $state<boolean>(lsGet<boolean>(LS_COLLAPSED, false));
  let selectedTags     = $state<string[]>(lsGet<string[]>(LS_TAGS, []));
  let menuOpen         = $state(false);

  let animatingHabitId = $state<string | null>(null);
  let animParticles    = $state<{ id: number; tx: number; ty: number; color: string }[]>([]);
  let particleCounter  = 0;

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
  $effect(() => { lsSet(LS_COLLAPSED, heroCollapsed); });
  $effect(() => { lsSet(LS_TAGS, selectedTags); });

  // ─── Derived: dates ───────────────────────────────────────────────────────────
  const todayDate = $derived.by(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); });
  const todayKey  = $derived(formatDate(todayDate));
  const dateStr   = $derived(formatAppDate(todayDate, { weekday: 'long', month: 'short', day: 'numeric' }));

  function isHabitCompletedToday(habit: Habit, dateKey: string) {
    if (habit.type === 'negative') {
      return (habit.completions[dateKey] ?? 0) === 0;
    }
    return (habit.completions[dateKey] ?? 0) >= Math.max(1, habit.dailyTarget ?? 1);
  }

  // ─── Derived: habit lists ─────────────────────────────────────────────────────
  const activeHabits = $derived($habitsStore.habits);

  const scheduledToday = $derived(activeHabits.filter((h) => isMandatoryToday(h, todayDate)));

  const completedTodayCount = $derived(
    scheduledToday.filter((h) => isHabitCompletedToday(h, todayKey)).length
  );

  const pendingCount = $derived(
    scheduledToday.filter((h) => !isHabitCompletedToday(h, todayKey)).length
  );

  const todayRate = $derived(
    scheduledToday.length > 0
      ? Math.round((completedTodayCount / scheduledToday.length) * 100)
      : 0
  );

  const overallStreak = $derived.by(() => {
    if (activeHabits.length === 0) { return 0; }
    return Math.max(...activeHabits.map((h) => calculateScheduledStreak(h, h.completions).current));
  });

  // ─── More derived ────────────────────────────────────────────────────────────
  const daysSinceLast       = $derived(getDaysSinceLastCompletion(activeHabits));
  const showComebackBanner  = $derived(daysSinceLast >= 2 && todayRate < 100);

  const motivationText = $derived.by(() => {
    const remaining = scheduledToday.length - completedTodayCount;
    if (todayRate >= 100) {
      return null;
    }
    if (todayRate >= 50) {
      return `Almost there - ${remaining} left!`;
    }
    if (todayRate > 0) {
      return `Keep going - ${remaining} to go`;
    }
    return 'Start your streak';
  });

  const allTags = $derived.by(() => {
    const seen: string[] = [];
    activeHabits.forEach((h) => h.tags.forEach((t) => { if (!seen.includes(t)) { seen.push(t); } }));
    return seen.sort();
  });

  const filteredHabits = $derived.by(() => {
    let list: Habit[];
    if (filter === 'archived') {
      list = $habitsStore.allHabits.filter((h) => h.archived);
    } else {
      list = activeHabits.filter((h) => {
        if (filter === 'pending') {
          return !isHabitCompletedToday(h, todayKey);
        }
        if (filter === 'done') {
          return isHabitCompletedToday(h, todayKey);
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
        (h) => h.name.toLowerCase().includes(q) || h.tags.some((t) => t.toLowerCase().includes(q))
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

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  function buildLast7(habit: Habit) {
    return Array.from({ length: 7 }, (_, i) => {
      const key = formatDate(new Date(todayDate.getTime() + (i - 6) * 86_400_000));
      const tgt = Math.max(1, habit.dailyTarget ?? 1);
      return (habit.completions[key] ?? 0) >= tgt;
    });
  }

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
    menuOpen = false;
    if (typeof document === 'undefined' || activeHabits.length === 0) { return; }
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows: string[] = [];
    activeHabits.forEach((habit) => {
      Object.entries(habit.completions).forEach(([date, count]) => {
        if (count > 0) { rows.push([date, escape(habit.name), '1'].join(',')); }
      });
    });
    const csv = ['Date,Habit Name,Completed', ...rows].join('\n');
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

  // ─── Toggle with animation + confetti ────────────────────────────────────────
  const BURST_COLORS = ['#FFD700', '#FFA500', '#fff', 'var(--accent)'];

  async function toggleHabit(habit: Habit) {
    const tgt = Math.max(1, habit.dailyTarget ?? 1);
    const cur = habit.completions[todayKey] ?? 0;

    if (cur < tgt) {
      animatingHabitId = habit.id;
      animParticles = Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * 2 * Math.PI;
        const dist  = 22 + Math.random() * 16;
        return {
          id:    ++particleCounter,
          tx:    Math.cos(angle) * dist,
          ty:    Math.sin(angle) * dist - 10,
          color: BURST_COLORS[i % BURST_COLORS.length]
        };
      });

      const { current } = calculateScheduledStreak(habit, habit.completions);
      if (isPhaseTransition(current + 1)) {
        setTimeout(async () => {
          try {
            const launch = await getConfetti();
            void launch({ particleCount: 180, spread: 160, origin: { y: 0.6 }, colors: ['#FFD700', '#FFA500', '#fff'], zIndex: 1000 });
          } catch {
            // ignore errors from confetti (non-critical visual affordance)
          }
        }, 300);
      }

      setTimeout(() => { animatingHabitId = null; animParticles = []; }, 700);
    }

    await habitsStore.advanceCompletionCount(habit.id, todayKey);
  }

  // ─── Navigation ───────────────────────────────────────────────────────────────
  function navigateToDetail(habitId: string) {
    void goto(resolve('/app/(protected)/habit/[id]', { id: habitId }));
  }

  function navigateToNewHabit() {
    void goto(resolve<'/app/(protected)/habit/new'>('/app/(protected)/habit/new', {}));
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

{#if $habitsStore.habits.length === 0}
  <Onboarding onCreateCustom={navigateToNewHabit} onTemplateSelect={handleTemplateSelect} activeTemplate={addingTemplate} />
{:else}
  <div class="min-h-screen bg-bg-primary">

    <!-- ═══════════ HERO ═══════════════════════════════════════════════════════ -->
    <section class="border-b border-border bg-bg-primary">
      <div class="px-4 py-3" style="padding-top: calc(var(--safe-area-inset-top, 0px) + 1rem);">
        <div class="mx-auto flex max-w-2xl items-center justify-between">
          <div class="min-w-0 flex-1">
            <div class="mb-1 flex items-center gap-2">
              <p class="text-[11px] font-mono uppercase tracking-widest text-muted">{dateStr}</p>
              <ChartGuideTooltip
                title="Your dashboard"
                summary="A bird's eye view of today's progress. The ring shows how many scheduled habits you've completed so far."
                focusPoints={[
                  "Completion ring: percentage of today's mandatory habits done.",
                  'Streak: your longest active habit streak.',
                  'Progress bar below shows daily momentum.'
                ]}
                variant="bars"
                triggerClassName="h-7 w-7"
              />
            </div>

            <div class="flex items-center gap-3">
              <CompletionRing percentage={todayRate} size={28} strokeWidth={3.5} />
              <div class="text-[12px] font-semibold text-foreground">{completedTodayCount}/{scheduledToday.length || 0}</div>
              {#if overallStreak > 0}
                <div class="flex items-center gap-1 text-[12px] font-mono text-accent-secondary">
                  <Flame size={14} />
                  <span>{overallStreak}d</span>
                </div>
              {/if}
            </div>
          </div>

          <div class="flex items-center gap-2">
            <div class="relative">
              <button
                type="button"
                onclick={() => { menuOpen = !menuOpen; }}
                class="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-bg-secondary transition hover:border-accent"
                aria-label="Dashboard options"
                aria-expanded={menuOpen}
              >
                <MoreHorizontal size={18} />
              </button>
              {#if menuOpen}
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                  class="absolute right-0 top-full z-20 mt-2 w-36 rounded-2xl border border-border bg-bg-card shadow-xl"
                  onmouseleave={() => { menuOpen = false; }}
                >
                  <button
                    type="button"
                    onclick={exportCSV}
                    class="w-full px-3 py-2 text-left text-xs font-semibold uppercase tracking-widest text-foreground transition hover:bg-bg-secondary"
                  >
                    Export CSV
                  </button>
                </div>
              {/if}
            </div>

            <button
              type="button"
              onclick={() => { heroCollapsed = !heroCollapsed; }}
              class="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-bg-secondary transition hover:border-accent"
              aria-label={heroCollapsed ? 'Expand hero' : 'Collapse hero'}
              aria-expanded={!heroCollapsed}
            >
              {#if heroCollapsed}<ChevronDown size={16} />{:else}<ChevronUp size={16} />{/if}
            </button>
          </div>
        </div>
      </div>

      <div class="overflow-hidden transition-all duration-300" style:max-height={heroCollapsed ? '0px' : '1200px'} aria-hidden={heroCollapsed}>
        <div class="px-4 pb-4">
          <div class="mx-auto max-w-2xl">
            <div class="mb-3 flex items-center gap-5">
              <CompletionRing percentage={todayRate} size={88} strokeWidth={7} />
              <div class="flex flex-1 flex-col gap-2">
                {#if motivationText}
                  <p class={`text-xs font-mono tracking-wide ${todayRate >= 50 ? 'text-accent-secondary' : 'text-muted'}`}>
                    {motivationText}
                  </p>
                {/if}

                <div class="grid grid-cols-3 gap-2">
                  <div class="rounded-xl border border-border bg-bg-card px-3 py-2">
                    <div class="mb-1 flex items-center gap-1.5">
                      <Zap size={10} class="text-accent" />
                      <span class="text-[10px] font-mono uppercase tracking-wider text-muted">Active</span>
                    </div>
                    <span class="text-lg font-mono font-bold text-foreground">{activeHabits.length}</span>
                  </div>
                  <div class="rounded-xl border border-border bg-bg-card px-3 py-2">
                    <div class="mb-1 flex items-center gap-1.5">
                      <Flame size={10} class="text-accent-secondary" />
                      <span class="text-[10px] font-mono uppercase tracking-wider text-muted">Streak</span>
                    </div>
                    <span class="text-lg font-mono font-bold text-accent-secondary">{overallStreak}d</span>
                  </div>
                  <div class="rounded-xl border border-border bg-bg-card px-3 py-2">
                    <div class="mb-1 flex items-center gap-1.5">
                      <TrendingUp size={10} class="text-accent-secondary" />
                      <span class="text-[10px] font-mono uppercase tracking-wider text-muted">Done</span>
                    </div>
                    <span class="text-lg font-mono font-bold text-accent-secondary">{completedTodayCount}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="mb-3 h-[3px] overflow-hidden rounded-full bg-border">
              <div
                class={`h-full rounded-full transition-all duration-700 ${todayRate >= 100 ? 'animate-progress-glow' : ''}`}
                style:width={`${Math.min(todayRate, 100)}%`}
                style:background={todayRate >= 100
                  ? 'linear-gradient(90deg, var(--accent-secondary), var(--accent))'
                  : 'linear-gradient(90deg, var(--accent), var(--accent-secondary))'}
                style:box-shadow="0 0 8px var(--glow)"
              ></div>
            </div>

            {#if showComebackBanner}
              <div class="animate-comeback-slide mb-3 flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-2.5">
                <span class="text-lg" role="img" aria-label="welcome back">👋</span>
                <div>
                  <p class="text-sm font-semibold text-foreground">Welcome back!</p>
                  <p class="text-[11px] font-mono text-muted">You've been away for {daysSinceLast} days. Let's start fresh today!</p>
                </div>
              </div>
            {/if}

            {#if todayRate >= 100}
              <div class="animate-slide-down-fade mb-3 flex items-center gap-3 rounded-xl border border-accent-secondary/30 bg-accent-secondary/5 px-4 py-2.5">
                <span class="text-lg" role="img" aria-label="celebration">🎉</span>
                <div>
                  <p class="text-sm font-semibold text-foreground">Perfect day!</p>
                  <p class="text-[11px] font-mono text-muted">All habits completed. Keep the streak alive!</p>
                </div>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════ CONTROLS BAR (sticky) ════════════════════════════════════ -->
    <div class="sticky top-0 z-[70] border-b border-border bg-bg-primary/90 backdrop-blur-sm">
      <div class="mx-auto max-w-2xl px-4">

        <div class="flex items-center gap-2 pt-3">
          <span class="text-[10px] font-mono uppercase tracking-wider text-muted">Dashboard filters</span>
          <ChartGuideTooltip
            title="Dashboard filters"
            summary="Use this control bar to narrow the dashboard to the habits that need attention, then switch sort and layout to review them faster."
            focusPoints={[
              'Tabs: split today into pending, done, all, and archived views.',
              'Search and tags: isolate one habit or one context quickly.',
              'Sort and density: change scan order and switch between list and card views.'
            ]}
            variant="columns"
            triggerClassName="h-7 w-7"
          />
        </div>

        <!-- Filter tabs -->
        <div class="flex items-center gap-0 pt-1">
          <div class="flex flex-1 overflow-x-auto">
            {#each (['pending', 'all', 'done', 'archived'] as const) as f ('tab-' + f)}
              <button
                type="button"
                onclick={() => { filter = f; }}
                class="relative flex-shrink-0 px-3 py-2.5 text-[11px] font-mono uppercase tracking-wider transition-colors border-b-[2px] whitespace-nowrap
                  {filter === f ? 'border-accent text-accent font-bold' : 'border-transparent text-muted hover:text-foreground'}"
              >
                {f}
                {#if f === 'pending' && pendingCount > 0}
                  <span class="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent/15 px-1 text-[9px] font-bold text-accent">
                    {pendingCount}
                  </span>
                {/if}
              </button>
            {/each}
          </div>
          <button
            type="button"
            class="ml-2 flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-accent text-bg-primary transition hover:opacity-90"
            aria-label="Add habit"
            onclick={navigateToNewHabit}
          >
            <Plus size={16} />
          </button>
        </div>

        <!-- Search + sort + density -->
        <div class="flex items-center gap-2 py-2">
          <div class="relative flex-1">
            <Search size={13} class="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              type="search"
              placeholder="Search habits..."
              bind:value={searchQuery}
              class="w-full rounded-xl border border-border bg-bg-secondary py-2 pl-8 pr-8 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
            />
            {#if searchQuery}
              <button
                type="button"
                onclick={() => { searchQuery = ''; }}
                class="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full text-muted hover:text-foreground transition"
                aria-label="Clear search"
              ><X size={11} /></button>
            {/if}
          </div>
          <!-- Sort toggle -->
          <div class="flex items-center gap-1 flex-shrink-0">
            <div class="flex rounded-xl border border-border bg-bg-secondary overflow-hidden text-[11px] font-mono">
              <button
                type="button"
                onclick={() => { sortMode = 'custom'; }}
                class="flex items-center gap-1 px-2.5 py-1.5 transition {sortMode === 'custom' ? 'bg-accent/15 text-accent' : 'text-muted hover:text-foreground'}"
                title="Custom order — drag to reorder"
              >
                <AlignLeft size={11} />
                <span class="hidden sm:inline">Custom</span>
              </button>
              <button
                type="button"
                onclick={() => { sortMode = 'smart'; }}
                class="flex items-center gap-1 px-2.5 py-1.5 transition {sortMode === 'smart' ? 'bg-accent/15 text-accent' : 'text-muted hover:text-foreground'}"
                title="Smart sort — prioritises habits needing attention (behavioral science: Lally, Dai, Baumeister)"
              >
                <SlidersHorizontal size={11} />
                <span class="hidden sm:inline">Smart</span>
              </button>
            </div>
            <ChartGuideTooltip
              title="Smart Sort"
              summary="Habits are ranked by how much attention they need right now, based on behavioural science research. The most fragile habits always appear first."
              focusPoints={[
                'Young habits (<21 days): maximally fragile - Lally et al., 2010.',
                'Low 30-day completion rate signals a habit losing traction.',
                'Recent miss (1-3 days ago) is the highest abandonment risk signal.',
                'Evening reminders rank higher due to ego depletion - Baumeister.',
                "Negative habits (DON'T do X) are inherently harder than positive ones."
              ]}
              variant="columns"
              triggerClassName="h-6 w-6"
            />
          </div>
          <!-- Density toggle -->
          <div class="flex flex-shrink-0 rounded-xl border border-border bg-bg-secondary overflow-hidden">
            <button
              type="button"
              onclick={() => { viewDensity = 'compact'; }}
              class="flex h-8 w-8 items-center justify-center transition {viewDensity === 'compact' ? 'bg-accent/15 text-accent' : 'text-muted hover:text-foreground'}"
              aria-label="List view"
            ><List size={13} /></button>
            <button
              type="button"
              onclick={() => { viewDensity = 'comfortable'; }}
              class="flex h-8 w-8 items-center justify-center transition {viewDensity === 'comfortable' ? 'bg-accent/15 text-accent' : 'text-muted hover:text-foreground'}"
              aria-label="Grid view"
            ><LayoutGrid size={13} /></button>
          </div>
        </div>

        <!-- Tag filter chips -->
        {#if allTags.length > 0}
          <div class="flex items-center gap-1.5 pb-2 overflow-x-auto">
            {#each allTags as tag ('tag-' + tag)}
              <button
                type="button"
                onclick={() => toggleTag(tag)}
                class="flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] font-mono transition
                  {selectedTags.includes(tag) ? 'bg-accent/15 text-accent border border-accent/40' : 'border border-border text-muted hover:text-foreground hover:border-border-hover'}"
              >#{tag}</button>
            {/each}
            {#if selectedTags.length > 0}
              <button
                type="button"
                onclick={() => { selectedTags = []; }}
                class="flex-shrink-0 flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[10px] font-mono text-muted hover:text-foreground transition"
              ><X size={9} />Clear</button>
            {/if}
          </div>
        {/if}

      </div>
    </div>

    <!-- Reminders panel -->
    <RemindersPanel />

    <!-- ═══════════ HABIT LIST ════════════════════════════════════════════════ -->
    <div class="mx-auto px-4 py-3 sm:px-6 {viewDensity === 'comfortable' ? 'max-w-6xl' : 'max-w-2xl'}">
      {#if filteredHabits.length === 0}
        <div class="py-16 text-center text-muted">
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
          class={`mx-auto w-full max-w-6xl px-4 py-3 sm:px-6 ${selectedTags.length === 0 ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' : ''}`}
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
                  <div class="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {#each group.habits as habit, idx (habit.id)}
                      <HabitTile
                        {habit}
                        {todayKey}
                        {todayDate}
                        appearanceIndex={idx}
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
        <div class="mx-auto flex w-full max-w-2xl flex-col px-4 py-3 sm:px-6" style="gap: 0.25rem;" role="list" aria-label="Habit list">
          {#if selectedTags.length === 0}
            <ul class="space-y-1" role="list">
              {#each filteredHabits as habit, idx (habit.id)}
                {@const accent = HABIT_COLOR_THEMES[habit.color]}
                {@const tgt = Math.max(1, habit.dailyTarget ?? 1)}
                {@const todayCount = habit.completions[todayKey] ?? 0}
                {@const completed = todayCount >= tgt}
                {@const status = getScheduleStatusForDate(habit, todayDate)}
                {@const isFrozen = status === 'frozen'}
                {@const isScheduled = isMandatoryToday(habit, todayDate)}
                {@const streak = calculateScheduledStreak(habit, habit.completions).current}
                {@const completionRate = calculateScheduledCompletionRate(habit, habit.completions)}
                {@const last7 = buildLast7(habit)}
                {@const hint = computeTileHint(habit, completionRate, streak)}
                {@const phase = getHabitPhase(streak)}
                {@const isAnimating = animatingHabitId === habit.id}
                {@const dropHintPosition = dropHint?.habitId === habit.id ? dropHint.position : null}
                {@const showDropAbove = dropHintPosition === 'above'}
                {@const showDropBelow = dropHintPosition === 'below'}
                {@const dropTransformClass = dropHintPosition === 'above' ? '-translate-y-2' : dropHintPosition === 'below' ? 'translate-y-2' : ''}
                {@const isSwipeRow = swipeHabitId === habit.id}
                {@const indicatorOpacity = isSwipeRow ? Math.min(1, Math.abs(swipeOffset) / 120) : 0}
                {@const indicatorColor = swipeDirection === 'right' ? 'rgba(16, 185, 129, 0.25)' : swipeDirection === 'left' ? 'rgba(59, 130, 246, 0.25)' : 'transparent'}
                {@const inlineTags = habit.tags.slice(0, 3)}
                {@const extraTagCount = Math.max(0, habit.tags.length - inlineTags.length)}
                <li
                  data-habit-id={habit.id}
                  role="listitem"
                  class="group relative transition-all duration-200 animate-fade-slide-up
                    {dragId && dragId !== habit.id ? 'opacity-50 scale-[0.97]' : ''}
                    {dragId === habit.id ? 'ring-2 ring-accent/40 rounded-2xl' : ''}
                    {dropTransformClass}"
                  style:animation-delay="{Math.min(idx, 12) * 0.05}s"
                  draggable={isDragActive()}
                  ondragstart={(e) => isDragActive() && onDragStart(e, habit.id)}
                  ondragover={(e) => isDragActive() && onDragOver(e, habit.id)}
                  ondragleave={(e) => isDragActive() && onDragLeave(e)}
                  ondrop={(e) => isDragActive() && void onDrop(e, habit.id)}
                  ondragend={() => isDragActive() && onDragEnd()}
                  ontouchstart={(e) => onRowTouchStart(e, habit.id)}
                  ontouchmove={(e) => onRowTouchMove(e, habit)}
                  ontouchend={onRowTouchEnd}
                  ontouchcancel={onRowTouchEnd}
                >
                  {#if showDropAbove}
                    <div class="absolute -top-1 inset-x-0 h-0.5 rounded-full bg-gradient-to-r from-transparent via-accent to-transparent animate-progress-glow z-10 pointer-events-none"></div>
                  {/if}
                  {#if showDropBelow}
                    <div class="absolute -bottom-1 inset-x-0 h-0.5 rounded-full bg-gradient-to-r from-transparent via-accent to-transparent animate-progress-glow z-10 pointer-events-none"></div>
                  {/if}

                  <div
                    class="habit-card-inner flex items-center rounded-2xl border bg-bg-card px-4 py-3 transition-all duration-150 cursor-pointer overflow-hidden
                      {dragOverId === habit.id ? 'border-accent/50' : 'border-border hover:border-border-hover'}
                      {isFrozen ? 'opacity-75' : ''}"
                    role="button"
                    tabindex="0"
                    aria-label="{habit.name}, {completed ? 'completed' : 'not completed'}"
                    style:transform={isSwipeRow ? `translateX(${swipeOffset}px)` : 'translateX(0px)'}
                    style:transition={isSwipeRow && isSwipingGesture ? 'none' : 'transform 0.2s ease-out'}
                    style:touch-action="pan-y"
                    style:will-change="transform"
                    style:width="100%"
                    onclick={() => navigateToDetail(habit.id)}
                    onkeydown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); navigateToDetail(habit.id); }
                      else if (e.key === ' ') { e.preventDefault(); void toggleHabit(habit); }
                    }}
                  >
                    <span class="absolute inset-y-0 left-0 w-1 rounded-l-2xl pointer-events-none" style:background={accent.hex}></span>
                    <span
                      class="habit-card-swipe-indicator"
                      style:opacity={indicatorOpacity}
                      style:background-color={indicatorColor}
                    ></span>

                    <div class="relative z-10 flex w-full items-center gap-3">
                      {#if isDragActive()}
                        <button
                          type="button"
                          class="flex-shrink-0 cursor-grab active:cursor-grabbing text-border/60 hover:text-muted transition-colors touch-none"
                          aria-label="Reorder {habit.name}"
                          onclick={(e) => { e.stopPropagation(); }}
                          ontouchstart={(e) => onGripTouchStart(e, habit.id)}
                        >
                          <GripVertical size={14} />
                        </button>
                      {/if}

                      <div class="relative flex-shrink-0">
                        {#if isAnimating}
                          {#each animParticles as p (p.id)}
                            <span
                              class="confetti-particle"
                              style="--tx: {p.tx}px; --ty: {p.ty}px; background: {p.color}; left: 50%; top: 50%; margin-left: -3px; margin-top: -3px;"
                            ></span>
                          {/each}
                        {/if}
                        <button
                          type="button"
                          aria-label="{completed ? 'Undo' : 'Complete'} {habit.name}"
                          onclick={(e) => { e.stopPropagation(); void toggleHabit(habit); }}
                          disabled={isFrozen}
                          class="relative flex h-8 w-8 items-center justify-center rounded-xl border-[1.5px] transition-all duration-200 overflow-hidden
                            {completed ? `${accent.bgClass} ${accent.borderClass}` : isScheduled ? 'border-border-hover hover:border-muted' : isFrozen ? 'border-border bg-bg-secondary text-muted cursor-not-allowed opacity-60' : 'border border-dashed border-border/40 text-muted hover:border-border'}
                            {isAnimating ? 'animate-check-pulse animate-glow-burst' : ''}"
                          style={completed && !isFrozen ? `box-shadow: 0 0 12px ${accent.glow}` : ''}
                        >
                          {#if tgt > 1}
                            {@const prog = Math.min(Math.max(todayCount, 0), tgt) / tgt}
                            <span class="absolute inset-[2px] rounded-full pointer-events-none overflow-hidden" aria-hidden="true">
                              <span
                                class="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
                                style="width: {prog * 100}%; background: linear-gradient(90deg, {accent.hex}55, {accent.hex});"
                              ></span>
                            </span>
                          {/if}
                          {#if isFrozen}
                            <SnowflakeIcon size={13} class="text-muted z-10 relative" />
                          {:else if completed}
                            <svg viewBox="0 0 12 12" class="h-4 w-4 z-10 relative {accent.textClass}">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                          {:else if tgt > 1}
                            <span class="text-[10px] font-mono z-10 relative" style="color: {accent.hex}">{todayCount}/{tgt}</span>
                          {/if}
                        </button>
                      </div>

                      <div class="flex min-w-0 flex-1 items-center gap-3 text-left">
                        <span class="flex-shrink-0 text-xl leading-none">{habit.icon}</span>
                        <div class="min-w-0 flex-1">
                          <div class="flex items-center gap-1 overflow-hidden">
                            <p class="min-w-0 truncate text-sm font-semibold text-foreground {completed ? 'opacity-60 line-through' : ''}">{habit.name}</p>
                            {#if tgt > 1}
                              <span class="flex-shrink-0 rounded bg-accent/10 px-1 py-0.5 text-[10px] font-mono text-accent-secondary">×{tgt}</span>
                            {/if}
                            {#if habit.description}
                              <span class="flex-shrink-0"><DescriptionTooltip description={habit.description} /></span>
                            {/if}
                            {#if inlineTags.length > 0}
                              <div class="hidden flex-shrink-0 items-center gap-1 sm:flex">
                                {#each inlineTags as tag, ti (tag + '-' + ti)}
                                  <span class="whitespace-nowrap rounded bg-accent/10 px-1 py-0.5 text-[10px] font-mono text-accent-secondary">#{tag}</span>
                                {/each}
                                {#if extraTagCount > 0}
                                  <span class="rounded bg-accent/10 px-1 py-0.5 text-[10px] font-mono text-accent-secondary">+{extraTagCount}</span>
                                {/if}
                              </div>
                            {/if}
                          </div>

                          {#if isFrozen}
                            <span class="inline-flex items-center gap-0.5 text-[10px] font-mono text-muted">
                              <SnowflakeIcon size={8} /> Frozen
                            </span>
                          {:else if !isScheduled}
                            <span class="inline-flex items-center gap-0.5 text-[10px] font-mono text-muted">
                              <Moon size={8} /> Not today
                            </span>
                          {/if}

                          {#if hint}
                            {@const hc = hint.type === 'good' ? 'text-accent' : hint.type === 'warn' ? 'text-accent-secondary' : 'text-muted'}
                            <p class="mt-0.5 truncate text-[10px] font-mono {hc}">{hint.text}</p>
                          {/if}
                        </div>
                      </div>

                      <div class="flex flex-shrink-0 items-center gap-2">
                        <ChartGuideTooltip
                          title={`${habit.name} row`}
                          summary="This row condenses one habit into a fast scan: current status, short-term history, completion rate, and a direct action button."
                          focusPoints={[
                            'Status and tags: see whether the habit is due, frozen, or off-schedule today.',
                            'Right-side metrics: streak, rate ring, and recent bars reveal momentum.',
                            'Toggle button: update today without leaving the dashboard.'
                          ]}
                          variant="columns"
                          triggerClassName="hidden h-7 w-7 sm:inline-flex"
                        />
                        {#if streak > 0}
                          <span class="hidden items-center gap-0.5 text-[10px] font-mono text-accent-secondary sm:flex">
                            {#if habit.type === 'negative'}
                              <Trophy size={10} />
                            {:else if phase.id === 1}
                              <Shield size={10} />
                            {:else if phase.id === 2}
                              <Zap size={10} />
                            {:else if phase.id === 3}
                              <Activity size={10} />
                            {:else}
                              <Star size={10} />
                            {/if}
                            {streak}
                          </span>
                        {/if}
                        <CompletionRing percentage={completionRate} size={26} strokeWidth={2.5} color={habit.color} showText={false} />
                        <div class="hidden h-4 items-end gap-[2px] sm:flex">
                          {#each last7 as done, lj ('' + lj)}
                            <div
                              class="w-[3px] rounded-sm transition-all"
                              style="height: {done ? '100%' : '30%'}; background-color: {done ? accent.hex : 'var(--border)'}; opacity: {0.4 + lj * 0.09}"
                            ></div>
                          {/each}
                        </div>
                        <div class="hidden lg:block">
                          <MiniHeatmap completions={habit.completions} dailyTarget={habit.dailyTarget} color={habit.color} />
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              {/each}
            </ul>
          {:else}
            {#each groupedHabits as group (group.tag ?? 'all')}
              {#if group.tag}
                <div class="mb-3 space-y-1">
                  <div class="flex items-center gap-2 px-1">
                    <span class="h-1.5 w-1.5 rounded-full bg-accent"></span>
                    <h3 class="text-[10px] font-mono font-bold uppercase tracking-widest text-muted">{group.tag}</h3>
                  </div>
                  <ul class="space-y-1" role="list">
                    {#each group.habits as habit, idx (habit.id)}
              {@const accent = HABIT_COLOR_THEMES[habit.color]}
              {@const tgt = Math.max(1, habit.dailyTarget ?? 1)}
              {@const todayCount = habit.completions[todayKey] ?? 0}
              {@const completed = todayCount >= tgt}
              {@const status = getScheduleStatusForDate(habit, todayDate)}
              {@const isFrozen = status === 'frozen'}
              {@const isScheduled = isMandatoryToday(habit, todayDate)}
              {@const streak = calculateScheduledStreak(habit, habit.completions).current}
              {@const completionRate = calculateScheduledCompletionRate(habit, habit.completions)}
              {@const last7 = buildLast7(habit)}
              {@const hint = computeTileHint(habit, completionRate, streak)}
              {@const phase = getHabitPhase(streak)}
              {@const isAnimating = animatingHabitId === habit.id}
              {@const dropHintPosition = dropHint?.habitId === habit.id ? dropHint.position : null}
              {@const showDropAbove = dropHintPosition === 'above'}
              {@const showDropBelow = dropHintPosition === 'below'}
              {@const dropTransformClass = dropHintPosition === 'above' ? '-translate-y-2' : dropHintPosition === 'below' ? 'translate-y-2' : ''}
              {@const isSwipeRow = swipeHabitId === habit.id}
              {@const indicatorOpacity = isSwipeRow ? Math.min(1, Math.abs(swipeOffset) / 120) : 0}
              {@const indicatorColor = swipeDirection === 'right' ? 'rgba(16, 185, 129, 0.25)' : swipeDirection === 'left' ? 'rgba(59, 130, 246, 0.25)' : 'transparent'}
              {@const inlineTags = habit.tags.slice(0, 3)}
              {@const extraTagCount = Math.max(0, habit.tags.length - inlineTags.length)}
              <li
                data-habit-id={habit.id}
                role="listitem"
                class="group relative transition-all duration-200 animate-fade-slide-up
                  {dragId && dragId !== habit.id ? 'opacity-50 scale-[0.97]' : ''}
                  {dragId === habit.id ? 'ring-2 ring-accent/40 rounded-2xl' : ''}
                  {dropTransformClass}"
                style:animation-delay="{Math.min(idx, 12) * 0.05}s"
                draggable={isDragActive()}
                ondragstart={(e) => isDragActive() && onDragStart(e, habit.id)}
                ondragover={(e) => isDragActive() && onDragOver(e, habit.id)}
                ondragleave={(e) => isDragActive() && onDragLeave(e)}
                ondrop={(e) => isDragActive() && void onDrop(e, habit.id)}
                ondragend={() => isDragActive() && onDragEnd()}
                ontouchstart={(e) => onRowTouchStart(e, habit.id)}
                ontouchmove={(e) => onRowTouchMove(e, habit)}
                ontouchend={onRowTouchEnd}
                ontouchcancel={onRowTouchEnd}
              >
                <!-- Drop indicator line -->
                {#if showDropAbove}
                  <div class="absolute -top-1 inset-x-0 h-0.5 rounded-full bg-gradient-to-r from-transparent via-accent to-transparent animate-progress-glow z-10 pointer-events-none"></div>
                {/if}
                {#if showDropBelow}
                  <div class="absolute -bottom-1 inset-x-0 h-0.5 rounded-full bg-gradient-to-r from-transparent via-accent to-transparent animate-progress-glow z-10 pointer-events-none"></div>
                {/if}

                <div
                  class="habit-card-inner flex items-center rounded-2xl border bg-bg-card px-4 py-3 transition-all duration-150 cursor-pointer overflow-hidden
                    {dragOverId === habit.id ? 'border-accent/50' : 'border-border hover:border-border-hover'}
                    {isFrozen ? 'opacity-75' : ''}"
                  role="button"
                  tabindex="0"
                  aria-label="{habit.name}, {completed ? 'completed' : 'not completed'}"
                  style:transform={isSwipeRow ? `translateX(${swipeOffset}px)` : 'translateX(0px)'}
                  style:transition={isSwipeRow && isSwipingGesture ? 'none' : 'transform 0.2s ease-out'}
                  style:touch-action="pan-y"
                  style:will-change="transform"
                  style:width="100%"
                  onclick={() => navigateToDetail(habit.id)}
                  onkeydown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); navigateToDetail(habit.id); }
                    else if (e.key === ' ') { e.preventDefault(); void toggleHabit(habit); }
                  }}
                >
                  <span class="absolute inset-y-0 left-0 w-1 rounded-l-2xl pointer-events-none" style:background={accent.hex}></span>
                  <span
                    class="habit-card-swipe-indicator"
                    style:opacity={indicatorOpacity}
                    style:background-color={indicatorColor}
                  ></span>

                  <div class="relative z-10 flex w-full items-center gap-3">
                    {#if isDragActive()}
                      <button
                        type="button"
                        class="flex-shrink-0 cursor-grab active:cursor-grabbing text-border/60 hover:text-muted transition-colors touch-none"
                        aria-label="Reorder {habit.name}"
                        onclick={(e) => { e.stopPropagation(); }}
                        ontouchstart={(e) => onGripTouchStart(e, habit.id)}
                      >
                        <GripVertical size={14} />
                      </button>
                    {/if}

                    <!-- Toggle button with particle burst -->
                    <div class="relative flex-shrink-0">
                      {#if isAnimating}
                        {#each animParticles as p (p.id)}
                          <span
                            class="confetti-particle"
                            style="--tx: {p.tx}px; --ty: {p.ty}px; background: {p.color}; left: 50%; top: 50%; margin-left: -3px; margin-top: -3px;"
                          ></span>
                        {/each}
                      {/if}
                      <button
                        type="button"
                        aria-label="{completed ? 'Undo' : 'Complete'} {habit.name}"
                        onclick={(e) => { e.stopPropagation(); void toggleHabit(habit); }}
                        disabled={isFrozen}
                        class="relative flex h-8 w-8 items-center justify-center rounded-xl border-[1.5px] transition-all duration-200 overflow-hidden
                          {completed ? `${accent.bgClass} ${accent.borderClass}` : isScheduled ? 'border-border-hover hover:border-muted' : isFrozen ? 'border-border bg-bg-secondary text-muted cursor-not-allowed opacity-60' : 'border border-dashed border-border/40 text-muted hover:border-border'}
                          {isAnimating ? 'animate-check-pulse animate-glow-burst' : ''}"
                        style={completed && !isFrozen ? `box-shadow: 0 0 12px ${accent.glow}` : ''}
                      >
                        {#if tgt > 1}
                          {@const prog = Math.min(Math.max(todayCount, 0), tgt) / tgt}
                          <span class="absolute inset-[2px] rounded-full pointer-events-none overflow-hidden" aria-hidden="true">
                            <span
                              class="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
                              style="width: {prog * 100}%; background: linear-gradient(90deg, {accent.hex}55, {accent.hex});"
                            ></span>
                          </span>
                        {/if}
                        {#if isFrozen}
                          <SnowflakeIcon size={13} class="text-muted z-10 relative" />
                        {:else if completed}
                          <svg viewBox="0 0 12 12" class="h-4 w-4 z-10 relative {accent.textClass}">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        {:else if tgt > 1}
                          <span class="text-[10px] font-mono z-10 relative" style="color: {accent.hex}">{todayCount}/{tgt}</span>
                        {/if}
                      </button>
                    </div>

                    <!-- Habit info (clickable) -->
                    <div class="flex flex-1 items-center gap-3 text-left min-w-0">
                      <span class="text-xl leading-none flex-shrink-0">{habit.icon}</span>
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-1 overflow-hidden">
                          <p class="min-w-0 truncate text-sm font-semibold text-foreground {completed ? 'opacity-60 line-through' : ''}">{habit.name}</p>
                          {#if tgt > 1}
                            <span class="flex-shrink-0 text-[10px] font-mono px-1 rounded bg-accent/10 text-accent-secondary">×{tgt}</span>
                          {/if}
                          {#if habit.description}
                            <span class="flex-shrink-0"><DescriptionTooltip description={habit.description} /></span>
                          {/if}
                          {#if inlineTags.length > 0}
                            <div class="hidden sm:flex items-center gap-1 flex-shrink-0">
                              {#each inlineTags as tag, ti (tag + '-' + ti)}
                                <span class="whitespace-nowrap rounded bg-accent/10 px-1 py-0.5 text-[10px] font-mono text-accent-secondary">#{tag}</span>
                              {/each}
                              {#if extraTagCount > 0}
                                <span class="rounded bg-accent/10 px-1 py-0.5 text-[10px] font-mono text-accent-secondary">+{extraTagCount}</span>
                              {/if}
                            </div>
                          {/if}
                        </div>

                        {#if isFrozen}
                          <span class="inline-flex items-center gap-0.5 text-[10px] font-mono text-muted">
                            <SnowflakeIcon size={8} /> Frozen
                          </span>
                        {:else if !isScheduled}
                          <span class="inline-flex items-center gap-0.5 text-[10px] font-mono text-muted">
                            <Moon size={8} /> Not today
                          </span>
                        {/if}

                        {#if hint}
                          {@const hc = hint.type === 'good' ? 'text-accent' : hint.type === 'warn' ? 'text-accent-secondary' : 'text-muted'}
                          <p class="mt-0.5 text-[10px] font-mono truncate {hc}">{hint.text}</p>
                        {/if}
                      </div>
                    </div>

                    <!-- Right metrics -->
                    <div class="flex flex-shrink-0 items-center gap-2">
                      <ChartGuideTooltip
                        title={`${habit.name} row`}
                        summary="This row condenses one habit into a fast scan: current status, short-term history, completion rate, and a direct action button."
                        focusPoints={[
                          'Status and tags: see whether the habit is due, frozen, or off-schedule today.',
                          'Right-side metrics: streak, rate ring, and recent bars reveal momentum.',
                          'Toggle button: update today without leaving the dashboard.'
                        ]}
                        variant="columns"
                        triggerClassName="hidden h-7 w-7 sm:inline-flex"
                      />
                      {#if streak > 0}
                        <span class="hidden items-center gap-0.5 text-[10px] font-mono text-accent-secondary sm:flex">
                          {#if habit.type === 'negative'}
                            <Trophy size={10} />
                          {:else if phase.id === 1}
                            <Shield size={10} />
                          {:else if phase.id === 2}
                            <Zap size={10} />
                          {:else if phase.id === 3}
                            <Activity size={10} />
                          {:else}
                            <Star size={10} />
                          {/if}
                          {streak}
                        </span>
                      {/if}
                      <CompletionRing percentage={completionRate} size={26} strokeWidth={2.5} color={habit.color} showText={false} />
                      <div class="hidden sm:flex items-end gap-[2px] h-4">
                        {#each last7 as done, lj ('' + lj)}
                          <div
                            class="w-[3px] rounded-sm transition-all"
                            style="height: {done ? '100%' : '30%'}; background-color: {done ? accent.hex : 'var(--border)'}; opacity: {0.4 + lj * 0.09}"
                          ></div>
                        {/each}
                      </div>
                      <div class="hidden lg:block">
                        <MiniHeatmap completions={habit.completions} dailyTarget={habit.dailyTarget} color={habit.color} />
                      </div>
                    </div>
                  </div>
                </div>
                </li>
                    {/each}
                  </ul>
                </div>
              {/if}
            {/each}
          {/if}
        </div>
      {/if}
    </div>

  </div>
{/if}
