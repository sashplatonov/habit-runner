<script lang="ts">
  import type { Snippet } from 'svelte';
  import { ArrowLeft } from 'lucide-svelte';

  type Props = {
    title: string;
    description?: string;
    onBack: () => void;
    children: Snippet;
    footer?: Snippet;
  };

  let { title, description, onBack, children, footer }: Props = $props();
</script>

<section class="min-h-screen bg-transparent" aria-labelledby="habit-editor-panel-title">
  <header class="sticky top-0 z-10 bg-transparent px-4 pt-4 sm:px-6">
    <div class="mx-auto flex max-w-3xl items-center gap-3 rounded-[1.75rem] border border-border bg-bg-secondary/90 px-4 py-4 shadow-[0_24px_60px_rgba(15,23,42,0.1)] backdrop-blur-xl sm:px-5">
      <button
        type="button"
        class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] border border-border text-muted transition-colors hover:border-border-hover hover:text-foreground"
        onclick={onBack}
        aria-label="Back to habit editor dashboard"
      >
        <ArrowLeft size={16} aria-hidden="true" />
      </button>
      <div>
        <h1 id="habit-editor-panel-title" class="text-base font-semibold text-foreground">{title}</h1>
        {#if description}
          <p class="text-xs text-muted">{description}</p>
        {/if}
      </div>
    </div>
  </header>

  <div class="mx-auto max-w-3xl space-y-5 px-4 pb-28 pt-6 sm:px-6 sm:pb-6">
    {@render children()}
  </div>

  {#if footer}
    {@render footer()}
  {/if}
</section>
