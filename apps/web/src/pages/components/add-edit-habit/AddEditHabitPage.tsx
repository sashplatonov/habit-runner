import type { AddEditHabitModel } from '@/pages/hooks/useAddEditHabitModel';
import { HeaderSection } from './AddEditHabitHeader';
import { ScheduleSection } from './AddEditHabitSchedule';
import { ReminderSection, SoftLimitWarningModal } from './AddEditHabitAuxSections';
import { IconNameSection, ColorSection, TargetSection, TypeSection } from './AddEditHabitFormSections';
import { TagsSection } from './AddEditHabitTagsSection';

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
