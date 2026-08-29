<script lang="ts">
  import Surface from '$lib/components/ui/Surface.svelte';

  type Props = {
    scheduleSummary: string;
    reminderSummary: string;
    onEditSettings: () => void;
  };

  const { scheduleSummary, reminderSummary, onEditSettings }: Props = $props();
</script>

<Surface as="section" padding="lg" class="space-y-5">
  <div class="flex items-center justify-between gap-3">
    <div>
      <p class="text-[10px] font-mono uppercase tracking-[0.24em] text-muted">Settings</p>
      <h2 class="mt-1 text-[1.05rem] font-semibold tracking-[-0.025em] text-foreground">Schedule and reminders</h2>
    </div>
    <button type="button" class="min-h-11 rounded-full border border-border px-4 py-2 text-xs font-medium text-muted transition hover:border-border-hover hover:text-foreground" onclick={onEditSettings}>
      Edit settings
    </button>
  </div>

  <div class="grid gap-3 sm:grid-cols-2">
    <div class="rounded-[1.25rem] border border-border bg-bg-secondary px-4 py-4">
      <p class="text-[10px] font-mono uppercase tracking-[0.2em] text-muted">Schedule</p>
      <p class="mt-1 text-sm text-foreground">{scheduleSummary}</p>
    </div>
    <div class="rounded-[1.25rem] border border-border bg-bg-secondary px-4 py-4">
      <p class="text-[10px] font-mono uppercase tracking-[0.2em] text-muted">Reminder</p>
      <p class="mt-1 text-sm text-foreground">{reminderSummary}</p>
    </div>
  </div>
</Surface>
