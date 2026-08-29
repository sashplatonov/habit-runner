<script lang="ts">
  import Surface from '$lib/components/ui/Surface.svelte';

  type Props = {
    habitLabel: string;
    archived: boolean;
    confirmDelete: boolean;
    pending?: boolean;
    onToggleArchive: () => void;
    onConfirmDelete: () => void;
    onBeginDelete: () => void;
    onCancelDelete: () => void;
  };

  const { habitLabel, archived, confirmDelete, pending = false, onToggleArchive, onConfirmDelete, onBeginDelete, onCancelDelete }: Props = $props();
</script>

<Surface as="section" padding="lg" class="space-y-5 border-danger/20">
  <div>
    <p class="text-[10px] font-mono uppercase tracking-[0.24em] text-muted">Danger zone</p>
    <h2 class="mt-1 text-[1.05rem] font-semibold tracking-[-0.025em] text-foreground">Archive and delete</h2>
    <p class="mt-1 text-sm leading-6 text-muted">Archive hides the habit from the active flow. Delete removes the record after confirmation and keeps the history explanation explicit.</p>
  </div>

  <div class="flex flex-wrap items-center gap-3">
    <button
      type="button"
      class={`min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition ${archived ? 'border-accent/30 bg-accent/10 text-accent' : 'border-border text-muted hover:border-border-hover hover:text-foreground'}`}
      onclick={onToggleArchive}
      disabled={pending}
    >
      {archived ? 'Restore habit' : 'Archive habit'}
    </button>

    {#if !confirmDelete}
      <button type="button" class="min-h-11 rounded-full border border-danger/30 px-4 py-2 text-sm font-medium text-danger transition hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50" onclick={onBeginDelete} disabled={pending}>
        Delete habit
      </button>
    {:else}
      <div class="flex flex-wrap items-center gap-2 rounded-full border border-danger/20 bg-danger/5 px-3 py-2">
        <span class="text-xs text-muted">Delete {habitLabel}?</span>
        <button type="button" class="rounded-full border border-danger/40 px-3 py-1.5 text-xs font-medium text-danger transition hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50" onclick={onConfirmDelete} disabled={pending}>
          {pending ? 'Deleting…' : 'Delete'}
        </button>
        <button type="button" class="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50" onclick={onCancelDelete} disabled={pending}>
          Cancel
        </button>
      </div>
    {/if}
  </div>
</Surface>
