<script lang="ts">
  import { page } from '$app/state';
  import { CheckIcon, MoonIcon, SunIcon } from 'lucide-svelte';
  import {
    rankThemesByUsage,
    THEMES,
    type ThemeId
  } from '$lib/theme/themes';
  import { themeStore } from '$lib/stores/theme';

  type Props = {
    theme: ThemeId;
    onThemeChange: (id: ThemeId) => void | Promise<void>;
    onChoose?: () => void | Promise<void>;
    class?: string;
  };

  let { theme, onThemeChange, onChoose, class: className = '' }: Props = $props();
  const themeUsage = $derived($themeStore.dashboard.themeUsage);

  const rankedThemes = $derived(rankThemesByUsage(THEMES, themeUsage));
  const sections = $derived([
    {
      id: 'dark',
      title: 'Dark',
      icon: MoonIcon,
      items: rankedThemes.filter((candidate) => candidate.group === 'dark')
    },
    {
      id: 'light',
      title: 'Light',
      icon: SunIcon,
      items: rankedThemes.filter((candidate) => candidate.group === 'light')
    }
  ].sort((first, second) => {
    const mostUsed = (items: typeof rankedThemes) => Math.max(
      0,
      ...items.map((candidate) => themeUsage[candidate.id] ?? 0)
    );
    return mostUsed(second.items) - mostUsed(first.items);
  }));
</script>

<div class={`grid gap-3 ${className}`.trim()}>
  {#each sections as section, sectionIndex (section.id + '-' + sectionIndex)}
    <section class="space-y-1">
      <div class="flex items-center gap-2 px-1 pb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
        <section.icon size={12} aria-hidden="true" />
        {section.title}
      </div>

      <div class="grid grid-cols-1">
        {#each section.items as candidate (candidate.id)}
          <button
            type="button"
            class={`group flex min-h-12 w-full min-w-0 items-center gap-3 border-b border-border px-3 py-2 text-left transition-colors focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${theme === candidate.id ? 'rounded-xl border-accent/25 bg-accent/10 text-foreground' : 'text-muted hover:bg-bg-secondary/70 hover:text-foreground'}`}
            aria-pressed={theme === candidate.id}
            aria-label={`Switch to ${candidate.name} theme`}
            onclick={async () => {
              if (!page.url.pathname.startsWith('/showcase')) {
                await themeStore.recordThemeSelection(candidate.id);
              }
              await onThemeChange(candidate.id);
              await onChoose?.();
            }}
          >
            <span
              class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[0.65rem]"
              style:background={candidate.accent}
              aria-hidden="true"
            >
              <span
                class="h-5 w-5 rounded-[0.35rem] border border-white/30"
                style:background={candidate.accentSecondary}
              ></span>
            </span>

            <span class="min-w-0 flex-1 overflow-hidden text-sm font-semibold">
              <span class="block truncate text-sm font-medium text-inherit">
                {candidate.name}
              </span>
            </span>
            {#if theme === candidate.id}
              <CheckIcon class="shrink-0 text-accent" size={16} strokeWidth={2.5} aria-hidden="true" />
            {/if}
          </button>
        {/each}
      </div>
    </section>
  {/each}
</div>
