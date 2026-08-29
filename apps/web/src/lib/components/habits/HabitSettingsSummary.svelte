<script lang="ts">
  import { Bell, CalendarDays } from 'lucide-svelte';
  import Surface from '$lib/components/ui/Surface.svelte';

  type Props = {
    scheduleSummary: string;
    reminderSummary: string;
    onEditSettings: () => void;
  };

  const { scheduleSummary, reminderSummary, onEditSettings }: Props = $props();
</script>

<Surface as="section" padding="lg" class="habit-detail-surface !p-4 sm:!p-5">
  <p class="detail-eyebrow">Settings summary</p>
  <button type="button" class="mt-3 grid w-full gap-3 text-left sm:grid-cols-2" onclick={onEditSettings} aria-label="Edit schedule and reminder settings">
    <span class="flex min-h-15 items-center gap-3 rounded-2xl border border-[#22324a] bg-[#0c1726] px-3 py-2.5 transition-colors hover:border-border-hover"><span class="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-accent/25 bg-accent/10 text-accent"><CalendarDays size={15} aria-hidden="true" /></span><span><span class="block text-xs text-muted">Schedule</span><strong class="block text-lg leading-5 tracking-[-0.03em] text-foreground">{scheduleSummary}</strong></span></span>
    <span class="flex min-h-15 items-center gap-3 rounded-2xl border border-[#22324a] bg-[#0c1726] px-3 py-2.5 transition-colors hover:border-border-hover"><span class="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-accent/25 bg-accent/10 text-accent"><Bell size={15} aria-hidden="true" /></span><span><span class="block text-xs text-muted">Reminder</span><strong class="block text-lg leading-5 tracking-[-0.03em] text-foreground">{reminderSummary}</strong></span></span>
  </button>
</Surface>
