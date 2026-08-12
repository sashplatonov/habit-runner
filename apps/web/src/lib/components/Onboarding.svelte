<script lang="ts">
  import { PlusCircle, Sparkles } from 'lucide-svelte';
  import type { OnboardingTemplate } from '$lib/components/onboarding';
  import { ONBOARDING_STEPS, ONBOARDING_TEMPLATES } from '$lib/components/onboarding';

  type Props = {
    onCreateCustom: () => void;
    onTemplateSelect: (template: OnboardingTemplate) => Promise<void>;
    activeTemplate?: string | null;
  };

  let { onCreateCustom, onTemplateSelect, activeTemplate = null }: Props = $props();
</script>

<div class="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center px-4 py-12 sm:px-6">
  <div class="w-full max-w-4xl space-y-8">
    <div class="space-y-3 text-center">
      <Sparkles class="mx-auto text-accent" size={32} aria-hidden="true" />
      <h1 class="text-3xl font-semibold text-foreground">Habit Runner is ready</h1>
      <p class="text-sm text-muted">
        Research shows starting with <span class="font-bold text-accent">3 habits</span> is optimal for success.
        Choose templates that fit your routine.
      </p>
      <button
        type="button"
        class="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-widest text-accent transition hover:border-accent-secondary/50"
        onclick={onCreateCustom}
      >
        <PlusCircle size={16} aria-hidden="true" />
        Create custom habit
      </button>
    </div>

    <div class="grid gap-3 sm:grid-cols-3">
      {#each ONBOARDING_STEPS as step, si (step.title + '-' + si)}
        <div class="rounded-2xl border border-border bg-bg-secondary p-4 text-center">
          <step.icon class="mx-auto mb-2 text-accent" size={22} aria-hidden="true" />
          <p class="text-xs font-semibold uppercase tracking-[0.3em] text-muted">{step.title}</p>
          <p class="mt-2 text-sm text-foreground">{step.description}</p>
        </div>
      {/each}
    </div>

    <div class="rounded-3xl border border-border bg-gradient-to-br from-bg-secondary/80 via-bg-secondary to-bg-primary/90 p-5">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs font-mono uppercase tracking-widest text-muted">Templates</p>
          <h2 class="text-xl font-semibold text-foreground">Start with one of these</h2>
        </div>
        <span class="text-[10px] font-mono uppercase tracking-widest text-muted">P2.16</span>
      </div>

      <div class="mt-4 space-y-4">
        {#each ONBOARDING_TEMPLATES as template, ti (template.name + '-' + ti)}
          {@const isActive = activeTemplate === template.name}
          <div class="flex flex-col gap-2 rounded-2xl border border-border bg-bg-primary/80 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div class="flex items-center gap-2 text-lg font-semibold text-foreground">
                <span>{template.icon}</span>
                <span>{template.name}</span>
              </div>
              <p class="text-xs text-muted">{template.description}</p>
              <div class="mt-2 flex flex-wrap gap-1 text-[10px] uppercase tracking-[0.3em] text-muted">
                {#each template.tags as tag, tagIdx (tag + '-' + tagIdx)}
                  <span class="rounded-full border border-border px-2 py-0.5">{tag}</span>
                {/each}
              </div>
            </div>

            <button
              type="button"
              disabled={isActive}
              class={`flex min-h-11 items-center justify-center gap-1 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-widest transition ${isActive ? 'border-accent/70 bg-accent/10 text-accent/80' : 'border-border bg-bg-secondary text-foreground hover:border-accent-secondary/40'}`}
              onclick={() => {
                void onTemplateSelect(template);
              }}
            >
              {#if isActive}
                <span>Adding…</span>
              {:else}
                <PlusCircle size={12} aria-hidden="true" />
                <span>Add</span>
              {/if}
            </button>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>
