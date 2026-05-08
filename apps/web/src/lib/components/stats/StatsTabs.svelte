<script lang="ts">
  type Tab = { id: string; label: string };

  type Props = {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
  };

  const { tabs, activeTab, onTabChange }: Props = $props();
  
  function getTabClass(tabId: string) {
    const isActive = activeTab === tabId;
    return {
      'rounded-lg px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.2em] transition-colors': true,
      'bg-accent/10': isActive,
      'border-accent/30': isActive,
      'border-transparent': !isActive,
      'text-accent': isActive,
      'text-muted': !isActive
    };
  }
</script>

<div class="flex gap-1 overflow-x-auto rounded-xl bg-bg-secondary p-1" role="tablist" aria-label="Stats sections">
  {#each tabs as tab (tab.id)}
    <button
      type="button"
      role="tab"
      aria-selected={activeTab === tab.id}
      onclick={() => onTabChange(tab.id)}
      class={getTabClass(tab.id)}
      aria-label="Show {tab.label}"
    >
      {tab.label}
    </button>
  {/each}
</div>
