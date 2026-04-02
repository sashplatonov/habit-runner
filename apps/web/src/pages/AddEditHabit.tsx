import React from 'react';
import { AddEditHabitPage } from '@/pages/components/add-edit-habit/AddEditHabitPage';
import { useAddEditHabitModel } from '@/pages/hooks/useAddEditHabitModel';

export function AddEditHabit() {
  const model = useAddEditHabitModel();
  if (model.shouldShowLoading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <div className="max-w-lg mx-auto px-4 py-12 text-center text-sm font-mono text-muted" role="status" aria-live="polite">
          <h2 className="sr-only">Loading</h2>
          Loading habit...
        </div>
      </div>
    );
  }
  return <AddEditHabitPage model={model} />;
}
