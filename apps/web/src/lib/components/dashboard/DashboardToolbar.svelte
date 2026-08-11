<script lang="ts">
  import { page } from '$app/state';
  import { SearchIcon, SlidersHorizontalIcon, PlusIcon, ArchiveIcon, XIcon, Grid3x3Icon, TagIcon, DownloadIcon, Settings2Icon } from 'lucide-svelte';
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
    onExportCsv: () => void | Promise<void>;
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
    onAddHabit,
    onExportCsv
  }: Props = $props();

  let isOptionsOpen = $state(false);
  let isMobileSearchOpen = $state(false);
  let optionsElement = $state<HTMLDivElement | null>(null);

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

  const activeOptionsCount = $derived(
    (filter === 'archived' ? 1 : 0) + (sortMode !== 'custom' ? 1 : 0) + (viewDensity !== 'comfortable' ? 1 : 0)
  );

  function handleWindowClick(event: MouseEvent) {
    if (!isOptionsOpen) {
      return;
    }

    const target = event.target;
    if (optionsElement && target instanceof Node && !optionsElement.contains(target)) {
      isOptionsOpen = false;
    }
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      isOptionsOpen = false;
      isMobileSearchOpen = false;
    }
  }
</script>

<svelte:window onpointerdown={handleWindowClick} onkeydown={handleWindowKeydown} />

<section class="space-y-3">
  <div class="flex flex-wrap items-center gap-2">
    <DashboardSegmentedControl
      ariaLabel="Dashboard filter"
      options={filterOptions}
      value={filter === 'archived' ? 'all' : filter}
      onChange={(value) => {
        void onFilterChange(value as Filter);
      }}
      class="flex-1"
    />

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

    <div class="relative" bind:this={optionsElement}>
      <DashboardIconButton
        ariaLabel="View options"
        active={isOptionsOpen}
        class="relative"
        ariaExpanded={isOptionsOpen}
        ariaControls="dashboard-view-options"
        onClick={() => {
          isOptionsOpen = !isOptionsOpen;
        }}
      >
        <Settings2Icon size={18} />
        {#if activeOptionsCount > 0}
          <span class="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold tabular-nums text-bg-primary">
            {activeOptionsCount}
          </span>
        {/if}
      </DashboardIconButton>

      {#if isOptionsOpen}
      <div
        id="dashboard-view-options"
        role="region"
        aria-label="Dashboard view options"
        class="absolute right-0 top-full z-[80] mt-2 max-h-[min(70vh,38rem)] w-[min(calc(100vw-2rem),34rem)] overflow-y-auto overscroll-contain rounded-[1.5rem] border border-border bg-bg-card p-4 shadow-[0_24px_60px_rgba(15,23,42,0.18)]"
      >
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted">View options</p>
            <p class="mt-1 text-sm text-muted">Sort, density, archive, and export live here.</p>
          </div>
          <button
            type="button"
            class="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-bg-secondary text-muted transition-colors hover:text-foreground"
            aria-label="Close options"
            onclick={() => {
              isOptionsOpen = false;
            }}
          >
            <XIcon size={18} />
          </button>
        </div>

        <div class="mt-4 space-y-4">
          <div class="space-y-2">
            <div class="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
              <SlidersHorizontalIcon size={12} />
              Sort
            </div>
            <DashboardSegmentedControl
              ariaLabel="Sort mode"
              options={[
                { id: 'custom', label: 'Custom' },
                { id: 'smart', label: 'Smart' }
              ]}
              value={sortMode}
              onChange={(value) => {
                void onSortChange(value as SortMode);
              }}
            />
          </div>

          <div class="space-y-2">
            <div class="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
              <Grid3x3Icon size={12} />
              Density
            </div>
            <DashboardSegmentedControl
              ariaLabel="Density mode"
              options={[
                { id: 'comfortable', label: 'Cards' },
                { id: 'compact', label: 'List' }
              ]}
              value={viewDensity}
              onChange={(value) => {
                void onDensityChange(value as ViewDensity);
              }}
            />
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${filter === 'archived' ? 'border-accent/30 bg-accent/10 text-accent' : 'border-border bg-bg-secondary text-muted hover:text-foreground'}`}
              onclick={() => onFilterChange('archived')}
            >
              <ArchiveIcon size={16} />
              Archived
            </button>

            <button
              type="button"
              class="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-bg-secondary px-4 py-2 text-sm font-semibold text-muted transition-colors hover:text-foreground"
              onclick={() => {
                void onExportCsv();
              }}
            >
              <DownloadIcon size={16} />
              Export CSV
            </button>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <div class="text-[11px] font-medium text-muted">
            {activeOptionsCount > 0 ? `${activeOptionsCount} active option${activeOptionsCount === 1 ? '' : 's'}` : 'Default view'}
          </div>
          <DashboardIconButton ariaLabel="Add habit" onClick={onAddHabit}>
            <PlusIcon size={18} />
          </DashboardIconButton>
        </div>
      </div>
      {/if}
    </div>
  </div>

  {#if availableTags.length > 0 || activeTags.length > 0}
    <div class="flex min-w-0 items-center gap-2" aria-label="Filter habits by tag">
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
</section>
