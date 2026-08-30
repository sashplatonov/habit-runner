<script lang="ts">
  import { ArrowLeft } from 'lucide-svelte';
  import type { HabitEditorPanel } from './types';

  type Props = {
    activePanel: HabitEditorPanel;
    title: string;
    subtitle: string;
    colorHex: string;
    submitLabel: string;
    isSaving: boolean;
    onBack: () => void;
  };

  let { activePanel, title, subtitle, colorHex, submitLabel, isSaving, onBack }: Props = $props();
</script>

<div class="sticky top-0 z-10 bg-transparent px-4 pt-4 sm:px-6" style="padding-bottom: 1rem;">
  <div class="mx-auto flex max-w-3xl flex-col items-stretch gap-3 rounded-[1.75rem] border border-border bg-bg-secondary/90 px-4 py-4 shadow-[0_24px_60px_rgba(15,23,42,0.1)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-5">
    <div class="flex items-center gap-3">
      <button
        type="button"
        class="inline-flex h-11 w-11 items-center justify-center rounded-[1rem] border border-border text-muted transition-colors hover:border-border-hover hover:text-foreground"
        aria-label={activePanel === 'dashboard' ? 'Back' : 'Back to habit editor dashboard'}
        data-editor-back="dashboard"
        onclick={onBack}
      >
        <ArrowLeft size={16} aria-hidden="true" />
      </button>
      <div>
        <h1 class="text-base font-semibold text-foreground">{title}</h1>
        <p class="text-xs text-muted">{subtitle}</p>
      </div>
    </div>

    <button
      type="submit"
      class="hidden w-full rounded-full px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-[0.22em] text-bg-primary transition-[background-color,box-shadow,opacity] duration-200 disabled:cursor-not-allowed disabled:opacity-50 sm:inline-flex sm:w-auto"
      style={`background-color: ${colorHex}; box-shadow: 0 0 16px ${colorHex}40;`}
      disabled={isSaving}
    >
      {isSaving ? 'Saving…' : submitLabel}
    </button>
  </div>
</div>
