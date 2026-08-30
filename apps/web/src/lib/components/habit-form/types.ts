export type HabitEditorPanel =
  | 'dashboard'
  | 'identity'
  | 'habit-type'
  | 'schedule'
  | 'goal'
  | 'reminder'
  | 'organization';

export type HabitEditorDetailPanel = Exclude<HabitEditorPanel, 'dashboard'>;
