import React from 'react';
import { ArrowLeftIcon, PlusIcon, XIcon } from 'lucide-react';
import { COLORS, DAILY_TARGET_OPTIONS, DAY_LABELS, FREQUENCIES, ICONS, SUGGESTED_TAGS, TARGET_STREAK_OPTIONS } from '../add-edit-habit.constants';
import type { AddEditHabitModel } from '@/pages/hooks/useAddEditHabitModel';
import { invokeIfFunction } from '@/lib/callback';

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
    frequency,
    setFrequency,
    customDays,
    toggleCustomDay,
    targetStreak,
    canDecreaseStreak,
    canIncreaseStreak,
    decreaseTargetStreak,
    increaseTargetStreak,
    setTargetStreak,
    dailyTarget,
    setDailyTarget,
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
    handleSubmit,
    handleBack
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
        <ColorFrequencySection
          color={color}
          setColor={setColor}
          frequency={frequency}
          setFrequency={setFrequency}
          customDays={customDays}
          toggleCustomDay={toggleCustomDay}
          customDaysError={errors.customDays}
        />
        <TargetSection
          targetStreak={targetStreak}
          canDecreaseStreak={canDecreaseStreak}
          canIncreaseStreak={canIncreaseStreak}
          decreaseTargetStreak={decreaseTargetStreak}
          increaseTargetStreak={increaseTargetStreak}
          setTargetStreak={setTargetStreak}
          dailyTarget={dailyTarget}
          setDailyTarget={setDailyTarget}
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
    </div>
  );
}
function HeaderSection({
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
    <div className="border-b border-border bg-bg-primary px-4 py-4 sticky top-0 z-10">
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
              style={icon === option ? { ringColor: selectedColor.hex } : undefined}
            >
              {option}
            </button>
          ))}
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
function ColorFrequencySection({
  color,
  setColor,
  frequency,
  setFrequency,
  customDays,
  toggleCustomDay,
  customDaysError
}: {
  color: AddEditHabitModel['color'];
  setColor: AddEditHabitModel['setColor'];
  frequency: AddEditHabitModel['frequency'];
  setFrequency: AddEditHabitModel['setFrequency'];
  customDays: AddEditHabitModel['customDays'];
  toggleCustomDay: AddEditHabitModel['toggleCustomDay'];
  customDaysError?: string;
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
      <label className="block text-[10px] font-mono text-muted uppercase tracking-wider mb-2 mt-4">Frequency</label>
      <div className="grid grid-cols-4 gap-1.5">
        {FREQUENCIES.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFrequency(option.value)}
            className={`px-2 py-2.5 rounded-lg border text-center transition-all duration-200 ${
              frequency === option.value ? 'border-accent/50 bg-accent/10' : 'border-border bg-bg-secondary hover:border-border-hover'
            }`}
          >
            <div className={`text-xs font-mono font-medium ${frequency === option.value ? 'text-accent' : 'text-foreground'}`}>
              {option.label}
            </div>
            <div className="text-[9px] font-mono text-muted mt-0.5">{option.desc}</div>
          </button>
        ))}
      </div>
      {frequency === 'custom' && (
        <div className="mt-3">
          <div className="flex gap-1.5">
            {DAY_LABELS.map((day, index) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleCustomDay(index)}
                className={`flex-1 py-2 rounded text-[10px] font-mono font-medium border transition-all duration-200 ${
                  customDays.includes(index)
                    ? 'border-accent/50 bg-accent/10 text-accent'
                    : 'border-border bg-bg-secondary text-muted'
                }`}
              >
                {day[0]}
              </button>
            ))}
          </div>
          {customDaysError && <p className="text-[10px] font-mono text-accent-secondary mt-1">{customDaysError}</p>}
        </div>
      )}
    </div>
  );
}
function TargetSection({
  targetStreak,
  canDecreaseStreak,
  canIncreaseStreak,
  decreaseTargetStreak,
  increaseTargetStreak,
  setTargetStreak,
  dailyTarget,
  setDailyTarget,
  selectedColor
}: {
  targetStreak: number;
  canDecreaseStreak: boolean;
  canIncreaseStreak: boolean;
  decreaseTargetStreak: () => void;
  increaseTargetStreak: () => void;
  setTargetStreak: AddEditHabitModel['setTargetStreak'];
  dailyTarget: number;
  setDailyTarget: AddEditHabitModel['setDailyTarget'];
  selectedColor: AddEditHabitModel['selectedColor'];
}) {
  return (
    <>
      <div>
        <label className="block text-[10px] font-mono text-muted uppercase tracking-wider mb-2">
          Target streak{' '}
          <span className="font-bold" style={{ color: selectedColor.hex }}>
            {targetStreak} days
          </span>
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={decreaseTargetStreak}
            disabled={!canDecreaseStreak}
            className="h-8 min-w-8 px-2 rounded-lg border border-border bg-bg-secondary text-xs font-mono text-muted hover:text-foreground hover:border-border-hover disabled:opacity-40 disabled:hover:border-border disabled:hover:text-muted transition"
          >
            -
          </button>
          <div className="flex-1 grid grid-cols-4 gap-1.5">
            {TARGET_STREAK_OPTIONS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTargetStreak(value)}
                className={`h-8 px-2 rounded-lg border text-[10px] font-mono transition ${
                  targetStreak === value
                    ? 'border-accent/50 bg-accent/10 text-accent'
                    : 'border-border bg-bg-secondary text-muted hover:border-border-hover'
                }`}
              >
                {value}d
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={increaseTargetStreak}
            disabled={!canIncreaseStreak}
            className="h-8 min-w-8 px-2 rounded-lg border border-border bg-bg-secondary text-xs font-mono text-muted hover:text-foreground hover:border-border-hover disabled:opacity-40 disabled:hover:border-border disabled:hover:text-muted transition"
          >
            +
          </button>
        </div>
      </div>
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
    </>
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
function ReminderSection({
  reminderEnabled,
  toggleReminderEnabled,
  reminderTime,
  setReminderTime
}: {
  reminderEnabled: boolean;
  toggleReminderEnabled: () => void;
  reminderTime: string;
  setReminderTime: AddEditHabitModel['setReminderTime'];
}) {
  return (
    <div>
      <label className="block text-[10px] font-mono text-muted uppercase tracking-wider mb-2">Reminder</label>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="time"
          value={reminderTime}
          onChange={(event) => setReminderTime(event.target.value)}
          className="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm font-mono focus:border-accent/60 focus:outline-none focus:shadow-[0_0_12px_var(--glow)] transition"
        />
        <button
          type="button"
          onClick={toggleReminderEnabled}
          className={`px-3 py-1.5 rounded-lg border text-[9px] font-mono uppercase tracking-wider transition ${
            reminderEnabled
              ? 'border-accent/40 bg-accent/10 text-accent'
              : 'border-border bg-bg-secondary text-muted hover:border-border-hover'
          }`}
        >
          {reminderEnabled ? 'Reminders enabled' : 'Reminders disabled'}
        </button>
        <span className="text-[11px] font-mono text-muted">{reminderTime ? `Daily at ${reminderTime}` : 'No reminder yet'}</span>
      </div>
      <p className="text-[9px] font-mono text-muted mt-1">
        {reminderEnabled
          ? 'Reminder calls appear on the dashboard when the app is open.'
          : 'Notifications are disabled. Enable them to receive reminders.'}
      </p>
    </div>
  );
}
