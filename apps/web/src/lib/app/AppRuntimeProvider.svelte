<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { AppRuntime } from '$lib/app/runtime';
  import { provideAppRuntime } from '$lib/app/runtime';

  type Props = { runtime: AppRuntime; children: Snippet };
  let { runtime, children }: Props = $props();
  provideAppRuntime(runtime);
</script>

{@render children()}
