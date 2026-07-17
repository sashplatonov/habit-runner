<script lang="ts">
  export type SegmentedOption = {
    id: string;
    label: string;
    count?: number;
    disabled?: boolean;
  };

  type Props = {
    options: readonly SegmentedOption[];
    value: string;
    onChange: (value: string) => void | Promise<void>;
    ariaLabel: string;
    class?: string;
  };

  let { options, value, onChange, ariaLabel, class: className = '' }: Props = $props();
</script>

<div
  class={`inline-flex flex-wrap gap-1 rounded-[1.15rem] border border-border bg-bg-secondary p-1 ${className}`.trim()}
  role="group"
  aria-label={ariaLabel}
>
  {#each options as option (option.id)}
    <button
      type="button"
      class={`inline-flex min-h-11 items-center gap-1.5 rounded-[0.95rem] px-3.5 text-sm font-medium transition-colors ${value === option.id ? 'bg-bg-card text-foreground shadow-[0_10px_24px_rgba(15,23,42,0.08)]' : 'text-muted hover:text-foreground'} ${option.disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      aria-pressed={value === option.id}
      disabled={option.disabled}
      onclick={() => {
        if (!option.disabled) {
          void onChange(option.id);
        }
      }}
    >
      <span class="whitespace-nowrap">{option.label}</span>
      {#if option.count !== undefined}
        <span class="rounded-full bg-bg-primary/70 px-1.5 py-0.5 text-[10px] font-mono tabular-nums text-muted">
          {option.count}
        </span>
      {/if}
    </button>
  {/each}
</div>
