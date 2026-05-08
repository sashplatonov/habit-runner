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
  const hasTags = $derived(allTags.length > 0);

  function clearAll() {
    onSearchChange('');
    onStatusFilterChange('all');
    selectedTags.forEach(tag => onToggleTag(tag));
  }

  const hasActiveFilters = $derived(
    searchQuery !== '' || statusFilter !== 'all' || selectedTags.length > 0
  );

  function getFilterButtonClass() {
    const isActive = filtersOpen || hasActiveFilters;
    return {
      'relative flex h-9 w-9 items-center justify-center rounded-lg border transition-colors': true,
      'border-accent/50': isActive,
      'border-border': !isActive,
      'bg-accent/10': filtersOpen
    };
  }

  function getStatusButtonClass(status: string) {
    const isActive = statusFilter === status;
    return {
      'rounded-lg border px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.2em] transition-colors': true,
      'bg-accent/10': isActive,
      'border-accent/30': isActive,
      'border-border': !isActive,
      'text-accent': isActive,
      'text-muted': !isActive
    };
  }

  function getTagButtonClass(tag: string) {
    const isSelected = selectedTags.includes(tag);
    return {
      'rounded-full border px-2.5 py-1 text-[10px] font-mono transition-colors': true,
      'bg-accent/10': isSelected,
      'border-accent/30': isSelected,
      'border-border': !isSelected,
      'text-accent': isSelected,
      'text-muted': !isSelected
    };
  }
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
    class={getFilterButtonClass()}
    aria-expanded={filtersOpen}
    aria-label="Toggle filters panel"
  >
    <Filter size={14} class="text-muted" />
  </button>
</div>

{#if filtersOpen}
  <div class="space-y-3 rounded-xl border border-border bg-bg-secondary p-3" role="region" aria-label="Filters panel">
    <!-- Status filter -->
    <div class="flex items-center gap-2">
      <span class="text-[9px] font-mono uppercase tracking-[0.3em] text-muted">Status</span>
      {#each ['all', 'active', 'archived'] as status, i (status + '-' + i)}
        <button
          type="button"
          onclick={() => onStatusFilterChange(status as 'all' | 'active' | 'archived')}
          class={getStatusButtonClass(status)}
          aria-pressed={statusFilter === status}
        >
          {status}
        </button>
      {/each}
    </div>

    <!-- Tags filter -->
    {#if hasTags}
      <div>
        <div class="mb-1.5 flex items-center gap-2">
          <Tag size={12} class="text-muted" />
          <span class="text-[9px] font-mono uppercase tracking-[0.3em] text-muted">Tags</span>
        </div>
        <div class="flex flex-wrap gap-1.5">
          {#each allTags as tag, i (tag + '-' + i)}
            <button
              type="button"
              onclick={() => onToggleTag(tag)}
              class={getTagButtonClass(tag)}
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
