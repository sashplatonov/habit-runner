<script lang="ts">
  type Tab = { id: string; label: string };

  type Props = {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
  };

  const { tabs, activeTab, onTabChange }: Props = $props();
</script>

<div class="flex gap-1 overflow-x-auto rounded-xl bg-bg-secondary p-1" role="tablist" aria-label="Stats sections">
  {#each tabs as tab (tab.id)}
    <button
      type="button"
      role="tab"
      aria-selected={activeTab === tab.id}
      onclick={() => onTabChange(tab.id)}
      class="rounded-lg px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.2em] transition-colors"
      class:bg-accent/10={activeTab === tab.id}
      class:border-accent/30={activeTab === tab.id}
      class:border-transparent={activeTab !== tab.id}
      class:text-accent={activeTab === tab.id}
      class:text-muted={activeTab !== tab.id}
      aria-label="Show {tab.label}"
    >
      {tab.label}
    </button>
  {/each}
</div>
