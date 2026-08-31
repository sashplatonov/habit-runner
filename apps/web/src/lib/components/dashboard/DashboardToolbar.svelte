<script lang="ts">
  import { page } from '$app/state';
  import { SearchIcon, SlidersHorizontalIcon, PlusIcon, ArchiveIcon, XIcon, Grid3x3Icon, TagIcon } from 'lucide-svelte';
  import DashboardIconButton from '$lib/components/dashboard/DashboardIconButton.svelte';
  import DashboardSegmentedControl from '$lib/components/dashboard/DashboardSegmentedControl.svelte';

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
    filter,
    searchQuery,
    sortMode,
    viewDensity,
    pendingCount,
    activeTags,
    availableTags,
    onFilterChange,
    onSearchChange,
    onClearSearch,
    onSortChange,
    onDensityChange,
    onToggleTag,
    onClearTags,
    onAddHabit
  }: Props = $props();

  let isMobileSearchOpen = $state(false);
  let isMobileFiltersOpen = $state(false);

  $effect(() => {
    if (page.url.hash === '#habit-search') {
      isMobileSearchOpen = true;
    }
  });

  const filterOptions = $derived([
    { id: 'pending', label: 'To do', count: pendingCount },
    { id: 'all', label: 'All' },
    { id: 'done', label: 'Done' }
  ]);

  const activeFilterCount = $derived(
    activeTags.length + (filter === 'pending' ? 0 : 1)
  );

  const filterSummary = $derived(
    activeFilterCount === 1 ? '1 active filter' : `${activeFilterCount} active filters`
  );

  function handleWindowKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      isMobileSearchOpen = false;
      isMobileFiltersOpen = false;
    }
  }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<section class="mx-auto w-full max-w-5xl space-y-2 px-4 py-2 sm:px-6">
  <div class="flex flex-nowrap items-center justify-center gap-2">
    <DashboardSegmentedControl
      ariaLabel="Dashboard filter"
      options={filterOptions}
      value={filter === 'archived' ? '' : filter}
      onChange={(value) => {
        void onFilterChange(value as Filter);
      }}
      class="hidden min-w-0 flex-1 sm:inline-flex [&>button]:min-w-0 [&>button]:flex-1 [&>button]:justify-center"
    />

    <button
      type="button"
      class="inline-flex min-h-11 min-w-0 flex-1 items-center justify-between rounded-[1rem] border border-border bg-bg-secondary px-4 text-sm font-medium text-foreground transition-colors hover:border-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 sm:hidden"
      aria-label={`Filters, ${filterSummary}`}
      aria-expanded={isMobileFiltersOpen}
      aria-controls="dashboard-mobile-filters"
      onclick={() => {
        isMobileFiltersOpen = !isMobileFiltersOpen;
      }}
    >
      <span class="inline-flex items-center gap-2">
        <SlidersHorizontalIcon size={18} aria-hidden="true" />
        <span>Filters</span>
      </span>
      <span class="rounded-full bg-bg-primary/70 px-2 py-0.5 text-[10px] font-mono tabular-nums text-muted" aria-hidden="true">
        {activeFilterCount}
      </span>
    </button>

    <DashboardIconButton ariaLabel="Add habit" title="Add habit" onClick={onAddHabit}>
      <PlusIcon size={18} />
    </DashboardIconButton>
  </div>

  <div class="flex items-start gap-2">
    <div class="flex min-w-0 flex-1 items-center gap-2">
      <div class="relative min-w-0 flex-1">
        <label class="sr-only" for="habit-search">Search habits</label>
        <input
          id="habit-search"
          name="habit-search"
          type="search"
          autocomplete="off"
          value={searchQuery}
          oninput={(event) => {
            const nextQuery = (event.currentTarget as HTMLInputElement).value;
            void onSearchChange(nextQuery);
          }}
          placeholder="Search habits, tags, or descriptions…"
          class={`w-full rounded-[1.15rem] border border-border bg-bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition-colors focus:border-accent ${isMobileSearchOpen ? 'block' : 'hidden lg:block'}`}
        />
        <div class={`flex items-center gap-2 ${isMobileSearchOpen ? 'hidden' : 'lg:hidden'}`}>
          <DashboardIconButton
            ariaLabel="Open search"
            active={false}
            class="w-full justify-start px-4"
            onClick={() => {
              isMobileSearchOpen = true;
              window.setTimeout(() => document.getElementById('habit-search')?.focus(), 0);
            }}
          >
            <SearchIcon size={18} />
            <span>Search</span>
          </DashboardIconButton>
        </div>
      </div>

      {#if isMobileSearchOpen}
        <DashboardIconButton
          ariaLabel={searchQuery ? 'Clear and close search' : 'Close search'}
          onClick={() => {
            if (searchQuery) {
              void onClearSearch();
            }
            isMobileSearchOpen = false;
          }}
        >
          <XIcon size={18} />
        </DashboardIconButton>
      {/if}

      {#if searchQuery && !isMobileSearchOpen}
        <DashboardIconButton ariaLabel="Clear search" onClick={onClearSearch}>
          <XIcon size={18} />
        </DashboardIconButton>
      {/if}
    </div>

    <div class="flex shrink-0 items-center gap-1.5">
      <DashboardIconButton
        ariaLabel={`Sort: ${sortMode === 'custom' ? 'Custom' : 'Smart'}`}
        title={`Sort: ${sortMode === 'custom' ? 'Custom' : 'Smart'}`}
        active={sortMode === 'smart'}
        onClick={() => {
          void onSortChange(sortMode === 'custom' ? 'smart' : 'custom');
        }}
      >
        <SlidersHorizontalIcon size={18} />
      </DashboardIconButton>

      <DashboardIconButton
        ariaLabel={`View density: ${viewDensity === 'comfortable' ? 'Cards' : 'List'}`}
        title={`View density: ${viewDensity === 'comfortable' ? 'Cards' : 'List'}`}
        active={viewDensity === 'compact'}
        onClick={() => {
          void onDensityChange(viewDensity === 'comfortable' ? 'compact' : 'comfortable');
        }}
      >
        <Grid3x3Icon size={18} />
      </DashboardIconButton>

      <DashboardIconButton
        ariaLabel={filter === 'archived' ? 'Hide archived habits' : 'Show archived habits'}
        title={filter === 'archived' ? 'Hide archived habits' : 'Show archived habits'}
        active={filter === 'archived'}
        onClick={() => {
          void onFilterChange(filter === 'archived' ? 'all' : 'archived');
        }}
      >
        <ArchiveIcon size={18} />
      </DashboardIconButton>
    </div>
  </div>

  <div id="dashboard-mobile-filters" class={`${isMobileFiltersOpen ? 'block' : 'hidden'} space-y-2 sm:block`}>
    <DashboardSegmentedControl
      ariaLabel="Dashboard filter"
      options={filterOptions}
      value={filter === 'archived' ? '' : filter}
      onChange={(value) => {
        void onFilterChange(value as Filter);
      }}
      class="w-full sm:hidden [&>button]:min-w-0 [&>button]:flex-1 [&>button]:justify-center"
    />

    {#if availableTags.length > 0 || activeTags.length > 0}
      <div class="flex min-w-0 items-center gap-2" role="group" aria-label="Filter habits by tag">
        <TagIcon class="shrink-0 text-muted" size={16} aria-hidden="true" />
        <div class="flex min-w-0 flex-1 gap-2 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            class={`min-h-11 shrink-0 rounded-full border px-3 py-2 text-xs font-medium transition-colors ${activeTags.length === 0 ? 'border-accent/30 bg-accent/10 text-accent' : 'border-border bg-bg-card text-muted hover:text-foreground'}`}
            aria-pressed={activeTags.length === 0}
            onclick={() => {
              void onClearTags();
            }}
          >
            All tags
          </button>
          {#each availableTags as tag, tagIndex (tag + '-' + tagIndex)}
            <button
              type="button"
              class={`min-h-11 shrink-0 rounded-full border px-3 py-2 text-xs font-medium transition-colors ${activeTags.includes(tag) ? 'border-accent/30 bg-accent/10 text-accent' : 'border-border bg-bg-card text-muted hover:text-foreground'}`}
              aria-pressed={activeTags.includes(tag)}
              onclick={() => {
                void onToggleTag(tag);
              }}
            >
              #{tag}
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</section>
