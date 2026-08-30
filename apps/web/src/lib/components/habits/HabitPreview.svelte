<script lang="ts">
  import Surface from '$lib/components/ui/Surface.svelte';

  type Props = {
    habitLabel: string;
    colorHex: string;
    colorLabel: string;
    typeLabel: string;
    scheduleSummary: string;
    previewTargetSummary: string;
    previewTagsSummary: string;
  };

  const {
    habitLabel,
    colorHex,
    colorLabel,
    typeLabel,
    scheduleSummary,
    previewTargetSummary,
    previewTagsSummary
  }: Props = $props();
</script>

<Surface as="section" padding="md" class="border-accent/10" aria-labelledby="habit-preview-title">
  <h2 id="habit-preview-title" class="text-[10px] font-mono uppercase tracking-[0.18em] text-muted">Preview</h2>
  <div class="mt-2.5 flex min-w-0 items-center gap-2.5 rounded-2xl border border-border bg-bg-primary p-2.5" data-testid="habit-preview">
    <div class="flex h-[50px] w-[50px] flex-none items-center justify-center rounded-2xl border text-[23px]" style={`background-color: ${colorHex}18; border-color: ${colorHex}55;`} aria-hidden="true">
      {habitLabel.split(' ')[0]}
    </div>
    <div class="min-w-0 flex-1">
      <p class="truncate text-sm font-bold text-foreground" data-editor-preview-name>{habitLabel.slice(habitLabel.indexOf(' ') + 1) || habitLabel}</p>
      <p class="truncate text-[11px] text-muted" data-testid="preview-behavior">{typeLabel} · {scheduleSummary} · {previewTargetSummary}</p>
      <p class="truncate text-[11px] text-muted" data-testid="preview-tags">{previewTagsSummary} · {colorLabel}</p>
    </div>
  </div>
</Surface>
