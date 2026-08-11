<script lang="ts">
  type Option = {
    id: string;
    label: string;
  };

  type Props = {
    options: readonly Option[];
    value: string;
    onChange: (value: string) => void;
    ariaLabel?: string;
    class?: string;
  };

  let { options, value, onChange, ariaLabel = 'Options', class: className = '' }: Props = $props();
</script>

<div class={`inline-flex rounded-full border border-border bg-bg-secondary p-1 ${className}`.trim()} role="group" aria-label={ariaLabel}>
  {#each options as option (option.id)}
    <button
      type="button"
      aria-pressed={value === option.id}
      class={`min-h-11 rounded-full px-3 py-1.5 text-sm transition-colors ${value === option.id ? 'bg-bg-card text-foreground shadow-sm' : 'text-muted hover:text-foreground'}`}
      onclick={() => onChange(option.id)}
    >
      {option.label}
    </button>
  {/each}
</div>
