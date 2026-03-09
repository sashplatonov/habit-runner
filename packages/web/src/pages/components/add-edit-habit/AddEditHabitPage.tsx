import React from 'react';
import { ArrowLeftIcon, XIcon } from 'lucide-react';
import {
  COLORS,
  DAY_LABELS,
  FREQUENCIES,
  ICONS,
  SUGGESTED_TAGS
} from '../add-edit-habit.constants';
import type { AddEditHabitModel } from '@/pages/hooks/useAddEditHabitModel';

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
    <div className="min-h-screen bg-bg-primary pt-14">
      <HabitHeaderSection
        isEdit={isEdit}
        handleBack={handleBack}
        handleSubmit={handleSubmit}
        selectedColor={selectedColor}
      />
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <IconNameSection
          name={name}
          setName={setName}
          description={description}
          setDescription={setDescription}
          icon={icon}
          errorMessage={errors.name}
        />
        <IconPickerSection icon={icon} setIcon={setIcon} />
        <ColorAndFrequencySection
          color={color}
          setColor={setColor}
          frequency={frequency}
          setFrequency={setFrequency}
        />
        {frequency === 'custom' && (
          <CustomDaysSection customDays={customDays} toggleCustomDay={toggleCustomDay} error={errors.customDays} />
        )}
        <TargetSection
          targetStreak={targetStreak}
          canDecrease={canDecreaseStreak}
          canIncrease={canIncreaseStreak}
          decrease={decreaseTargetStreak}
          increase={increaseTargetStreak}
          dailyTarget={dailyTarget}
          setDailyTarget={setDailyTarget}
        />
        <TagsSection
          tags={tags}
          tagInput={tagInput}
          setTagInput={setTagInput}
          addTag={addTag}
          removeTag={removeTag}
        />
        <RemindersSection
          reminderEnabled={reminderEnabled}
          toggleReminderEnabled={toggleReminderEnabled}
          reminderTime={reminderTime}
          setReminderTime={setReminderTime}
        />
      </div>
    </div>
  );
}

function HabitHeaderSection({
  isEdit,
  handleBack,
  handleSubmit,
  selectedColor
}: Pick<AddEditHabitModel, 'isEdit' | 'handleBack' | 'handleSubmit' | 'selectedColor'>) {
  return (
    <div className="border-b border-border bg-bg-primary px-4 py-4 sticky top-14 z-10">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="text-muted hover:text-foreground transition-colors">
            <ArrowLeftIcon size={16} />
          </button>
          <h1 className="text-base font-semibold text-foreground">{isEdit ? 'Edit Habit' : 'New Habit'}</h1>
        </div>
        <button
          onClick={handleSubmit}
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
  errorMessage
}: Pick<AddEditHabitModel, 'name' | 'setName' | 'description' | 'setDescription' | 'icon'> & {
  errorMessage?: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0">
        <div className="w-12 h-12 rounded-2xl bg-bg-card border border-border flex items-center justify-center text-2xl">
          {icon}
        </div>
      </div>
      <div className="flex-1 space-y-2">
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Habit name"
          className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:border-accent/50"
        />
        {errorMessage && <p className="text-[11px] font-mono text-rose-400">{errorMessage}</p>}
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description (optional)"
          className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:border-accent/50 h-20 resize-none"
        />
      </div>
    </div>
  );
}

