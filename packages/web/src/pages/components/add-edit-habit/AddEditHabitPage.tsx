import { PlusIcon, XIcon } from 'lucide-react';
import { COLORS, DAILY_TARGET_OPTIONS, ICONS, SUGGESTED_TAGS } from '../add-edit-habit.constants';
import type { AddEditHabitModel } from '@/pages/hooks/useAddEditHabitModel';
import { invokeIfFunction } from '@/lib/callback';
import { HeaderSection } from './AddEditHabitHeader';
import { ScheduleSection } from './AddEditHabitSchedule';
import { ReminderSection, SoftLimitWarningModal } from './AddEditHabitAuxSections';

export function AddEditHabitPage({ model }: { model: AddEditHabitModel }) {
  const {
    isEdit,
    name,
    setName,
    description,
    setDescription,
    icon,
    setIcon,
    color,
    setColor,
    dailyTarget,
    setDailyTarget,
    type,
    setType,
    tags,
    tagInput,
    setTagInput,
    reminderTime,
    setReminderTime,
    reminderEnabled,
    toggleReminderEnabled,
    selectedColor,
    errors,
    addTag,
    removeTag,
    schedule,
    setSchedule,
    handleSubmit,
    handleBack,
    showSoftLimitWarning,
    acknowledgeSoftLimit
  } = model;
  return (
    <div className="min-h-screen bg-bg-primary">
      <HeaderSection
        isEdit={isEdit}
        selectedColor={selectedColor}
        onBack={handleBack}
        onSubmit={handleSubmit}
      />
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <IconNameSection
          name={name}
          setName={setName}
          description={description}
          setDescription={setDescription}
          icon={icon}
          setIcon={setIcon}
          selectedColor={selectedColor}
          nameError={errors.name}
        />
        <ColorSection color={color} setColor={setColor} />
        <ScheduleSection schedule={schedule} setSchedule={setSchedule} />
        <TargetSection
          dailyTarget={dailyTarget}
          setDailyTarget={setDailyTarget}
          selectedColor={selectedColor}
        />
        <TypeSection
          type={type}
          setType={setType}
          selectedColor={selectedColor}
        />
        <TagsSection
          tags={tags}
          tagInput={tagInput}
          setTagInput={setTagInput}
          addTag={addTag}
          removeTag={removeTag}
          selectedColor={selectedColor}
        />
        <ReminderSection
          reminderEnabled={reminderEnabled}
          toggleReminderEnabled={toggleReminderEnabled}
          reminderTime={reminderTime}
          setReminderTime={setReminderTime}
        />
      </div>

      <SoftLimitWarningModal
        visible={showSoftLimitWarning}
        onBack={handleBack}
        onConfirm={acknowledgeSoftLimit}
      />
    </div>
  );
}
function IconNameSection({
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
        <div>
          <label className="block text-[10px] font-mono text-muted uppercase tracking-wider mb-2">Description</label>
          <input
            type="text"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Brief description..."
            maxLength={100}
            className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder-border-hover focus:outline-none focus:border-accent/50 focus:shadow-[0_0_12px_var(--glow)] transition-all"
          />
        </div>
      </div>
    </div>
  );
}
function ColorSection({
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
function TargetSection({
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

function TypeSection({
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

function TagsSection({
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
