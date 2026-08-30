<script lang="ts">
  import { Plus, Tag as TagIcon, X } from 'lucide-svelte';
  import { SUGGESTED_TAGS } from '$lib/habits/constants';

  let {
    tags = $bindable<string[]>([]),
    tagInput = $bindable(''),
    selectedColor
  }: {
    tags: string[];
    tagInput: string;
    selectedColor: { hex: string };
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

</script>

<section
  class="rounded-surface border border-border bg-bg-card shadow-surface p-4 sm:p-5"
  aria-labelledby="habit-tags-title"
  data-editor-organization
  data-testid="habit-organization-panel"
>
  <div class="flex items-start justify-between gap-3">
    <div class="min-w-0">
      <h2 id="habit-tags-title" class="text-[10px] font-mono uppercase tracking-[0.18em] text-muted">Organization</h2>
      <p class="mt-1 text-[13px] leading-5 text-muted">Use tags to make habits easier to scan and filter.</p>
    </div>
    <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
      <TagIcon size={18} strokeWidth={1.8} aria-hidden="true" />
    </span>
  </div>

  <div class="mt-4 space-y-2">
    <label id="habit-tags-label" for="habit-tag" class="text-[10px] font-mono uppercase tracking-[0.18em] text-muted">
      Tags · {tags.length}/5
    </label>

    <div class="flex flex-wrap gap-1.5">
    {#each tags as tag, tagIndex (`${tag}-${tagIndex}`)}
      <span
        class="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-mono"
        style={`color: ${selectedColor.hex}; border-color: ${selectedColor.hex}40; background-color: ${selectedColor.hex}10;`}
        data-editor-tag-chip={tag}
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
          <X size={10} aria-hidden="true" />
        </button>
      </span>
    {/each}
  </div>

  <div class="flex items-center gap-2">
    <input
      type="text"
      name="habit-tag"
      aria-labelledby="habit-tags-label"
      autocomplete="off"
      bind:value={tagInput}
      placeholder="Add tag…"
      maxlength="20"
      disabled={tags.length >= 5}
      class="min-h-11 flex-1 rounded-lg border border-border bg-bg-secondary px-3 py-2 text-xs font-mono text-foreground placeholder-border-hover transition-[border-color,opacity] focus:border-accent/50 disabled:opacity-40"
      data-editor-tag-input
      onkeydown={(event) => {
        if (event.key === 'Enter' || event.key === ',') {
          event.preventDefault();
          addTag(tagInput);
        }
      }}
    />
    <button
      type="button"
      class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-bg-primary text-muted transition-colors hover:border-border-hover hover:text-foreground disabled:opacity-40"
      onclick={() => {
        addTag(tagInput);
      }}
      disabled={!tagInput.trim() || tags.length >= 5}
      aria-label="Add tag"
    >
      <Plus size={13} aria-hidden="true" />
    </button>
  </div>

  <p class="pt-1 text-[10px] font-mono uppercase tracking-[0.18em] text-muted">Suggestions</p>
  <div class="flex flex-wrap gap-1.5" aria-label="Suggested tags" data-editor-tag-suggestions>
    {#each SUGGESTED_TAGS.filter((tag) => !tags.includes(tag)).slice(0, 6) as tag (`${tag}`)}
      <button
        type="button"
        class="flex min-h-11 items-center rounded-lg border border-border bg-bg-primary px-3 py-2 text-[10px] font-mono text-muted transition-colors hover:border-border-hover hover:text-foreground disabled:opacity-40"
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
</section>