function IconPickerSection({ icon, setIcon }: Pick<AddEditHabitModel, 'icon' | 'setIcon'>) {
  return (
    <div>
      <div className="text-[11px] font-mono text-muted mb-2">Icon</div>
      <div className="flex flex-wrap gap-2">
        {ICONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setIcon(option)}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center text-lg transition-colors ${
              icon === option ? 'border-accent text-accent' : 'border-border text-muted'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function ColorAndFrequencySection({
  color,
  setColor,
  frequency,
  setFrequency
}: Pick<AddEditHabitModel, 'color' | 'setColor' | 'frequency' | 'setFrequency'>) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <div className="text-[11px] font-mono text-muted mb-2">Color theme</div>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setColor(option.value)}
              className={`w-10 h-10 rounded-2xl border flex items-center justify-center text-base transition-colors ${
                color === option.value ? `${option.borderClass} ${option.shadowClass}` : 'border-border'
              }`}
              style={{ backgroundColor: option.hex }}
            >
              {color === option.value && <XIcon size={14} className="text-white" />}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="text-[11px] font-mono text-muted mb-2">Frequency</div>
        <div className="flex flex-wrap gap-2">
          {FREQUENCIES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFrequency(option.value)}
              className={`px-3 py-1 rounded-full text-xs font-mono border transition-colors ${
                frequency === option.value ? 'bg-border text-foreground' : 'border-border text-muted'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CustomDaysSection({ customDays, toggleCustomDay, error }: {
  customDays: AddEditHabitModel['customDays'];
  toggleCustomDay: AddEditHabitModel['toggleCustomDay'];
  error?: string;
}) {
  return (
    <div>
      <div className="text-[11px] font-mono text-muted mb-2">Custom days</div>
      <div className="flex flex-wrap gap-2">
        {DAY_LABELS.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => toggleCustomDay(index + 1)}
            className={`px-3 py-1 rounded-full text-xs font-mono border transition-colors ${
              customDays.includes(index + 1) ? 'bg-border text-foreground' : 'border-border text-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {error && <p className="text-[11px] font-mono text-rose-400">{error}</p>}
    </div>
  );
}

function TargetSection({
  targetStreak,
  canDecrease,
  canIncrease,
  decrease,
  increase,
  dailyTarget,
  setDailyTarget
}: Pick<AddEditHabitModel, 'targetStreak' | 'dailyTarget' | 'setDailyTarget'> & {
  canDecrease: boolean;
  canIncrease: boolean;
  decrease: () => void;
  increase: () => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <div className="text-[11px] font-mono text-muted mb-2">Target streak</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={decrease}
            disabled={!canDecrease}
            className="rounded-full border border-border text-xs font-mono px-3 py-1"
          >
            -
          </button>
          <span className="text-sm font-medium">{targetStreak} days</span>
          <button
            type="button"
            onClick={increase}
            disabled={!canIncrease}
            className="rounded-full border border-border text-xs font-mono px-3 py-1"
          >
            +
          </button>
        </div>
      </div>
      <div>
        <div className="text-[11px] font-mono text-muted mb-2">Daily target</div>
        <input
          type="number"
          min={1}
          value={dailyTarget}
          onChange={(event) => setDailyTarget(Math.max(1, Math.trunc(Number(event.target.value) || 1)))}
          className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent/50"
        />
      </div>
    </div>
  );
}

function TagsSection({
  tags,
  tagInput,
  setTagInput,
  addTag,
  removeTag
}: Pick<AddEditHabitModel, 'tags' | 'tagInput' | 'setTagInput' | 'addTag' | 'removeTag'>) {
  return (
    <div>
      <div className="text-[11px] font-mono text-muted mb-2">Tags</div>
      <div className="flex gap-2">
        <input
          type="text"
          value={tagInput}
          onChange={(event) => setTagInput(event.target.value)}
          placeholder="Add tag"
          className="flex-1 bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent/50"
        />
        <button
          type="button"
          onClick={() => addTag(tagInput)}
          className="rounded-full border border-border px-3 py-1.5 text-xs font-mono"
        >
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => removeTag(tag)}
            className="text-[10px] font-mono rounded-full border border-border bg-bg-card px-2 py-1 flex items-center gap-1"
          >
            #{tag}
            <XIcon size={12} />
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mt-2 text-[10px] font-mono text-muted">
        {SUGGESTED_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => addTag(tag)}
            className="uppercase tracking-[0.3em] border border-border rounded-full px-2 py-1"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}

function RemindersSection({
  reminderEnabled,
  toggleReminderEnabled,
  reminderTime,
  setReminderTime
}: Pick<AddEditHabitModel, 'reminderEnabled' | 'toggleReminderEnabled' | 'reminderTime' | 'setReminderTime'>) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-mono text-muted">Reminders</span>
        <label className="flex items-center gap-2 text-[10px] font-mono">
          <input type="checkbox" checked={reminderEnabled} onChange={toggleReminderEnabled} />
          Enabled
        </label>
      </div>
      <input
        type="time"
        value={reminderTime}
        onChange={(event) => setReminderTime(event.target.value)}
        className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent/50"
      />
    </div>
  );
}
