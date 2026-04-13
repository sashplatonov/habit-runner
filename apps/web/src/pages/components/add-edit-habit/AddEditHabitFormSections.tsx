import type { AddEditHabitModel } from '@/pages/hooks/useAddEditHabitModel';
import { ICONS, COLORS, DAILY_TARGET_OPTIONS } from '../add-edit-habit.constants';

export function IconNameSection({
  name,
  setName,
  description,
  setDescription,
  icon,
  setIcon,
  selectedColor,
  nameError
}: {
  name: string;
  setName: AddEditHabitModel['setName'];
  description: string;
  setDescription: AddEditHabitModel['setDescription'];
  icon: string;
  setIcon: AddEditHabitModel['setIcon'];
  selectedColor: AddEditHabitModel['selectedColor'];
  nameError?: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0">
        <label className="block text-[10px] font-mono text-muted uppercase tracking-wider mb-2">Icon</label>
        <div className="grid grid-cols-5 gap-1 bg-bg-secondary border border-border rounded-lg p-2">
          {ICONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setIcon(option)}
              className={`w-8 h-8 rounded flex items-center justify-center text-base transition-all ${
                icon === option ? 'bg-border ring-1' : 'hover:bg-border'
              }`}
              style={icon === option ? { boxShadow: `0 0 0 1px ${selectedColor.hex}` } : undefined}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="mt-2">
          <input
            type="text"
            value={ICONS.includes(icon) ? '' : icon}
            onChange={(event) => {
              const val = event.target.value;
              // Allow only 1 character/emoji for icon
              const char = Array.from(val).pop() || '';
              setIcon(char);
            }}
            placeholder="Own..."
            className="w-full bg-bg-secondary border border-border rounded-lg px-2 py-1.5 text-xs text-center placeholder:text-[10px] focus:outline-none focus:border-accent/50 transition-all font-mono"
            style={!ICONS.includes(icon) && icon ? { borderColor: selectedColor.hex, boxShadow: `0 0 8px ${selectedColor.hex}40` } : undefined}
          />
        </div>
      </div>
      <div className="flex-1 space-y-3">
        <div>
          <label className="block text-[10px] font-mono text-muted uppercase tracking-wider mb-2">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Deep Work"
            maxLength={40}
            className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder-border-hover font-medium focus:outline-none focus:border-accent/50 focus:shadow-[0_0_12px_var(--glow)] transition-all"
            style={nameError ? { borderColor: 'var(--accent-secondary)' } : undefined}
          />
          {nameError && <p className="text-[10px] font-mono text-accent-secondary mt-1">{nameError}</p>}
        </div>
        <div className="col-span-full">
          <label className="block text-[10px] font-mono text-muted uppercase tracking-wider mb-2">Description</label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Brief description..."
            maxLength={400}
            rows={6}
            className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder-border-hover focus:outline-none focus:border-accent/50 focus:shadow-[0_0_12px_var(--glow)] transition-all resize-none overflow-y-auto"
          />
        </div>
      </div>
    </div>
  );
}

export function ColorSection({
  color,
  setColor
}: {
  color: AddEditHabitModel['color'];
  setColor: AddEditHabitModel['setColor'];
}) {
  return (
    <div>
      <label className="block text-[10px] font-mono text-muted uppercase tracking-wider mb-2">Color</label>
      <div className="flex gap-2">
        {COLORS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setColor(option.value)}
            className="w-8 h-8 rounded-full border-2 transition-all duration-200 flex items-center justify-center"
            style={{
              backgroundColor: `${option.hex}20`,
              borderColor: color === option.value ? option.hex : 'transparent',
              boxShadow: color === option.value ? `0 0 12px ${option.hex}60` : 'none'
            }}
            title={option.label}
          >
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: option.hex }} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function TargetSection({
  dailyTarget,
  setDailyTarget
}: {
  dailyTarget: number;
  setDailyTarget: AddEditHabitModel['setDailyTarget'];
  selectedColor: AddEditHabitModel['selectedColor'];
}) {
  return (
    <div>
      <label className="block text-[10px] font-mono text-muted uppercase tracking-wider mb-2">Daily target</label>
      <div className="flex items-center gap-2">
        {DAILY_TARGET_OPTIONS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setDailyTarget(value)}
            className={`px-3 py-1.5 rounded-lg border text-[11px] font-mono transition ${
              dailyTarget === value
                ? 'border-accent/50 bg-accent/10 text-accent'
                : 'border-border bg-bg-secondary text-muted hover:border-border-hover'
            }`}
          >
            {value}x/day
          </button>
        ))}
      </div>
      <p className="text-[9px] font-mono text-muted mt-1">
        Habit counts as done only when today&apos;s completions reach this target.
      </p>
    </div>
  );
}

export function TypeSection({
  type,
  setType,
  selectedColor
}: {
  type: 'positive' | 'negative';
  setType: AddEditHabitModel['setType'];
  selectedColor: AddEditHabitModel['selectedColor'];
}) {
  return (
    <div>
      <label className="block text-[10px] font-mono text-muted uppercase tracking-wider mb-2">
        Habit Type
      </label>
      <div className="flex gap-2 p-1 bg-bg-secondary rounded-xl border border-border">
        <button
          type="button"
          onClick={() => setType('positive')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
            type === 'positive'
              ? 'bg-bg-primary shadow-sm text-foreground'
              : 'text-muted hover:text-foreground'
          }`}
          style={type === 'positive' ? { borderLeft: `2px solid ${selectedColor.hex}` } : undefined}
        >
          I want to <span className="text-accent" style={{ color: selectedColor.hex }}>DO</span> this
        </button>
        <button
          type="button"
          onClick={() => setType('negative')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
            type === 'negative'
              ? 'bg-bg-primary shadow-sm text-foreground'
              : 'text-muted hover:text-foreground'
          }`}
          style={type === 'negative' ? { borderLeft: `2px solid ${selectedColor.hex}` } : undefined}
        >
          I want to <span className="text-red-500">STOP</span> this
        </button>
      </div>
    </div>
  );
}

