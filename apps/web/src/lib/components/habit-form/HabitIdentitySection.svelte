<script lang="ts">
  import type { Habit } from '@/types/habit';
  import { COLORS, ICONS } from '$lib/habits/constants';

  let {
    name = $bindable(''),
    description = $bindable(''),
    color = $bindable<Habit['color']>('blue'),
    icon = $bindable('⚡'),
    errors = {},
    selectedColor = COLORS[0]
  }: {
    name: string;
    description: string;
    color: Habit['color'];
    icon: string;
    errors: Record<string, string>;
    selectedColor: (typeof COLORS)[number];
  } = $props();

  function handleCustomIconInput(event: Event) {
    const value = (event.currentTarget as HTMLInputElement).value;
    icon = value;
  }
</script>

<div class="grid gap-5 rounded-[1.75rem] border border-border bg-bg-card/92 p-5 shadow-[0_20px_54px_rgba(15,23,42,0.08)] lg:grid-cols-[0.72fr,1.28fr]">
  <div class="flex-shrink-0">
    <p class="mb-2 block text-[10px] font-mono uppercase tracking-wider text-muted">Icon</p>
    <div class="grid grid-cols-5 gap-1 rounded-lg border border-border bg-bg-secondary p-2">
      {#each ICONS as option, iconIndex (`${option}-${iconIndex}`)}
        <button
          type="button"
          class={`flex h-11 w-11 items-center justify-center rounded-xl text-base transition-all ${icon === option ? 'bg-border ring-1' : 'hover:bg-border'}`}
          style={icon === option ? `box-shadow: 0 0 0 1px ${selectedColor.hex};` : ''}
          aria-label={`Use ${option} as habit icon`}
          title={`Use ${option} as habit icon`}
          onclick={() => {
            icon = option;
          }}
        >
          {option}
        </button>
      {/each}
    </div>
    <div class="mt-2">
      <input
        type="text"
        value={ICONS.includes(icon) ? '' : icon}
        placeholder="Own..."
        class="w-full rounded-lg border border-border bg-bg-secondary px-2 py-2.5 text-center text-xs font-mono placeholder:text-[10px] focus:border-accent/50"
        style={!ICONS.includes(icon) && icon ? `border-color: ${selectedColor.hex}; box-shadow: 0 0 8px ${selectedColor.hex}40;` : ''}
        oninput={handleCustomIconInput}
      />
    </div>
  </div>

  <div class="flex-1 space-y-3">
    <div>
      <label class="mb-2 block text-[10px] font-mono uppercase tracking-wider text-muted" for="habit-name">Name *</label>
      <input
        id="habit-name"
        type="text"
        bind:value={name}
        maxlength="40"
        placeholder="e.g. Deep Work"
        class="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-sm font-medium text-foreground placeholder-border-hover transition-all focus:border-accent/50 focus:shadow-[0_0_12px_var(--glow)]"
        style={errors.name ? 'border-color: var(--accent-secondary);' : ''}
      />
      {#if errors.name}
        <p class="mt-1 text-[10px] font-mono text-accent-secondary">{errors.name}</p>
      {/if}
    </div>

    <div>
      <label class="mb-2 block text-[10px] font-mono uppercase tracking-wider text-muted" for="habit-description">Description <span class="text-border-hover">(supports Markdown)</span></label>
      <textarea
        id="habit-description"
        bind:value={description}
        maxlength="10000"
        rows="6"
        placeholder="Brief description... (supports **bold**, *italic*, lists, etc.)"
        class="w-full resize-none overflow-y-auto rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-sm text-foreground placeholder-border-hover transition-all focus:border-accent/50 focus:shadow-[0_0_12px_var(--glow)]"
      ></textarea>
    </div>
  </div>
</div>

<div class="rounded-[1.75rem] border border-border bg-bg-card/92 p-5 shadow-[0_20px_54px_rgba(15,23,42,0.08)]">
  <p class="mb-2 block text-[10px] font-mono uppercase tracking-wider text-muted">Color</p>
  <div class="flex gap-2">
    {#each COLORS as option, colorIndex (`${option.value}-${colorIndex}`)}
      <button
        type="button"
        class="flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all duration-200"
        style={`background-color: ${option.hex}20; border-color: ${color === option.value ? option.hex : 'transparent'}; box-shadow: ${color === option.value ? `0 0 12px ${option.hex}60` : 'none'};`}
        title={option.label}
        aria-label={`Select ${option.label} color`}
        onclick={() => {
          color = option.value;
        }}
      >
        <div class="h-3 w-3 rounded-full" style={`background-color: ${option.hex};`}></div>
      </button>
    {/each}
  </div>
</div>
