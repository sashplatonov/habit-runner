<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { Flame, Plus, Search, Zap, TrendingUp, GripVertical } from 'lucide-svelte';
  import CompletionRing from '$lib/components/CompletionRing.svelte';
  import MiniHeatmap from '$lib/components/MiniHeatmap.svelte';
  import Onboarding from '$lib/components/Onboarding.svelte';
  import RemindersPanel from '$lib/components/RemindersPanel.svelte';
  import type { OnboardingTemplate } from '$lib/components/onboarding';
  import { formatAppDate } from '@/lib/i18n';
  import { calculateScheduledCompletionRate, calculateScheduledStreak, getScheduleStatusForDate } from '$lib/habits/schedule';
  import { formatDate } from '$lib/habits/habitStats';
  import { habitsStore } from '$lib/stores/habits';
  import { HABIT_COLOR_THEMES } from '$lib/theme/habit-colors';
  import type { Habit } from '@/types/habit';

  type DashboardFilter = 'all' | 'pending' | 'done' | 'archived';

  let addingTemplate = $state<string | null>(null);
  let filter = $state<DashboardFilter>('all');
  let searchQuery = $state('');

  const todayDate = $derived.by(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); });
  const todayKey = $derived(formatDate(todayDate));
  const dateStr = $derived(formatAppDate(todayDate, { weekday: 'long', month: 'short', day: 'numeric' }));

  const activeHabits = $derived($habitsStore.habits);

  const scheduledToday = $derived(
    activeHabits.filter((h) => getScheduleStatusForDate(h, todayDate) === 'scheduled')
  );

  const completedTodayCount = $derived(
    scheduledToday.filter((h) => {
      const target = Math.max(1, h.dailyTarget ?? 1);
      return (h.completions[todayKey] ?? 0) >= target;
    }).length
  );

  const todayRate = $derived(
    scheduledToday.length > 0 ? Math.round((completedTodayCount / scheduledToday.length) * 100) : 0
  );

  const overallStreak = $derived.by(() => {
    if (activeHabits.length === 0) { return 0; }
    return Math.max(...activeHabits.map((h) => calculateScheduledStreak(h, h.completions).current));
  });

  const filteredHabits = $derived.by(() => {
    let list: Habit[];
    switch (filter) {
      case 'pending':
        list = activeHabits.filter((h) => {
          const target = Math.max(1, h.dailyTarget ?? 1);
          return (h.completions[todayKey] ?? 0) < target;
        });
        break;
      case 'done':
        list = activeHabits.filter((h) => {
          const target = Math.max(1, h.dailyTarget ?? 1);
          return (h.completions[todayKey] ?? 0) >= target;
        });
        break;
      case 'archived':
        list = $habitsStore.allHabits.filter((h) => h.archived);
        break;
      default:
        list = activeHabits;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  });

  function buildLast7(habit: Habit, todayStart: Date) {
    return Array.from({ length: 7 }, (_, i) => {
      const key = formatDate(new Date(todayStart.getTime() + (i - 6) * 86_400_000));
      const target = Math.max(1, habit.dailyTarget ?? 1);
      return (habit.completions[key] ?? 0) >= target;
    });
  }

  async function toggleHabit(habit: Habit) {
    await habitsStore.advanceCompletionCount(habit.id, todayKey);
  }

  function navigateToDetail(habitId: string) {
    void goto(resolve('/(protected)/habit/[id]', { id: habitId }));
  }

  function navigateToNewHabit() {
    void goto(resolve<'/(protected)/habit/new'>('/(protected)/habit/new', {}));
  }

  // Drag-and-drop reorder (only in 'all' view with no search)
  let dragId = $state<string | null>(null);
  let dragOverId = $state<string | null>(null);

  function isDragActive() {
    return filter === 'all' && !searchQuery.trim();
  }

  function onDragStart(e: DragEvent, habitId: string) {
    dragId = habitId;
    e.dataTransfer!.effectAllowed = 'move';
    e.dataTransfer!.setData('text/plain', habitId);
  }

  function onDragOver(e: DragEvent, habitId: string) {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
    if (habitId !== dragId) dragOverId = habitId;
  }

  function onDragLeave() {
    dragOverId = null;
  }

  async function onDrop(e: DragEvent, targetId: string) {
    e.preventDefault();
    dragOverId = null;
    if (!dragId || dragId === targetId) { dragId = null; return; }
    const items = [...filteredHabits];
    const fromIdx = items.findIndex((h) => h.id === dragId);
    const toIdx = items.findIndex((h) => h.id === targetId);
    if (fromIdx < 0 || toIdx < 0) { dragId = null; return; }
    items.splice(toIdx, 0, items.splice(fromIdx, 1)[0]);
    const step = 1_000;
    const base = Date.now();
    for (let i = 0; i < items.length; i++) {
      const newOrder = base + i * step;
      if (items[i].sortOrder !== newOrder) {
        void habitsStore.updateHabit(items[i].id, { sortOrder: newOrder });
      }
    }
    dragId = null;
  }

  function onDragEnd() {
    dragId = null;
    dragOverId = null;
  }

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
      await goto(resolve('/(protected)/habit/[id]', { id: habitId }));
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
    <!-- Hero -->
    <div class="border-b border-border bg-bg-secondary/50 px-4 py-4 backdrop-blur-sm">
      <div class="mx-auto max-w-2xl">
        <p class="text-[11px] font-mono uppercase tracking-widest text-muted">{dateStr}</p>
        <div class="mt-3 flex items-center gap-4">
          <CompletionRing percentage={todayRate} size={52} strokeWidth={4} showText={true} />
          <div class="grid flex-1 grid-cols-3 gap-2">
            <div class="rounded-xl border border-border bg-bg-card px-3 py-2">
              <div class="mb-1 flex items-center gap-1">
                <Zap size={10} class="text-accent" />
                <span class="text-[10px] font-mono uppercase tracking-wider text-muted">Active</span>
              </div>
              <span class="text-base font-mono font-bold text-foreground">{activeHabits.length}</span>
            </div>
            <div class="rounded-xl border border-border bg-bg-card px-3 py-2">
              <div class="mb-1 flex items-center gap-1">
                <Flame size={10} class="text-accent-secondary" />
                <span class="text-[10px] font-mono uppercase tracking-wider text-muted">Streak</span>
              </div>
              <span class="text-base font-mono font-bold text-accent-secondary">{overallStreak}d</span>
            </div>
            <div class="rounded-xl border border-border bg-bg-card px-3 py-2">
              <div class="mb-1 flex items-center gap-1">
                <TrendingUp size={10} class="text-accent-secondary" />
                <span class="text-[10px] font-mono uppercase tracking-wider text-muted">Done</span>
              </div>
              <span class="text-base font-mono font-bold text-accent-secondary">{completedTodayCount}</span>
            </div>
          </div>
        </div>

        {#if todayRate >= 100}
          <div class="mt-3 flex items-center gap-3 rounded-xl border border-accent-secondary/30 bg-accent-secondary/5 px-4 py-2.5">
            <span class="text-lg" role="img" aria-label="celebration">🎉</span>
            <div>
              <p class="text-sm font-semibold text-foreground">Perfect day!</p>
              <p class="text-[11px] font-mono text-muted">All habits completed. Keep the streak alive!</p>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Controls -->
    <div class="sticky top-0 z-10 border-b border-border bg-bg-primary/90 px-4 py-3 backdrop-blur-sm">
      <div class="mx-auto max-w-2xl">
        <div class="flex items-center gap-2">
          <!-- Filter tabs -->
          <div class="flex flex-1 gap-1 overflow-x-auto">
            {#each (['all', 'pending', 'done', 'archived'] as const) as f, fi (f + '-' + fi)}
              <button
                type="button"
                class="flex-shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider transition {filter === f ? 'bg-accent/15 text-accent' : 'text-muted hover:text-foreground'}"
                onclick={() => { filter = f; }}
              >
                {f}
              </button>
            {/each}
          </div>
          <!-- Add habit -->
          <button
            type="button"
            class="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-accent text-bg-primary transition hover:opacity-90"
            aria-label="Add habit"
            onclick={navigateToNewHabit}
          >
            <Plus size={16} />
          </button>
        </div>
        <!-- Search -->
        <div class="relative mt-2">
          <Search size={13} class="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            placeholder="Search habits..."
            bind:value={searchQuery}
            class="w-full rounded-xl border border-border bg-bg-secondary py-2 pl-8 pr-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>
      </div>
    </div>

    <!-- Reminders panel (push notification opt-in) -->
    <RemindersPanel />

    <!-- Habit list -->
    <div class="mx-auto max-w-2xl px-4 py-3">
      {#if filteredHabits.length === 0}
        <div class="py-16 text-center text-muted">
          <p class="text-4xl mb-3">
            {filter === 'pending' ? '🎉' : filter === 'done' ? '✨' : filter === 'archived' ? '🗂️' : '👋'}
          </p>
          <p class="text-lg font-semibold text-foreground">
            {filter === 'pending' ? 'All done for today!' : filter === 'done' ? 'No completed habits yet' : filter === 'archived' ? 'No archived habits' : 'No habits found'}
          </p>
          {#if filter === 'all' && !searchQuery}
            <button
              type="button"
              onclick={navigateToNewHabit}
              class="mt-4 rounded-2xl bg-accent px-5 py-2 text-sm font-semibold uppercase tracking-widest text-bg-primary transition hover:opacity-90"
            >
              Add a habit
            </button>
          {/if}
        </div>
      {:else}
        <ul class="space-y-2">
          {#each filteredHabits as habit (habit.id)}
            {@const accent = HABIT_COLOR_THEMES[habit.color]}
            {@const target = Math.max(1, habit.dailyTarget ?? 1)}
            {@const todayCount = habit.completions[todayKey] ?? 0}
            {@const completed = todayCount >= target}
            {@const isFrozen = getScheduleStatusForDate(habit, todayDate) === 'frozen'}
            {@const isScheduled = getScheduleStatusForDate(habit, todayDate) === 'scheduled'}
            {@const streak = calculateScheduledStreak(habit, habit.completions).current}
            {@const completionRate = calculateScheduledCompletionRate(habit, habit.completions)}
            {@const last7 = buildLast7(habit, todayDate)}
            <li
              class="group relative transition-opacity {dragId && dragId !== habit.id ? 'opacity-60' : ''} {dragOverId === habit.id ? 'scale-[1.01]' : ''}"
              draggable={isDragActive()}
              ondragstart={(e) => isDragActive() && onDragStart(e, habit.id)}
              ondragover={(e) => isDragActive() && onDragOver(e, habit.id)}
              ondragleave={() => isDragActive() && onDragLeave()}
              ondrop={(e) => isDragActive() && void onDrop(e, habit.id)}
              ondragend={() => isDragActive() && onDragEnd()}
            >
              <div class="flex items-center gap-3 rounded-2xl border {dragOverId === habit.id ? 'border-accent/50' : 'border-border'} bg-bg-card px-4 py-3 transition hover:border-border-hover">
                <!-- Drag handle (only when reorder is possible) -->
                {#if isDragActive()}
                  <span class="flex-shrink-0 cursor-grab active:cursor-grabbing text-border/60 hover:text-muted transition-colors">
                    <GripVertical size={14} />
                  </span>
                {/if}
                <!-- Toggle button -->
                <button
                  type="button"
                  aria-label="{completed ? 'Undo' : 'Complete'} {habit.name}"
                  onclick={(e) => { e.stopPropagation(); void toggleHabit(habit); }}
                  class="relative flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-full border-2 transition
                    {completed
                      ? `border-transparent`
                      : isScheduled
                        ? 'border-border-hover hover:border-muted'
                        : isFrozen
                          ? 'border-border bg-bg-secondary'
                          : 'border-dashed border-border/40 hover:border-border'}"
                  style={completed ? `background-color: ${accent.hex}22; border-color: ${accent.hex}66;` : ''}
                  disabled={isFrozen}
                >
                  {#if completed}
                    <svg viewBox="0 0 12 12" class="h-4 w-4" style="color: {accent.hex}">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  {:else if isFrozen}
                    <svg viewBox="0 0 12 12" class="h-3.5 w-3.5 text-muted">
                      <path d="M6 1v10M1 6h10M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
                    </svg>
                  {:else if target > 1}
                    <span class="text-[10px] font-mono" style="color: {accent.hex}">{todayCount}/{target}</span>
                  {/if}
                </button>

                <!-- Habit info (clickable) -->
                <button
                  type="button"
                  class="flex flex-1 items-center gap-3 text-left min-w-0"
                  onclick={() => navigateToDetail(habit.id)}
                >
                  <span class="text-xl leading-none flex-shrink-0">{habit.icon}</span>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-semibold text-foreground {completed ? 'opacity-60' : ''}">{habit.name}</p>
                        {#if habit.tags.length > 0}
                      <div class="mt-0.5 flex gap-1 flex-wrap">
                        {#each habit.tags.slice(0, 3) as tag, tIdx (tag + '-' + tIdx)}
                          <span class="rounded-full border border-border px-1.5 py-0.5 text-[10px] font-mono text-muted">{tag}</span>
                        {/each}
                      </div>
                    {/if}
                  </div>
                </button>

                <!-- Metrics (non-interactive) -->
                <div class="flex flex-shrink-0 items-center gap-2" aria-hidden="true">
                  {#if streak > 0}
                    <span class="hidden items-center gap-0.5 text-[10px] font-mono text-accent-secondary sm:flex">
                      <Flame size={10} />
                      {streak}
                    </span>
                  {/if}
                  <CompletionRing percentage={completionRate} size={26} strokeWidth={2.5} color={habit.color} showText={false} />
                  <div class="hidden sm:flex items-end gap-[2px] h-4">
                    {#each last7 as done, lj (done + '-' + lj)}
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
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>
{/if}
