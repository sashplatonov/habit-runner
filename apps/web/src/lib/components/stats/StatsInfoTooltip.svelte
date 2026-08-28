<script lang="ts">
  import { CircleHelp } from 'lucide-svelte';

  type Props = {
    label: string;
    content: string;
    align?: 'start' | 'end';
  };

  let { label, content, align = 'start' }: Props = $props();
  let open = $state(false);

  function close() {
    open = false;
  }
</script>

<span class="relative inline-flex">
  <button
    type="button"
    class="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-accent/50 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
    aria-label={`More information: ${label}`}
    aria-expanded={open}
    onclick={() => { open = !open; }}
    onkeydown={(event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    }}
  >
    <CircleHelp size={12} stroke-width={2.2} aria-hidden="true" />
  </button>

  {#if open}
    <span
      class={`absolute top-[calc(100%+0.45rem)] z-30 w-56 rounded-lg border border-border bg-bg-primary px-3 py-2 text-left text-[11px] leading-4 text-foreground shadow-[0_12px_28px_rgba(0,0,0,0.28)] ${align === 'end' ? 'right-0' : 'left-0'}`}
      role="tooltip"
    >
      {content}
    </span>
  {/if}
</span>
