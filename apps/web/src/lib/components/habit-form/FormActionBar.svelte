<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    class?: string;
    sticky?: boolean;
    children: Snippet;
  };

  let { class: className = '', sticky = true, children }: Props = $props();
</script>

<div
  class={`flex flex-wrap items-center justify-end gap-2 rounded-[1.5rem] border border-border bg-bg-card/94 px-4 py-3 shadow-[0_18px_44px_rgba(15,23,42,0.12)] backdrop-blur-xl ${sticky ? 'sticky bottom-0 z-20' : ''} ${className}`.trim()}
  style:padding-bottom="calc(env(safe-area-inset-bottom, 0px) + 0.75rem)"
>
  {@render children()}
</div>
