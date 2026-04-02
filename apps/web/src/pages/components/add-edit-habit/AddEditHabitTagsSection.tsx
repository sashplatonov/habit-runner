import { PlusIcon, XIcon } from 'lucide-react';
import { SUGGESTED_TAGS } from '../add-edit-habit.constants';
import { invokeIfFunction } from '@/lib/callback';
import type { AddEditHabitModel } from '@/pages/hooks/useAddEditHabitModel';

export function TagsSection({
  tags,
  tagInput,
  setTagInput,
  addTag,
  removeTag,
  selectedColor
}: {
  tags: string[];
  tagInput: string;
  setTagInput: AddEditHabitModel['setTagInput'];
  addTag: AddEditHabitModel['addTag'];
  removeTag: AddEditHabitModel['removeTag'];
  selectedColor: AddEditHabitModel['selectedColor'];
}) {
  return (
    <div>
      <label className="block text-[10px] font-mono text-muted uppercase tracking-wider mb-2">
        Tags <span className="text-border-hover">({tags.length}/5)</span>
      </label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded border"
            style={{
              color: selectedColor.hex,
              borderColor: `${selectedColor.hex}40`,
              backgroundColor: `${selectedColor.hex}10`
            }}
          >
            #{tag}
            <button type="button" onClick={() => invokeIfFunction(removeTag, tag)} className="opacity-60 hover:opacity-100">
              <XIcon size={9} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={tagInput}
          onChange={(event) => setTagInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ',') {
                event.preventDefault();
                invokeIfFunction(addTag, tagInput);
              }
            }}
          placeholder="Add tag..."
          maxLength={20}
          disabled={tags.length >= 5}
          className="flex-1 bg-bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder-border-hover font-mono focus:outline-none focus:border-accent/50 transition-all disabled:opacity-40"
        />
        <button
          type="button"
          onClick={() => invokeIfFunction(addTag, tagInput)}
          disabled={!tagInput.trim() || tags.length >= 5}
          className="px-3 py-2 rounded-lg border border-border text-muted hover:text-foreground hover:border-border-hover transition-colors disabled:opacity-40"
        >
          <PlusIcon size={13} />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {SUGGESTED_TAGS.filter((tag) => !tags.includes(tag))
          .slice(0, 6)
          .map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => invokeIfFunction(addTag, tag)}
              disabled={tags.length >= 5}
              className="text-[9px] font-mono text-muted border border-border px-2 py-0.5 rounded hover:text-foreground hover:border-border-hover transition-colors disabled:opacity-40"
            >
              +{tag}
            </button>
          ))}
      </div>
    </div>
  );
}

