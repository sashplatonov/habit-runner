import React, { useState } from 'react';
import { ArrowLeftIcon, XIcon, PlusIcon } from 'lucide-react';
import { useHabits } from '../hooks/useHabits';
import { HabitColor, HabitFrequency } from '../types/habit';
interface AddEditHabitProps {
  habitId?: string;
  onNavigate: (view: string, habitId?: string) => void;
}
const COLORS: {
  value: HabitColor;
  label: string;
  hex: string;
}[] = [
{
  value: 'blue',
  label: 'Blue',
  hex: '#00d4ff'
},
{
  value: 'green',
  label: 'Green',
  hex: '#00ff88'
},
{
  value: 'purple',
  label: 'Purple',
  hex: '#a855f7'
},
{
  value: 'orange',
  label: 'Orange',
  hex: '#f97316'
},
{
  value: 'red',
  label: 'Red',
  hex: '#ef4444'
},
{
  value: 'cyan',
  label: 'Cyan',
  hex: '#22d3ee'
}];

const FREQUENCIES: {
  value: HabitFrequency;
  label: string;
  desc: string;
}[] = [
{
  value: 'daily',
  label: 'Daily',
  desc: 'Every day'
},
{
  value: 'weekdays',
  label: 'Weekdays',
  desc: 'Mon–Fri'
},
{
  value: 'weekends',
  label: 'Weekends',
  desc: 'Sat–Sun'
},
{
  value: 'custom',
  label: 'Custom',
  desc: 'Choose days'
}];

const ICONS = [
'⚡',
'🏃',
'📖',
'🧘',
'💪',
'🎯',
'💻',
'🎨',
'🎵',
'🌱',
'💧',
'🍎',
'✍️',
'🧪',
'🔬'];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SUGGESTED_TAGS = [
'health',
'fitness',
'productivity',
'learning',
'wellness',
'focus',
'growth',
'mental',
'creative',
'social'];

