<script lang="ts">
  import type { FaqItem } from '$lib/seo/publicPages';

  type Props = {
    items: FaqItem[];
    class?: string;
  };

  const { items, class: className = '' }: Props = $props();
</script>

<div class="space-y-3 {className}">
  {#each items as item, i (item.question + '-' + i)}
    <details class="rounded-[1.25rem] border border-slate-200/80 bg-white/92 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
      <summary class="cursor-pointer text-sm font-semibold text-slate-900">
        {item.question}
      </summary>
      <p class="mt-2 text-sm text-slate-600">{item.answer}</p>
    </details>
  {/each}
</div>
