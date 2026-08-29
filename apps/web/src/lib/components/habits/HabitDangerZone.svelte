<script lang="ts">
  import { Archive, ArchiveRestore, Trash2 } from 'lucide-svelte';
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

<Surface as="section" padding="lg" class="habit-danger-surface !p-4 sm:!p-5">
  <p class="detail-eyebrow !text-danger">Danger zone</p>
  <div class="mt-3 grid gap-3 sm:grid-cols-2">
    <button
      type="button"
      class={`flex min-h-19 items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${archived ? 'border-accent/30 bg-accent/10 text-accent' : 'border-[#22324a] bg-[#0c1726] text-foreground hover:border-danger/40'}`}
      onclick={onToggleArchive}
      disabled={pending}
    >
      <span class="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-current/20 bg-current/10">{#if archived}<ArchiveRestore size={16} aria-hidden="true" />{:else}<Archive size={16} aria-hidden="true" />{/if}</span><span><strong class="block text-lg leading-5 tracking-[-0.03em]">{archived ? 'Restore' : 'Archive'}</strong><span class="mt-0.5 block text-xs leading-4 text-muted">{archived ? 'Return to active flow' : 'Hide from active flow'}</span></span>
    </button>

    {#if !confirmDelete}
      <button type="button" class="flex min-h-19 items-center gap-3 rounded-2xl border border-danger/30 bg-[#0c1726] px-3 py-3 text-left text-danger transition hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50" onclick={onBeginDelete} disabled={pending}>
        <span class="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-danger/25 bg-danger/10"><Trash2 size={16} aria-hidden="true" /></span><span><strong class="block text-lg leading-5 tracking-[-0.03em]">Delete</strong><span class="mt-0.5 block text-xs leading-4 text-muted">Remove permanently</span></span>
      </button>
    {:else}
      <div class="flex flex-wrap items-center gap-2 rounded-2xl border border-danger/20 bg-danger/5 px-3 py-2">
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
