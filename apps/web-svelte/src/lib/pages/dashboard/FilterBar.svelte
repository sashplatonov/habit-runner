<script lang="ts">
  import { GripVertical, LayoutGrid, List, Sparkles } from 'lucide-svelte';
  import ChartGuideTooltip from '$lib/components/ChartGuideTooltip.svelte';
  import { isMandatoryToday } from '$lib/habits/schedule';
  import type { Habit } from '$lib/types/habit';
  import type { DashboardFilter } from '$lib/dashboard/dashboardHelpers';

  export type ViewDensity = 'comfortable' | 'compact';

  let {
    filter = $bindable('all'),
    allTags,
    selectedTags = $bindable([]),
    habits,
    today,
    sortMode = $bindable('custom'),
    viewDensity = $bindable('compact'),
    searchQuery = $bindable('')
  }: {
    filter: DashboardFilter;
    allTags: string[];
    selectedTags: string[];
    habits: Habit[];
    today: string;
    sortMode: 'custom' | 'smart';
    viewDensity: ViewDensity;
    searchQuery: string;
  } = $props();

  function toggleTag(tag: string) {
    selectedTags = selectedTags.includes(tag) ? selectedTags.filter((t) => t !== tag) : [...selectedTags, tag];
  }

  const todayDate = $derived.by(() => { const d = new Date(today); d.setHours(0, 0, 0, 0); return d; });
  const pendingCount = $derived(
    habits.filter((h) => {
      if (h.archived) return false;
      if (!isMandatoryToday(h, todayDate)) return false;
      if (h.type === 'negative') return (h.completions[today] ?? 0) !== 0;
      return (h.completions[today] ?? 0) < Math.max(1, h.dailyTarget ?? 1);
    }).length
  );

  let isSticky = $state(false);
  let sentinelEl: HTMLDivElement | undefined = $state();

  $effect(() => {
    if (!sentinelEl) return;
    const observer = new IntersectionObserver(
      ([entry]) => { isSticky = entry.boundingClientRect.top < 0; },
      { threshold: [1] }
    );
    observer.observe(sentinelEl);
    return () => observer.disconnect();
  });

  const FILTERS: DashboardFilter[] = ['pending', 'all', 'done', 'archived'];
  const SORT_MODES = [
    { value: 'custom' as const, label: 'Custom' },
    { value: 'smart' as const, label: 'Smart' }
  ];
</script>

