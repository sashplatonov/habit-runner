<script lang="ts">
  import type { Habit } from '@/types/habit';
  import { COLORS, ICONS } from '$lib/habits/constants';
  import { MAX_HABIT_DESCRIPTION_LENGTH } from '$lib/habits/habitFormModel';
  import { UserRound } from 'lucide-svelte';
  import FieldMessage from './FieldMessage.svelte';
  import HabitPreview from '../habits/HabitPreview.svelte';

  let {
    name = $bindable(''),
    description = $bindable(''),
    color = $bindable<Habit['color']>('blue'),
    icon = $bindable('⚡'),
    errors = {},
    selectedColor = COLORS[0],
    previewLabel = '',
    previewSchedule = '',
    previewType = '',
    previewTargetSummary = '',
    previewTagsSummary = ''
  }: {
    name: string;
    description: string;
    color: Habit['color'];
    icon: string;
    errors: Record<string, string>;
    selectedColor: (typeof COLORS)[number];
    previewLabel: string;
    previewSchedule: string;
    previewType: string;
    previewTargetSummary: string;
    previewTagsSummary: string;
  } = $props();

  function handleCustomIconInput(event: Event) {
    const value = (event.currentTarget as HTMLInputElement).value;
    icon = value;
  }

  const descriptionRemaining = $derived(MAX_HABIT_DESCRIPTION_LENGTH - description.length);
  const descriptionLimitMessage = $derived(
    descriptionRemaining >= 0 ? `${descriptionRemaining} remaining` : `${Math.abs(descriptionRemaining)} over limit`
  );
</script>

<section
  class="rounded-surface border border-border bg-bg-card shadow-surface p-3.5 sm:p-4"
  aria-labelledby="habit-identity-title"
  data-editor-identity
>
  <div class="mb-1 flex items-start justify-between gap-3">
    <div class="min-w-0">
      <h2 id="habit-identity-title" class="text-[10px] font-mono uppercase tracking-[0.18em] text-muted">Identity</h2>
      <p class="mt-0.5 text-[13px] leading-5 text-muted">Name, description, icon and color.</p>
    </div>
    <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-accent/10 text-accent">
      <UserRound size={17} strokeWidth={1.8} aria-hidden="true" />
    </span>
  </div>

  <div class="mt-3 space-y-3">
    <div>
      <p class="mb-1.5 text-[10px] uppercase tracking-[0.12em] text-muted">Preset emoji</p>
      <div class="grid grid-cols-5 gap-1.5" data-editor-emoji-grid>
        {#each ICONS as option, iconIndex (`${option}-${iconIndex}`)}
          <button
            type="button"
            class={`flex h-10 w-full items-center justify-center rounded-[11px] border text-[18px] transition-[background-color,border-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${icon === option ? 'border-accent bg-accent/10' : 'border-border bg-bg-primary hover:border-border-hover'}`}
            style={icon === option ? `outline: 2px solid ${selectedColor.hex}; outline-offset: -2px;` : ''}
            aria-label={`Use ${option} as habit icon`}
            aria-pressed={icon === option}
            onclick={() => {
              icon = option;
            }}
          >
            {option}
          </button>
        {/each}
      </div>
    </div>

    <div>
      <p class="mb-1.5 text-[10px] uppercase tracking-[0.12em] text-muted">Custom emoji</p>
      <div class="grid grid-cols-[54px_1fr] items-center gap-2.5">
        <span
          class="flex h-[46px] items-center justify-center rounded-[11px] border text-[22px]"
          style={`background-color: ${selectedColor.hex}18; border-color: ${selectedColor.hex}66;`}
          aria-hidden="true"
        >
          {icon || '—'}
        </span>
        <div>
          <input
            type="text"
            name="habit-icon"
            aria-label="Custom habit icon"
            autocomplete="off"
            maxlength="8"
            value={ICONS.includes(icon) ? '' : icon}
            placeholder="Own icon…"
            class="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-center text-sm text-foreground placeholder:text-[10px] focus:border-accent/50"
            style={!ICONS.includes(icon) && icon ? `border-color: ${selectedColor.hex};` : ''}
            oninput={handleCustomIconInput}
          />
          <p class="mt-1 text-[11px] text-muted">Custom emoji overrides a preset.</p>
        </div>
      </div>
    </div>

    <div>
      <label class="mb-1.5 block text-[10px] uppercase tracking-[0.12em] text-muted" for="habit-name">Name *</label>
      <input
        id="habit-name"
        type="text"
        name="habit-name"
        autocomplete="off"
        bind:value={name}
        maxlength="40"
        placeholder="e.g. Deep Work…"
        class="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm font-medium text-foreground placeholder-border-hover transition-[border-color,box-shadow] focus:border-accent/50 focus:shadow-[0_0_12px_var(--glow)]"
        style={errors.name ? 'border-color: var(--accent-secondary);' : ''}
        aria-invalid={Boolean(errors.name)}
      />
      <FieldMessage message={errors.name} tone="error" class="mt-1" />
    </div>

    <div>
      <label class="mb-2 block text-[10px] uppercase tracking-[0.12em] text-muted" for="habit-description">Description</label>
      <textarea
        id="habit-description"
        name="habit-description"
        autocomplete="off"
        bind:value={description}
        maxlength={MAX_HABIT_DESCRIPTION_LENGTH}
        rows="3"
        aria-describedby={errors.description ? 'habit-description-count habit-description-error' : 'habit-description-count'}
        aria-invalid={Boolean(errors.description)}
        placeholder="Brief description. Markdown supported."
        class="w-full resize-none overflow-y-auto rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-foreground placeholder-border-hover transition-[border-color,box-shadow] focus:border-accent/50 focus:shadow-[0_0_12px_var(--glow)]"
        style={errors.description ? 'border-color: var(--accent-secondary);' : ''}
      ></textarea>
      <p id="habit-description-count" class="mt-1 flex justify-between gap-3 text-[11px] leading-5 text-muted">
        <span>{description.length} / {MAX_HABIT_DESCRIPTION_LENGTH} characters</span>
        <span>{descriptionLimitMessage}</span>
      </p>
      <FieldMessage id="habit-description-error" message={errors.description} tone="error" class="mt-1" />
    </div>

    <div>
      <p class="mb-1.5 text-[10px] uppercase tracking-[0.12em] text-muted">Base color</p>
      <div class="flex flex-wrap gap-1.5" data-editor-color-list>
        {#each COLORS as option, colorIndex (`${option.value}-${colorIndex}`)}
          <button
            type="button"
            class={`flex min-h-11 items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[11px] transition-[border-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${color === option.value ? '' : 'border-border bg-bg-primary text-muted'}`}
            style={color === option.value
              ? `background-color: ${option.hex}18; border-color: ${option.hex}; box-shadow: 0 0 10px ${option.hex}40;`
              : ''}
            aria-label={`Select ${option.label} color`}
            aria-pressed={color === option.value}
            title={option.label}
            onclick={() => {
              color = option.value;
            }}
          >
            <span class="h-2 w-2 flex-none rounded-full" style={`background-color: ${option.hex};`}></span>
            {option.label}
          </button>
        {/each}
      </div>
    </div>
  </div>
</section>

<div data-editor-identity-preview>
  <HabitPreview
    habitLabel={previewLabel}
    colorHex={selectedColor.hex}
    colorLabel={selectedColor.label}
    typeLabel={previewType}
    scheduleSummary={previewSchedule}
    {previewTargetSummary}
    {previewTagsSummary}
  />
</div>
