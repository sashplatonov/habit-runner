<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import { ensureAuthSession, getSessionUserId } from '@/lib/auth/session';
  import { setCurrentUserId } from '@/lib/storage/db';

  let failed = false;
  let message = 'Finishing login…';

  onMount(() => {
    let cancelled = false;

    void (async () => {
      try {
        const session = await ensureAuthSession();
        if (cancelled) {
          return;
        }

        setCurrentUserId(getSessionUserId(session));
        if (!session) {
          failed = true;
          message = 'Failed to complete OAuth login. Check provider setup and redirect URI.';
          return;
        }

  await goto(resolve<'/app/(protected)/dashboard'>('/app/(protected)/dashboard', {}), { replaceState: true });
      } catch {
        if (cancelled) {
          return;
        }

        failed = true;
        message = 'Failed to complete OAuth login. Check provider setup and redirect URI.';
      }
    })();

    return () => {
      cancelled = true;
    };
  });
</script>

<svelte:head>
  <title>Finishing Login - Habbit Runner</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-bg-primary px-4 text-foreground">
  <div class="max-w-md rounded-3xl border border-border bg-bg-card p-6 shadow-glow-blue-sm">
    <p class="text-xs font-mono uppercase tracking-[0.3em] text-muted">OAuth callback</p>
    <p class="mt-3 text-sm font-mono leading-6 text-muted">{message}</p>

    {#if failed}
      <a
        class="mt-5 inline-flex items-center rounded-full border border-border px-4 py-2 text-sm text-foreground transition hover:border-accent hover:text-accent"
        href={resolve<'/app/(protected)/dashboard'>('/app/(protected)/dashboard', {})}
      >
        Return home
      </a>
    {/if}
  </div>
</div>