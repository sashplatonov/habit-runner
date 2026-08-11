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

<div class={`grid gap-4 ${className}`.trim()}>
  {#each sections as section, sectionIndex (section.id + '-' + sectionIndex)}
    <section class="space-y-2">
      <div class="flex items-center gap-2 px-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
        <section.icon size={12} aria-hidden="true" />
        {section.title}
      </div>

      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {#each section.items as candidate (candidate.id)}
          <button
            type="button"
            class={`group flex min-h-14 w-full min-w-0 items-center gap-3 rounded-[1.15rem] border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${theme === candidate.id ? 'border-accent/35 bg-accent/10 text-foreground shadow-[0_12px_24px_rgba(15,23,42,0.08)]' : 'border-border bg-bg-secondary/80 text-muted hover:border-border-hover hover:text-foreground'}`}
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
              class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[1rem] border border-border/70"
              style:background={`linear-gradient(135deg, ${candidate.accent} 0%, ${candidate.accentSecondary} 100%)`}
              aria-hidden="true"
            >
              <span
                class="h-6 w-6 rounded-[0.65rem] border border-white/35"
                style:background={candidate.themeColor}
              >
                <span
                  class="block h-2.5 w-2.5 translate-x-2.5 translate-y-2.5 rounded-full border border-white/60"
                  style:background={candidate.progress}
                ></span>
              </span>
            </span>

            <span class="min-w-0 flex-1 overflow-hidden">
              <span class="block truncate text-sm font-medium text-inherit">
                {candidate.name}
              </span>
              {#if theme === candidate.id}
                <span class="mt-0.5 inline-flex max-w-full items-center gap-1 rounded-full bg-accent/12 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                  <CheckIcon class="shrink-0" size={10} aria-hidden="true" />
                  <span class="truncate">Selected</span>
                </span>
              {:else}
                <span class="mt-0.5 block truncate text-[11px] text-muted">
                  Surface / accent / progress
                </span>
              {/if}
            </span>
          </button>
        {/each}
      </div>
    </section>
  {/each}
</div>
