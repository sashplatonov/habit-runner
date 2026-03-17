import { PlusIcon, XIcon } from 'lucide-react';
import { COLORS, DAILY_TARGET_OPTIONS, ICONS, SUGGESTED_TAGS, TARGET_STREAK_OPTIONS } from '../add-edit-habit.constants';
import type { AddEditHabitModel } from '@/pages/hooks/useAddEditHabitModel';
import { invokeIfFunction } from '@/lib/callback';
import { HeaderSection } from './AddEditHabitHeader';
import { ScheduleSection } from './AddEditHabitSchedule';

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
    targetStreak,
    canDecreaseStreak,
    canIncreaseStreak,
    decreaseTargetStreak,
    increaseTargetStreak,
    setTargetStreak,
    dailyTarget,
    setDailyTarget,
    difficulty,
    setDifficulty,
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
        <DifficultySection
          difficulty={difficulty}
          setDifficulty={setDifficulty}
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

      {showSoftLimitWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-bg-primary/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-bg-secondary border border-border rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
              <PlusIcon className="text-accent" size={24} />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Focus is key</h3>
            <p className="text-sm text-muted mb-6 leading-relaxed">
              Research shows that starting with more than 3 habits simultaneously reduces the success rate by 80%. 
              <br /><br />
              We recommend reaching a <span className="text-accent font-bold">14-day streak</span> with your current habits before adding more. 
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleBack}
                className="w-full py-3 rounded-2xl bg-bg-primary border border-border text-sm font-semibold hover:bg-bg-card transition"
              >
                Go back & focus
              </button>
              <button
                type="button"
                onClick={acknowledgeSoftLimit}
                className="w-full py-3 rounded-2xl text-[10px] font-mono uppercase tracking-widest text-muted hover:text-foreground transition"
              >
                I understand, add anyway
              </button>
            </div>
          </div>
        </div>
      )}
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

function DifficultySection({
  difficulty,
  setDifficulty,
  selectedColor
}: {
  difficulty: number;
  setDifficulty: AddEditHabitModel['setDifficulty'];
  selectedColor: AddEditHabitModel['selectedColor'];
}) {
  return (
    <div>
      <label className="block text-[10px] font-mono text-muted uppercase tracking-wider mb-2">
        Difficulty
      </label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((val) => (
          <button
            key={val}
            type="button"
            onClick={() => setDifficulty(val as any)}
            className={`flex-1 py-2 rounded-xl border text-xs font-mono transition-all duration-200 ${
              difficulty === val
                ? 'border-accent/50 bg-accent/10 text-accent ring-1 ring-accent/30'
                : 'border-border bg-bg-secondary text-muted hover:border-border-hover'
            }`}
            style={difficulty === val ? { borderColor: selectedColor.hex, color: selectedColor.hex, backgroundColor: `${selectedColor.hex}15` } : undefined}
          >
            {val === 1 ? 'Easy' : val === 5 ? 'Hard' : val}
          </button>
        ))}
      </div>
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

