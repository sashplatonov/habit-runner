<script lang="ts">
  import { startOAuthLogin } from '$lib/auth/oauth';

  let { onHelp }: { onHelp?: () => void } = $props();
</script>

<div class="flex items-center justify-center min-h-screen p-4">
  <div class="w-full max-w-sm rounded-2xl border border-border bg-bg-card/80 backdrop-blur-lg p-8 text-center shadow-xl">
    <img
      src="/app-icon.svg"
      alt="Habbit Runner"
      class="w-16 h-16 mx-auto mb-4 rounded-2xl"
    />
    <h1 class="text-lg font-semibold text-foreground mb-1">Habbit Runner</h1>
    <p class="text-sm text-muted mb-6">Sign in to start tracking your habits</p>

    <button
      type="button"
      onclick={startOAuthLogin}
      class="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-bg transition-all hover:opacity-90 active:scale-[0.98]"
    >
      Continue with Google
    </button>

    {#if onHelp}
      <button
        type="button"
        onclick={onHelp}
        class="mt-4 text-xs text-muted hover:text-foreground transition-colors"
      >
        Need help?
      </button>
    {/if}
  </div>
</div>
