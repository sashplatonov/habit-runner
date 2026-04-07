<script lang="ts">
  import { onMount } from 'svelte';

  let { onDismiss }: { onDismiss?: () => void } = $props();

  let dismissed = $state(false);

  function dismiss() {
    dismissed = true;
    onDismiss?.();
  }
</script>

{#if !dismissed}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-bg/90 backdrop-blur-sm p-4">
    <div class="w-full max-w-md rounded-2xl border border-border bg-bg-card p-6 shadow-2xl">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-base font-semibold text-foreground">Welcome to Habbit Runner</h2>
        <button
          type="button"
          onclick={dismiss}
          class="text-muted hover:text-foreground text-lg leading-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div class="space-y-4">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-sm font-bold text-accent">1</div>
          <div>
            <p class="text-sm font-semibold text-foreground">Pick a habit</p>
            <p class="text-xs text-muted">Choose something small that matters to you.</p>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-sm font-bold text-accent">2</div>
          <div>
            <p class="text-sm font-semibold text-foreground">Track daily</p>
            <p class="text-xs text-muted">Tap to mark each day done. Build your streak.</p>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-sm font-bold text-accent">3</div>
          <div>
            <p class="text-sm font-semibold text-foreground">Celebrate progress</p>
            <p class="text-xs text-muted">Watch the streaks and stats grow over time.</p>
          </div>
        </div>
      </div>

      <div class="mt-6 border-t border-border pt-4">
        <p class="text-xs font-semibold text-muted mb-2">Quick start templates</p>
        <div class="grid grid-cols-3 gap-2">
          <button
            type="button"
            class="rounded-lg border border-border bg-bg-card px-2 py-2 text-center text-xs hover:border-accent/40 transition-colors"
          >
            <span class="text-base">🧘</span>
            <p class="mt-1 text-[10px] text-muted">Morning stretch</p>
          </button>
          <button
            type="button"
            class="rounded-lg border border-border bg-bg-card px-2 py-2 text-center text-xs hover:border-accent/40 transition-colors"
          >
            <span class="text-base">💧</span>
            <p class="mt-1 text-[10px] text-muted">Hydration</p>
          </button>
          <button
            type="button"
            class="rounded-lg border border-border bg-bg-card px-2 py-2 text-center text-xs hover:border-accent/40 transition-colors"
          >
            <span class="text-base">📖</span>
            <p class="mt-1 text-[10px] text-muted">Focus time</p>
          </button>
        </div>
      </div>

      <button
        type="button"
        onclick={dismiss}
        class="mt-5 w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-bg transition-all hover:opacity-90 active:scale-[0.98]"
      >
        Got it, let's go
      </button>
    </div>
  </div>
{/if}
