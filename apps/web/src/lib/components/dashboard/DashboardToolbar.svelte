<script lang="ts">
  import {
    ArchiveIcon,
    CheckIcon,
    ChevronDownIcon,
    Grid3x3Icon,
    ListFilterIcon,
    PlusIcon,
    SearchIcon,
    SlidersHorizontalIcon,
    TagIcon,
    XIcon
  } from 'lucide-svelte';
  import DashboardIconButton from '$lib/components/dashboard/DashboardIconButton.svelte';

  type Filter = 'pending' | 'all' | 'done' | 'archived';
  type SortMode = 'custom' | 'smart';
  type ViewDensity = 'comfortable' | 'compact';

  type Props = {
    filter: Filter;
    searchQuery: string;
    sortMode: SortMode;
    viewDensity: ViewDensity;
    pendingCount: number;
    activeTags: string[];
    availableTags: string[];
    onFilterChange: (filter: Filter) => void | Promise<void>;
    onSearchChange: (query: string) => void | Promise<void>;
    onClearSearch: () => void | Promise<void>;
    onSortChange: (mode: SortMode) => void | Promise<void>;
    onDensityChange: (density: ViewDensity) => void | Promise<void>;
    onToggleTag: (tag: string) => void | Promise<void>;
    onClearTags: () => void | Promise<void>;
    onAddHabit: () => void | Promise<void>;
  };

  let {
    filter, searchQuery, sortMode, viewDensity, pendingCount, activeTags, availableTags,
    onFilterChange, onSearchChange, onClearSearch, onSortChange, onDensityChange,
    onToggleTag, onClearTags, onAddHabit
  }: Props = $props();

  let isOpen = $state(false);

  const scopeLabel = $derived(filter === 'pending' ? 'To do' : filter === 'done' ? 'Done' : filter === 'archived' ? 'Archived' : 'All');
  const activeFilterCount = $derived(
    (filter !== 'pending' && filter !== 'all' ? 1 : 0) + activeTags.length +
      (searchQuery.trim() ? 1 : 0) + (sortMode === 'smart' ? 1 : 0) +
      (viewDensity === 'compact' ? 1 : 0) + (filter === 'archived' ? 1 : 0)
  );
  const summaryTitle = $derived(filter === 'all' ? 'All habits' : `${scopeLabel} habits`);
  const summaryParts = $derived([
    searchQuery.trim() ? `Search: ${searchQuery.trim()}` : '',
    sortMode === 'smart' ? 'Smart sort' : '',
    viewDensity === 'compact' ? 'Compact view' : '',
    ...activeTags.map((tag) => `#${tag}`)
  ].filter(Boolean));
  const summarySubtitle = $derived(summaryParts.length ? summaryParts.join(' · ') : 'No filters · default view');

  function clearAll() {
    void onFilterChange('pending');
    void onClearSearch();
    void onClearTags();
    void onSortChange('custom');
    void onDensityChange('comfortable');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') isOpen = false;
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<section class="mx-auto w-full max-w-5xl px-4 py-2 sm:px-6" aria-label="Today controls">
  <div class="rounded-[1.25rem] border border-border bg-bg-card p-2 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition-colors {isOpen ? 'border-accent/35 bg-bg-card/95' : ''}">
    <div class="flex min-h-12 items-center gap-2">
      <button
        type="button"
        class="flex min-w-0 flex-1 items-center gap-2.5 rounded-[0.9rem] px-2 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        aria-expanded={isOpen}
        aria-controls="dashboard-filter-panel"
        onclick={() => { isOpen = !isOpen; }}
      >
        <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
          <ListFilterIcon size={18} aria-hidden="true" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block truncate text-sm font-bold text-foreground">{summaryTitle}</span>
          <span class="mt-0.5 block truncate text-[10px] text-muted">{summarySubtitle}</span>
        </span>
        <span class="hidden shrink-0 items-center gap-1.5 sm:flex">
          <span class="rounded-lg bg-bg-secondary px-2 py-1 text-[10px] font-semibold text-muted">{scopeLabel}</span>
          <span class="rounded-lg bg-accent/10 px-2 py-1 text-[10px] font-mono font-bold text-accent" aria-label={`${activeFilterCount} active filters`}>
            <SlidersHorizontalIcon size={12} class="mr-1 inline" aria-hidden="true" />{activeFilterCount}
          </span>
          {#if activeTags.length > 0}
            <span class="rounded-lg bg-emerald-500/10 px-2 py-1 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-300"># {activeTags.length}</span>
          {/if}
        </span>
        <ChevronDownIcon size={18} class="shrink-0 text-muted transition-transform {isOpen ? 'rotate-180 text-accent' : ''}" aria-hidden="true" />
      </button>

      <DashboardIconButton ariaLabel="Add habit" title="Add habit" onClick={onAddHabit} class="shrink-0">
        <PlusIcon size={18} />
      </DashboardIconButton>
    </div>

    <div id="dashboard-filter-panel" class={`${isOpen ? 'block' : 'hidden'} mt-2 rounded-[1rem] border border-border bg-bg-secondary/60 p-2`}>
      <div class="flex gap-2">
        <label class="relative min-w-0 flex-1">
          <span class="sr-only">Search habits</span>
          <SearchIcon size={16} class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            id="habit-search"
            name="habit-search"
            type="search"
            autocomplete="off"
            value={searchQuery}
            oninput={(event) => { void onSearchChange((event.currentTarget as HTMLInputElement).value); }}
            placeholder="Search habits"
            class="h-11 w-full rounded-[0.85rem] border border-border bg-bg-card pl-9 pr-9 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          {#if searchQuery}
            <button type="button" class="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-bg-secondary hover:text-foreground" aria-label="Clear search" onclick={() => void onClearSearch()}>
              <XIcon size={15} />
            </button>
          {/if}
        </label>
        <DashboardIconButton ariaLabel="Toggle smart sort" title="Toggle smart sort" active={sortMode === 'smart'} onClick={() => void onSortChange(sortMode === 'custom' ? 'smart' : 'custom')}>
          <SlidersHorizontalIcon size={17} />
        </DashboardIconButton>
        <DashboardIconButton ariaLabel="Toggle view density" title="Toggle view density" active={viewDensity === 'compact'} onClick={() => void onDensityChange(viewDensity === 'comfortable' ? 'compact' : 'comfortable')}>
          <Grid3x3Icon size={17} />
        </DashboardIconButton>
        <DashboardIconButton ariaLabel={filter === 'archived' ? 'Hide archived habits' : 'Show archived habits'} title="Archived habits" active={filter === 'archived'} onClick={() => void onFilterChange(filter === 'archived' ? 'all' : 'archived')}>
          <ArchiveIcon size={17} />
        </DashboardIconButton>
      </div>

      <div class="mt-2 flex h-11 rounded-[0.85rem] border border-border bg-bg-card p-1" role="group" aria-label="Dashboard filter">
        {#each [
          { id: 'pending' as Filter, label: 'To do' },
          { id: 'all' as Filter, label: 'All' },
          { id: 'done' as Filter, label: 'Done' }
        ] as option (option.id)}
          <button type="button" class={`flex-1 rounded-[0.65rem] text-xs font-bold transition-colors ${filter === option.id ? 'bg-bg-secondary text-foreground shadow-sm' : 'text-muted hover:text-foreground'}`} aria-pressed={filter === option.id} onclick={() => void onFilterChange(option.id)}>
            {option.label}{#if option.id === 'pending'} <span class="ml-1 text-[10px] text-muted">{pendingCount}</span>{/if}
          </button>
        {/each}
      </div>

      {#if availableTags.length > 0 || activeTags.length > 0}
        <div class="mt-2 flex items-center gap-2" role="group" aria-label="Filter habits by tag">
          <TagIcon class="shrink-0 text-muted" size={16} aria-hidden="true" />
          <div class="flex min-w-0 gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button type="button" class={`shrink-0 rounded-full border px-3 py-2 text-[10px] font-semibold ${activeTags.length === 0 ? 'border-accent/30 bg-accent/10 text-accent' : 'border-border bg-bg-card text-muted'}`} aria-pressed={activeTags.length === 0} onclick={() => void onClearTags()}>All tags</button>
            {#each availableTags as tag, tagIndex (tag + '-' + tagIndex)}
              <button type="button" class={`shrink-0 rounded-full border px-3 py-2 text-[10px] font-semibold ${activeTags.includes(tag) ? 'border-accent/30 bg-accent/10 text-accent' : 'border-border bg-bg-card text-muted'}`} aria-pressed={activeTags.includes(tag)} onclick={() => void onToggleTag(tag)}>#{tag}</button>
            {/each}
          </div>
        </div>
      {/if}

      {#if activeFilterCount > 0}
        <button type="button" class="mt-1 block ml-auto px-1 py-1 text-[10px] font-semibold text-muted hover:text-accent" onclick={clearAll}>
          <CheckIcon size={13} class="mr-1 inline" aria-hidden="true" />Reset filters
        </button>
      {/if}
    </div>
  </div>
</section>