export function AddEditHabit({ habitId, onNavigate }: AddEditHabitProps) {
  const { habits, addHabit, updateHabit } = useHabits();
  const isEdit = !!habitId;
  const existing = habits.find((h) => h.id === habitId);
  const [name, setName] = useState(existing?.name || '');
  const [description, setDescription] = useState(existing?.description || '');
  const [color, setColor] = useState<HabitColor>(existing?.color || 'blue');
  const [icon, setIcon] = useState(existing?.icon || '⚡');
  const [frequency, setFrequency] = useState<HabitFrequency>(
    existing?.frequency || 'daily'
  );
  const [customDays, setCustomDays] = useState<number[]>(
    existing?.customDays || [1, 2, 3, 4, 5]
  );
  const [targetStreak, setTargetStreak] = useState(existing?.targetStreak || 21);
  const [tags, setTags] = useState<string[]>(existing?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const selectedColor = COLORS.find((c) => c.value === color) ?? COLORS[0];
  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (name.length > 40) e.name = 'Max 40 characters';
    if (frequency === 'custom' && customDays.length === 0)
    e.customDays = 'Select at least one day';
    return e;
  };
  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    const data = {
      name: name.trim(),
      description: description.trim(),
      color,
      icon,
      tags,
      frequency,
      customDays: frequency === 'custom' ? customDays : undefined,
      targetStreak,
      archived: false
    };
    if (isEdit && habitId) {
      updateHabit(habitId, data);
      onNavigate('detail', habitId);
    } else {
      const newId = addHabit(data);
      onNavigate('detail', newId);
    }
  };
  const addTag = (tag: string) => {
    const t = tag.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags([...tags, t]);
    }
    setTagInput('');
  };
  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));
  const toggleCustomDay = (day: number) => {
    setCustomDays((prev) =>
    prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };
  return (
    <div className="min-h-screen bg-[#080810] pt-14">
      {/* Header */}
      <div className="border-b border-[#1e1e2e] bg-[#080810] px-4 py-4 sticky top-14 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
              onNavigate(isEdit ? 'detail' : 'dashboard', habitId)
              }
              className="text-[#64748b] hover:text-white transition-colors">

              <ArrowLeftIcon size={16} />
            </button>
            <h1 className="text-base font-semibold text-white">
              {isEdit ? 'Edit Habit' : 'New Habit'}
            </h1>
          </div>
          <button
            onClick={handleSubmit}
            className="px-4 py-1.5 rounded text-xs font-mono font-bold text-[#080810] transition-all duration-200"
            style={{
              backgroundColor: selectedColor.hex,
              boxShadow: `0 0 16px ${selectedColor.hex}40`
            }}>

            {isEdit ? 'Save' : 'Create'}
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Icon + Name row */}
        <div className="flex gap-3">
          {/* Icon picker */}
          <div className="flex-shrink-0">
            <label className="block text-[10px] font-mono text-[#64748b] uppercase tracking-wider mb-2">
              Icon
            </label>
            <div className="grid grid-cols-5 gap-1 bg-[#0f0f1a] border border-[#1e1e2e] rounded-lg p-2">
              {ICONS.map((ic) =>
              <button
                key={ic}
                onClick={() => setIcon(ic)}
                className={`w-8 h-8 rounded flex items-center justify-center text-base transition-all ${icon === ic ? 'bg-[#1e1e2e] ring-1' : 'hover:bg-[#1e1e2e]'}`}
                style={
                icon === ic ?
                {
                  ringColor: selectedColor.hex
                } :
                {}
                }>

                  {ic}
                </button>
              )}
            </div>
          </div>

          {/* Name + description */}
          <div className="flex-1 space-y-3">
            <div>
              <label className="block text-[10px] font-mono text-[#64748b] uppercase tracking-wider mb-2">
                Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors({});
                }}
                placeholder="e.g. Deep Work"
                maxLength={40}
                className="w-full bg-[#0f0f1a] border border-[#1e1e2e] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#2e2e3e] font-medium focus:outline-none focus:border-[#00d4ff]/50 focus:shadow-[0_0_12px_rgba(0,212,255,0.1)] transition-all"
                style={
                errors.name ?
                {
                  borderColor: '#ef4444'
                } :
                {}
                } />

              {errors.name &&
              <p className="text-[10px] font-mono text-red-400 mt-1">
                  {errors.name}
                </p>
              }
            </div>
            <div>
              <label className="block text-[10px] font-mono text-[#64748b] uppercase tracking-wider mb-2">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description..."
                maxLength={100}
                className="w-full bg-[#0f0f1a] border border-[#1e1e2e] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#2e2e3e] focus:outline-none focus:border-[#00d4ff]/50 focus:shadow-[0_0_12px_rgba(0,212,255,0.1)] transition-all" />

            </div>
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="block text-[10px] font-mono text-[#64748b] uppercase tracking-wider mb-2">
            Color
          </label>
          <div className="flex gap-2">
            {COLORS.map((c) =>
            <button
              key={c.value}
              onClick={() => setColor(c.value)}
              className="w-8 h-8 rounded-full border-2 transition-all duration-200 flex items-center justify-center"
              style={{
                backgroundColor: `${c.hex}20`,
                borderColor: color === c.value ? c.hex : 'transparent',
                boxShadow: color === c.value ? `0 0 12px ${c.hex}60` : 'none'
              }}
              title={c.label}>

                <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: c.hex
                }} />

              </button>
            )}
          </div>
        </div>

        {/* Frequency */}
        <div>
          <label className="block text-[10px] font-mono text-[#64748b] uppercase tracking-wider mb-2">
            Frequency
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {FREQUENCIES.map((f) =>
            <button
              key={f.value}
              onClick={() => setFrequency(f.value)}
              className={`px-2 py-2.5 rounded-lg border text-center transition-all duration-200 ${frequency === f.value ? 'border-[#00d4ff]/50 bg-[#00d4ff]/10' : 'border-[#1e1e2e] bg-[#0f0f1a] hover:border-[#2e2e3e]'}`}>

                <div
                className={`text-xs font-mono font-medium ${frequency === f.value ? 'text-[#00d4ff]' : 'text-white'}`}>

                  {f.label}
                </div>
                <div className="text-[9px] font-mono text-[#64748b] mt-0.5">
                  {f.desc}
                </div>
              </button>
            )}
          </div>

          {/* Custom days */}
          {frequency === 'custom' &&
          <div className="mt-3">
              <div className="flex gap-1.5">
                {DAY_LABELS.map((day, i) =>
              <button
                key={i}
                onClick={() => toggleCustomDay(i)}
                className={`flex-1 py-2 rounded text-[10px] font-mono font-medium border transition-all duration-200 ${customDays.includes(i) ? 'border-[#00d4ff]/50 bg-[#00d4ff]/10 text-[#00d4ff]' : 'border-[#1e1e2e] bg-[#0f0f1a] text-[#64748b]'}`}>

                    {day[0]}
                  </button>
              )}
              </div>
              {errors.customDays &&
            <p className="text-[10px] font-mono text-red-400 mt-1">
                  {errors.customDays}
                </p>
            }
            </div>
          }
        </div>

        {/* Target streak */}
        <div>
          <label className="block text-[10px] font-mono text-[#64748b] uppercase tracking-wider mb-2">
            Target streak —{' '}
            <span
              className="font-bold"
              style={{
                color: selectedColor.hex
              }}>

              {targetStreak} days
            </span>
          </label>
          <input
            type="range"
            min={7}
            max={365}
            step={7}
            value={targetStreak}
            onChange={(e) => setTargetStreak(Number(e.target.value))}
            className="w-full accent-[#00d4ff] h-1 bg-[#1e1e2e] rounded-full appearance-none cursor-pointer"
            style={{
              accentColor: selectedColor.hex
            }} />

          <div className="flex justify-between mt-1">
            <span className="text-[9px] font-mono text-[#64748b]">7d</span>
            <span className="text-[9px] font-mono text-[#64748b]">365d</span>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-[10px] font-mono text-[#64748b] uppercase tracking-wider mb-2">
            Tags <span className="text-[#2e2e3e]">({tags.length}/5)</span>
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map((tag) =>
            <span
              key={tag}
              className="flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded border"
              style={{
                color: selectedColor.hex,
                borderColor: `${selectedColor.hex}40`,
                backgroundColor: `${selectedColor.hex}10`
              }}>

                #{tag}
                <button
                onClick={() => removeTag(tag)}
                className="opacity-60 hover:opacity-100">

                  <XIcon size={9} />
                </button>
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  addTag(tagInput);
                }
              }}
              placeholder="Add tag..."
              maxLength={20}
              disabled={tags.length >= 5}
              className="flex-1 bg-[#0f0f1a] border border-[#1e1e2e] rounded-lg px-3 py-2 text-xs text-white placeholder-[#2e2e3e] font-mono focus:outline-none focus:border-[#00d4ff]/50 transition-all disabled:opacity-40" />

            <button
              onClick={() => addTag(tagInput)}
              disabled={!tagInput.trim() || tags.length >= 5}
              className="px-3 py-2 rounded-lg border border-[#1e1e2e] text-[#64748b] hover:text-white hover:border-[#2e2e3e] transition-colors disabled:opacity-40">

              <PlusIcon size={13} />
            </button>
          </div>
          {/* Suggested tags */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).
            slice(0, 6).
            map((tag) =>
            <button
              key={tag}
              onClick={() => addTag(tag)}
              disabled={tags.length >= 5}
              className="text-[9px] font-mono text-[#64748b] border border-[#1e1e2e] px-2 py-0.5 rounded hover:text-white hover:border-[#2e2e3e] transition-colors disabled:opacity-40">

                  +{tag}
                </button>
            )}
          </div>
        </div>
      </div>
    </div>);

}
