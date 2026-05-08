<script lang="ts">
  import { Search, Filter, Tag, X } from 'lucide-svelte';

  type Props = {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    statusFilter: string;
    onStatusFilterChange: (filter: 'all' | 'active' | 'archived') => void;
    selectedTags: string[];
    allTags: string[];
    onToggleTag: (tag: string) => void;
    filtersOpen: boolean;
    onToggleFilters: () => void;
  };

  const {
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    selectedTags,
    allTags,
    onToggleTag,
    filtersOpen,
    onToggleFilters,
  }: Props = $props();

  let searchInput = $state<HTMLInputElement | null>(null);

  function clearAll() {
    onSearchChange('');
    onStatusFilterChange('all');
    selectedTags.forEach(tag => onToggleTag(tag));
  }

  const hasActiveFilters = $derived(
    searchQuery !== '' || statusFilter !== 'all' || selectedTags.length > 0
  );
</script>

<div class="flex items-center gap-2">
  <div class="relative flex-1">
    <Search size={14} class="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
    <input
      bind:this={searchInput}
      type="text"
      value={searchQuery}
      oninput={(e) => onSearchChange((e.target as HTMLInputElement).value)}
      placeholder="Search habits…"
      class="w-full rounded-lg border border-border bg-bg-card py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus:border-accent/50"
      aria-label="Search habits"
    />
  </div>
  <button
    type="button"
    onclick={onToggleFilters}
    class="relative flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
    class:border-accent/50={filtersOpen || hasActiveFilters}
    class:border-border={!filtersOpen && !hasActiveFilters}
    class:bg-accent/10={filtersOpen}
    aria-expanded={filtersOpen}
    aria-label="Toggle filters panel"
  >
    <Filter size={14} class={hasActiveFilters ? 'text-accent' : 'text-muted'} />
    {#if hasActiveFilters}
      <span class="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent text-[8px] font-bold text-bg-primary">
        {(selectedTags.length + (statusFilter !== 'all' ? 1 : 0) + (searchQuery ? 1 : 0)}
      </span>
    {/if}
  </button>
</div>

{#if filtersOpen}
  <div class="space-y-3 rounded-xl border border-border bg-bg-secondary p-3" role="region" aria-label="Filters panel">
    <!-- Status filter -->
    <div class="flex items-center gap-2">
      <span class="text-[9px] font-mono uppercase tracking-[0.3em] text-muted">Status</span>
      {#each ['all', 'active', 'archived'] as status}
        <button
          type="button"
          onclick={() => onStatusFilterChange(status as 'all' | 'active' | 'archived')}
          class="rounded-lg border px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.2em] transition-colors"
          class:bg-accent/10={statusFilter === status}
          class:border-accent/30={statusFilter === status}
          class:border-border={statusFilter !== status}
          class:text-accent={statusFilter === status}
          class:text-muted={statusFilter !== status}
          aria-pressed={statusFilter === status}
        >
          {status}
        </button>
      {/each}
    </div>

    <!-- Tags filter -->
    {#if allTags.length > 0}
      <div>
        <div class="mb-1.5 flex items-center gap-2">
          <Tag size={12} class="text-muted" />
          <span class="text-[9px] font-mono uppercase tracking-[0.3em] text-muted">Tags</span>
        </div>
        <div class="flex flex-wrap gap-1.5">
          {#each allTags as tag (tag)}
            <button
              type="button"
              onclick={() => onToggleTag(tag)}
              class="rounded-full border px-2.5 py-1 text-[10px] font-mono transition-colors"
              class:bg-accent/10={selectedTags.includes(tag)}
              class:border-accent/30={selectedTags.includes(tag)}
              class:border-border={!selectedTags.includes(tag)}
              class:text-accent={selectedTags.includes(tag)}
              class:text-muted={!selectedTags.includes(tag)}
              aria-pressed={selectedTags.includes(tag)}
            >
              {tag}
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Clear all -->
    {#if hasActiveFilters}
      <button
        type="button"
        onclick={clearAll}
        class="flex items-center gap-1 text-[10px] font-mono text-muted transition-colors hover:text-foreground"
      >
        <X size={10} /> Clear all filters
      </button>
    {/if}
  </div>
{/if}
