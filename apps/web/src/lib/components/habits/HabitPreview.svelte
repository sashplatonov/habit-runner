<script lang="ts">
  import Surface from '$lib/components/ui/Surface.svelte';
  import StatusPill from '$lib/components/ui/StatusPill.svelte';

  type Props = {
    habitLabel: string;
    colorHex: string;
    colorLabel: string;
    typeLabel: string;
    scheduleSummary: string;
    reminderSummary: string;
    targetLabel: string;
  };

  const {
    habitLabel,
    colorHex,
    colorLabel,
    typeLabel,
    scheduleSummary,
    reminderSummary,
    targetLabel
  }: Props = $props();
</script>

<Surface as="section" padding="md" class="border-accent/10">
  <div class="flex items-start gap-3">
    <div class="flex h-12 w-12 flex-none items-center justify-center rounded-2xl border border-border bg-bg-secondary text-xl" style={`box-shadow: 0 0 0 1px ${colorHex}30;`}>
      {habitLabel.split(' ')[0]}
    </div>
    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-2">
        <h2 class="truncate text-sm font-semibold text-foreground">{habitLabel}</h2>
        <StatusPill tone="neutral">{typeLabel}</StatusPill>
      </div>
      <p class="mt-1 text-xs leading-5 text-muted">{scheduleSummary}</p>
      <p class="mt-0.5 text-xs leading-5 text-muted">{reminderSummary}</p>
      <div class="mt-2 flex flex-wrap gap-2">
        <StatusPill tone="progress">{targetLabel}</StatusPill>
        <span class="inline-flex items-center gap-1 rounded-full border border-border bg-bg-secondary px-3 py-1 text-[11px] text-muted">
          <span class="h-2 w-2 rounded-full" style={`background: ${colorHex};`}></span>
          {colorLabel}
        </span>
      </div>
    </div>
  </div>
</Surface>
