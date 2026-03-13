import React from 'react';
import { ArrowLeftIcon } from 'lucide-react';
import type { AddEditHabitModel } from '@/pages/hooks/useAddEditHabitModel';

export function HeaderSection({
  isEdit,
  selectedColor,
  onBack,
  onSubmit
}: {
  isEdit: boolean;
  selectedColor: AddEditHabitModel['selectedColor'];
  onBack: () => void;
  onSubmit: () => Promise<void>;
}) {
  return (
    <div
      className="border-b border-border bg-bg-primary px-4 sticky top-0 z-10"
      style={{
        top: 'var(--safe-area-inset-top, 0px)',
        paddingTop: 'calc(var(--safe-area-inset-top, 0px) + 1rem)',
        paddingBottom: '1rem'
      }}
    >
      <div className="max-w-lg mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} className="text-muted hover:text-foreground transition-colors">
            <ArrowLeftIcon size={16} />
          </button>
          <h1 className="text-base font-semibold text-foreground">{isEdit ? 'Edit Habit' : 'New Habit'}</h1>
        </div>
        <button
          type="button"
          onClick={onSubmit}
          className="px-4 py-1.5 rounded text-xs font-mono font-bold text-bg-primary transition-all duration-200"
          style={{
            backgroundColor: selectedColor.hex,
            boxShadow: `0 0 16px ${selectedColor.hex}40`
          }}
        >
          {isEdit ? 'Save' : 'Create'}
        </button>
      </div>
    </div>
  );
}
