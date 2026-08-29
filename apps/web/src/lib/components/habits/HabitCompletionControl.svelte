<script lang="ts">
  import { CheckIcon, SnowflakeIcon, Loader2Icon, XIcon } from 'lucide-svelte';

  type Props = {
    label: string;
    completed: boolean;
    target: number;
    count: number;
    accent: string;
    scheduled: boolean;
    frozen?: boolean;
    pending?: boolean;
    error?: boolean;
    disabled?: boolean;
    showLabel?: boolean;
    onToggle: () => void | Promise<void>;
    class?: string;
  };

  let {
    label,
    completed,
    target,
    count,
    accent,
    scheduled,
    frozen = false,
    pending = false,
    error = false,
    disabled = false,
    showLabel = false,
    onToggle,
    class: className = ''
  }: Props = $props();

  const progress = $derived(target > 1 ? Math.max(0, Math.min(1, count / target)) : completed ? 1 : 0);
  const isMultiTarget = $derived(target > 1);
</script>

<div class={`inline-flex min-h-11 min-w-11 items-center justify-center ${className}`.trim()}>
  <button
    type="button"
    class={`relative flex min-h-11 min-w-11 w-full items-center justify-center overflow-hidden rounded-[1rem] border px-3 text-sm font-semibold text-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary ${frozen ? 'cursor-not-allowed opacity-60' : 'hover:border-border-hover'} ${error ? 'border-danger/40 bg-danger/10 text-danger' : completed ? 'border-progress/30 bg-progress/10 text-foreground' : frozen ? 'border-border bg-bg-secondary' : scheduled ? 'border-border bg-bg-card' : 'border-dashed border-border bg-bg-secondary'}`}
    aria-label={label}
    aria-disabled={frozen || pending}
    aria-busy={pending}
    disabled={frozen || pending || disabled}
    onclick={(event) => {
      event.stopPropagation();
      if (!frozen && !pending && !disabled) {
        void onToggle();
      }
    }}
  >
    {#if isMultiTarget}
      <span class="absolute inset-[3px] overflow-hidden rounded-[0.85rem]" aria-hidden="true">
        <span
          class="absolute inset-y-0 left-0 rounded-[0.7rem]"
          style:width={`${progress * 100}%`}
          style:background={`linear-gradient(90deg, ${accent}66, ${accent})`}
        ></span>
      </span>
    {/if}

    <span class="relative z-10 inline-flex items-center gap-1">
      {#if pending}
        <Loader2Icon size={13} class="animate-spin" aria-hidden="true" />
      {:else if error}
        <XIcon size={13} aria-hidden="true" />
      {:else if frozen}
        <SnowflakeIcon size={13} aria-hidden="true" />
      {:else}
        <CheckIcon size={13} aria-hidden="true" />
      {/if}

      {#if isMultiTarget}
        <span class="font-mono text-[11px] tabular-nums" style:color={completed ? accent : 'currentColor'}>
          {Math.max(0, Math.min(count, target))}/{target}
        </span>
      {:else if showLabel}
        <span>{label}</span>
      {/if}
    </span>
  </button>
</div>
