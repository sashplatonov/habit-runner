import { Onboarding } from '@/components/Onboarding';
import { DashboardHero, type DashboardViewProps } from './DashboardHero';
import { RemindersPanel } from './RemindersPanel';
import { FilterBar } from './FilterBar';
import { HabitListSection } from './HabitListSection';

export type { DashboardViewProps };

export function DashboardView(props: DashboardViewProps) {
  if (props.habits.length === 0) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <Onboarding
          onCreateCustom={() => props.navigate('/habit/new')}
          onTemplateSelect={props.handleTemplateSelect}
          activeTemplate={props.addingTemplate}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHero
        dateStr={props.dateStr}
        todayRate={props.todayRate}
        completedToday={props.completedToday}
        totalActive={props.totalActive}
        overallStreak={props.overallStreak}
        daysSinceLastCompletion={props.daysSinceLastCompletion}
        handleExport={props.handleExport}
      />
      <RemindersPanel
        reminders={props.reminders}
        habits={props.habits}
        handleToggle={props.handleToggle}
        handleDismissReminder={props.handleDismissReminder}
      />
      <FilterBar
        filter={props.filter}
        setFilter={props.setFilter}
        allTags={props.allTags}
        selectedTags={props.selectedTags}
        toggleTag={props.toggleTag}
        setSelectedTags={props.setSelectedTags}
        habits={props.habits}
        today={props.today}
        sortMode={props.sortMode}
        setSortMode={props.setSortMode}
        searchQuery={props.searchQuery}
        setSearchQuery={props.setSearchQuery}
      />
      <HabitListSection
        filtered={props.filtered}
        dropHint={props.dropHint}
        dragOverHabitId={props.dragOverHabitId}
        draggedHabitId={props.draggedHabitId}
        handleToggle={props.handleToggle}
        handleDrop={props.handleDrop}
        handleDragStart={props.handleDragStart}
        handleDragOver={props.handleDragOver}
        handleDragEnd={props.handleDragEnd}
        handleTouchStart={props.handleTouchStart}
        navigate={props.navigate}
        selectedTags={props.selectedTags}
      />
    </div>
  );
}
