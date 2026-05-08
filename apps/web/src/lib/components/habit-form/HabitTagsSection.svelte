<script lang="ts">
  import { Plus, X } from 'lucide-svelte';
  import { SUGGESTED_TAGS } from '$lib/habits/constants';
  import type { FormValues } from '../HabitForm.svelte';

  let {
    tags = $bindable<string[]>([]),
    tagInput = $bindable(''),
    selectedColor
  }: {
    tags: string[];
    tagInput: string;
    selectedColor: { value: string; label: string; hex: string };
  } = $props();

  function addTag(rawTag: string) {
    const sanitized = rawTag.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!sanitized || tags.includes(sanitized) || tags.length >= 5) {
      tagInput = '';
      return;
    }

    tags = [...tags, sanitized];
    tagInput = '';
  }

  function removeTag(tag: string) {
    tags = tags.filter((item) => item !== tag);
  }

  function normalizeTags(rawTagInput: string, currentTags: string[]): string[] {
    const sanitized = rawTagInput.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!sanitized || currentTags.includes(sanitized) || currentTags.length >= 5) {
      return currentTags;
    }

    return [...currentTags, sanitized];
  }
</script>

<div class="rounded-[1.75rem] border border-border bg-bg-card/92 p-5 shadow-[0_20px_54px_rgba(15,23,42,0.08)]">
  <p class="mb-2 block text-[10px] font-mono uppercase tracking-wider text-muted">
    Tags <span class="text-border-hover">({tags.length}/5)</span>
  </p>

  <div class="mb-2 flex flex-wrap gap-1.5">
    {#each tags as tag, tagIndex (`${tag}-${tagIndex}`)}
      <span
        class="flex items-center gap-1 rounded border px-2 py-1 text-[10px] font-mono"
        style={`color: ${selectedColor.hex}; border-color: ${selectedColor.hex}40; background-color: ${selectedColor.hex}10;`}
      >
        #{tag}
        <button
          type="button"
          class="opacity-60 transition-opacity hover:opacity-100"
          onclick={() => {
            removeTag(tag);
          }}
          aria-label={`Remove ${tag}`}
        >
          <X size={9} />
        </button>
      </span>
    {/each}
  </div>

  <div class="flex gap-2">
    <input
      type="text"
      bind:value={tagInput}
      placeholder="Add tag..."
      maxlength="20"
      disabled={tags.length >= 5}
      class="flex-1 rounded-lg border border-border bg-bg-secondary px-3 py-2 text-xs font-mono text-foreground placeholder-border-hover transition-all focus:border-accent/50 disabled:opacity-40"
      onkeydown={(event) => {
        if (event.key === 'Enter' || event.key === ',') {
          event.preventDefault();
          addTag(tagInput);
        }
      }}
    />
    <button
      type="button"
      class="min-h-11 min-w-11 rounded-lg border border-border px-3 py-2 text-muted transition-colors hover:border-border-hover hover:text-foreground disabled:opacity-40"
      onclick={() => {
        addTag(tagInput);
      }}
      disabled={!tagInput.trim() || tags.length >= 5}
    >
      <Plus size={13} />
    </button>
  </div>

  <div class="mt-2 flex flex-wrap gap-1.5">
    {#each SUGGESTED_TAGS.filter((tag) => !tags.includes(tag)).slice(0, 6) as tag, suggestedTagIndex (`${tag}-${suggestedTagIndex}`)}
      <button
        type="button"
        class="rounded border border-border px-2 py-0.5 text-[9px] font-mono text-muted transition-colors hover:border-border-hover hover:text-foreground disabled:opacity-40"
        onclick={() => {
          addTag(tag);
        }}
        disabled={tags.length >= 5}
      >
        +{tag}
      </button>
    {/each}
  </div>
</div>
