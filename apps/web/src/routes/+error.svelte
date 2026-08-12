<script lang="ts">
  import { resolve } from '$app/paths';

  interface Props {
    error: App.Error;
    status: number;
  }

  const props: Props = $props();
</script>

<svelte:head>
  <title>{props.status} - Habit Runner</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-bg-primary px-4 text-foreground">
  <div class="max-w-lg rounded-3xl border border-border bg-bg-card p-6 shadow-glow-blue-sm">
    <p class="text-xs font-mono uppercase tracking-[0.3em] text-muted">Route error</p>
    <h1 class="mt-3 text-3xl font-semibold">{props.status}</h1>
    <p class="mt-3 text-sm leading-6 text-muted">
      {props.status >= 500
        ? 'The service is temporarily unavailable. Try again shortly.'
        : 'The page could not be loaded. Return home and try again.'}
    </p>
    <a
      class="mt-5 inline-flex items-center rounded-full border border-border px-4 py-2 text-sm text-foreground transition hover:border-accent hover:text-accent"
      href={resolve<'/'>('/', {})}
    >
      Return home
    </a>
  </div>
</div>