<div class="relative">
  <div bind:this={sentinelEl} class="absolute top-0 left-0 w-full h-px pointer-events-none" aria-hidden="true"></div>
  <div
    class="sticky top-[calc(var(--safe-area-inset-top,0px))] z-[70] transition-shadow duration-200 {isSticky ? 'shadow-[0_16px_30px_-24px_rgba(15,23,42,0.75)]' : ''}"
  >
    <div class="border-b border-border bg-bg-primary/95 backdrop-blur-sm px-4">
      <div class="max-w-2xl mx-auto">
        <div class="flex items-center gap-2 pt-3">
          <span class="text-[10px] font-mono text-muted uppercase tracking-wider">Dashboard filters</span>
          <ChartGuideTooltip
            title="Dashboard filters"
            summary="Use this control bar to narrow the dashboard to the habits that need attention, then switch sort and layout to review them faster."
            focusPoints={['Tabs: split today into pending, done, all, and archived views.', 'Search and tags: isolate one habit or one context quickly.', 'Sort and density: change scan order and switch between list and card views.']}
            variant="columns"
            triggerClassName="h-7 w-7"
          />
        </div>

        <!-- Filter tabs -->
        <div class="flex gap-0 overflow-x-auto no-scrollbar">
          {#each FILTERS as value}
            <button
              type="button"
              onclick={() => filter = value}
              class="px-4 py-2.5 text-xs font-mono uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap {filter === value ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-foreground'}"
            >
              {value}
              {#if value === 'pending' && pendingCount > 0}
                <span class="ml-1.5 text-[9px] font-mono rounded px-1 py-0.5 border border-accent/40 bg-accent/10 text-accent">
                  {pendingCount}
                </span>
              {/if}
            </button>
          {/each}
        </div>

        <!-- Search + sort + density -->
        <div class="flex items-center gap-2 py-3 border-t border-border/40">
          <!-- Search bar -->
          <div class="relative flex-1">
            <input
              type="text"
              placeholder="Search habits..."
              bind:value={searchQuery}
              class="w-full bg-bg-secondary border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent transition-all pl-10"
            />
            <div class="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            {#if searchQuery}
              <button
                onclick={() => searchQuery = ''}
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            {/if}
          </div>

          <!-- Sort toggle -->
          <div class="flex items-center gap-1">
            <div class="flex items-center gap-1.5 p-0.5 bg-bg-secondary rounded-lg border border-border/50">
              {#each SORT_MODES as mode}
                <button
                  type="button"
                  onclick={() => sortMode = mode.value}
                  class="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all duration-200 {sortMode === mode.value ? 'bg-bg-primary text-accent shadow-sm ring-1 ring-border' : 'text-muted hover:text-foreground'}"
                >
                  {#if mode.value === 'custom'}<GripVertical size={11} />{:else}<Sparkles size={11} />{/if}
                  {mode.label}
                </button>
              {/each}
            </div>
            <ChartGuideTooltip
              title="Smart Sort"
              summary="Habits are ranked by how much attention they need right now, based on behavioural science research. The most fragile habits always appear first."
              focusPoints={['Young habits (<21 days): maximally fragile — Lally et al., 2010.', 'Low 30-day completion rate signals a habit losing traction.', 'Recent miss (1–3 days ago) is the highest abandonment risk signal.', 'Evening reminders rank higher due to ego depletion — Baumeister.', "Negative habits (DON'T do X) are inherently harder than positive ones."]}
              variant="columns"
              triggerClassName="h-6 w-6"
            />
          </div>

          <!-- Density toggle -->
          <div class="flex items-center gap-1 bg-bg-secondary border border-border/50 rounded-lg p-0.5">
            <button
              type="button"
              onclick={() => viewDensity = 'comfortable'}
              aria-pressed={viewDensity === 'comfortable'}
              aria-label="Grid view"
              class="w-8 h-8 flex items-center justify-center rounded-md transition-colors {viewDensity === 'comfortable' ? 'bg-bg-primary border border-border/50 text-foreground shadow-sm' : 'text-muted hover:text-foreground'}"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onclick={() => viewDensity = 'compact'}
              aria-pressed={viewDensity === 'compact'}
              aria-label="List view"
              class="w-8 h-8 flex items-center justify-center rounded-md transition-colors {viewDensity === 'compact' ? 'bg-bg-primary border border-border/50 text-foreground shadow-sm' : 'text-muted hover:text-foreground'}"
            >
              <List size={16} />
            </button>
          </div>
        </div>

        <!-- Tag filter row -->
        <div class="py-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {#if allTags.length === 0}
            <span class="text-[10px] font-mono text-muted">No tags yet</span>
          {:else}
            {#each allTags as tag}
              <button
                type="button"
                onclick={() => toggleTag(tag)}
                class="text-[10px] font-mono px-2 py-1 rounded border whitespace-nowrap transition-colors {selectedTags.includes(tag) ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-bg-secondary border-border text-muted hover:text-foreground hover:border-border-hover'}"
              >
                #{tag}
              </button>
            {/each}
            {#if selectedTags.length > 0}
              <button
                type="button"
                onclick={() => selectedTags = []}
                class="text-[10px] font-mono px-2 py-1 rounded border whitespace-nowrap bg-bg-secondary border-accent/30 text-accent hover:bg-accent/10 transition-colors"
              >
                Clear tags
              </button>
            {/if}
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>
