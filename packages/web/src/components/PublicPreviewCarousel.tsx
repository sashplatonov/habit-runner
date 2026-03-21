import React, { useMemo, useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, FlameIcon, BarChart2Icon, TrendingUpIcon } from 'lucide-react';
import { DashboardView } from '@/pages/components/DashboardView';
import { StatsView, type ActivityWeek, type Insight, type PeriodOption } from '@/pages/components/StatsView';
import { AddEditHabitPage } from '@/pages/components/add-edit-habit/AddEditHabitPage';
import { COLORS } from '@/pages/components/add-edit-habit.constants';
import type { AddEditHabitModel } from '@/pages/hooks/useAddEditHabitModel';
import { formatHabitLabel } from '@/lib/habits/formatHabitLabel';
import { BrowserRouter } from '@/lib/router';
import type { Habit } from '@/types/habit';
import type { HabitSchedule } from '@habbit-runner/shared';

function isoDate(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split('T')[0];
}

function buildDemoHabits(): Habit[] {
  const today = isoDate(0);
  const one = isoDate(-1);
  const two = isoDate(-2);
  const three = isoDate(-3);
  const four = isoDate(-4);
  const five = isoDate(-5);
  const six = isoDate(-6);

  return [
    {
      id: 'demo-run',
      name: 'Morning Run',
      description: '20 minutes of running before breakfast.',
      color: 'cyan',
      icon: '🏃',
      tags: ['health', 'energy'],
      frequency: 'daily',
      targetStreak: 30,
      dailyTarget: 1,
      completions: { [six]: 1, [five]: 1, [four]: 1, [three]: 1, [two]: 1, [one]: 1, [today]: 1 },
      freezeDays: [],
      createdAt: isoDate(-45),
      archived: false,
      sortOrder: 0,
      difficulty: 2,
      type: 'positive',
      reminderTime: '07:30',
      reminderEnabled: true
    },
    {
      id: 'demo-read',
      name: 'Read 20 pages',
      description: 'Daily reading sprint.',
      color: 'purple',
      icon: '📚',
      tags: ['learning', 'focus'],
      frequency: 'daily',
      targetStreak: 21,
      dailyTarget: 1,
      completions: { [six]: 1, [five]: 1, [four]: 0, [three]: 1, [two]: 1, [one]: 1, [today]: 1 },
      freezeDays: [],
      createdAt: isoDate(-30),
      archived: false,
      sortOrder: 1,
      difficulty: 2,
      type: 'positive',
      reminderTime: '21:00',
      reminderEnabled: true
    },
    {
      id: 'demo-sugar',
      name: 'No sugar after 18:00',
      description: 'Evening nutrition discipline.',
      color: 'green',
      icon: '🥗',
      tags: ['nutrition', 'discipline'],
      frequency: 'daily',
      targetStreak: 14,
      dailyTarget: 1,
      completions: { [six]: 0, [five]: 1, [four]: 1, [three]: 1, [two]: 1, [one]: 1, [today]: 0 },
      freezeDays: [],
      createdAt: isoDate(-20),
      archived: false,
      sortOrder: 2,
      difficulty: 3,
      type: 'negative',
      reminderTime: '18:05',
      reminderEnabled: true
    }
  ];
}

function noopSetter<T>() {
  return (_value: React.SetStateAction<T>) => undefined;
}

function buildDemoEditModel(): AddEditHabitModel {
  const selectedColor = COLORS.find((item) => item.value === 'cyan') ?? COLORS[0];
  const setString = noopSetter<string>();
  const setNumber = noopSetter<number>();
  const setColor = noopSetter<Habit['color']>();
  const setFrequency = noopSetter<Habit['frequency']>();
  const setSchedule = noopSetter<HabitSchedule>();
  const setDifficulty = noopSetter<1 | 2 | 3 | 4 | 5>();
  const setType = noopSetter<'positive' | 'negative'>();

  return {
    habitId: 'demo-read',
    isEdit: true,
    hasExisting: true,
    shouldShowLoading: false,
    showSoftLimitWarning: false,
    acknowledgeSoftLimit: () => undefined,
    name: 'Read 20 pages',
    setName: setString,
    description: 'Build a consistent nightly reading routine.',
    setDescription: setString,
    color: 'cyan',
    setColor,
    icon: '📚',
    setIcon: setString,
    frequency: 'daily',
    setFrequency,
    schedule: { type: 'daily' },
    setSchedule,
    customDays: [1, 2, 3, 4, 5],
    toggleCustomDay: () => undefined,
    targetStreak: 30,
    setTargetStreak: setNumber,
    canDecreaseStreak: true,
    canIncreaseStreak: true,
    decreaseTargetStreak: () => undefined,
    increaseTargetStreak: () => undefined,
    dailyTarget: 1,
    setDailyTarget: setNumber,
    difficulty: 2,
    setDifficulty,
    type: 'positive',
    setType,
    tags: ['learning', 'focus'],
    tagInput: '',
    setTagInput: setString,
    reminderTime: '21:00',
    setReminderTime: setString,
    reminderEnabled: true,
    toggleReminderEnabled: () => undefined,
    selectedColor,
    errors: {},
    addTag: () => undefined,
    removeTag: () => undefined,
    handleSubmit: async () => undefined,
    handleBack: () => undefined
  };
}

function buildDailyHabitDetails(habits: Habit[]) {
  const details: Record<string, string[]> = {};
  habits.forEach((habit) => {
    const threshold = Math.max(1, habit.dailyTarget ?? 1);
    Object.entries(habit.completions).forEach(([date, count]) => {
      if ((count ?? 0) >= threshold) {
        if (!details[date]) {
          details[date] = [];
        }
        details[date].push(formatHabitLabel(habit));
      }
    });
  });
  return details;
}

function buildDemoStatsModel(habits: Habit[]) {
  const allStats = habits.map((habit, idx) => ({
    habit,
    stats: {
      completionRate: [88, 76, 69][idx] ?? 70,
      completedDays: [26, 22, 20][idx] ?? 18,
      longestStreak: [21, 14, 15][idx] ?? 10,
      currentStreak: [12, 8, 6][idx] ?? 4,
      weeklyData: [6, 7, 5, 6, 5, 7, 6, 6, 5, 7, 6, 6].map((count) => ({ count }))
    }
  }));

  const habitPeriodData = [
    { period: 'Oct', 'Morning Run': 74, 'Read 20 pages': 62, 'No sugar after 18:00': 58 },
    { period: 'Nov', 'Morning Run': 78, 'Read 20 pages': 68, 'No sugar after 18:00': 61 },
    { period: 'Dec', 'Morning Run': 82, 'Read 20 pages': 70, 'No sugar after 18:00': 65 },
    { period: 'Jan', 'Morning Run': 86, 'Read 20 pages': 72, 'No sugar after 18:00': 66 },
    { period: 'Feb', 'Morning Run': 88, 'Read 20 pages': 75, 'No sugar after 18:00': 68 },
    { period: 'Mar', 'Morning Run': 90, 'Read 20 pages': 76, 'No sugar after 18:00': 69 }
  ];
  const insights: Insight[] = [
    { id: 'streak', title: 'Best streak', body: 'Morning Run leads with a 21-day streak.', icon: FlameIcon },
    { id: 'weekday', title: 'Weekday shift', body: 'Wednesday is your strongest day this month.', icon: BarChart2Icon },
    { id: 'momentum', title: 'Momentum', body: '2 habits improved versus the previous period.', icon: TrendingUpIcon }
  ];
  const activityWeeks: ActivityWeek[] = [
    {
      label: 'Week 1',
      days: [
        { date: '2026-03-01', intensity: 2, isFrozen: false, inWindow: true },
        { date: '2026-03-02', intensity: 3, isFrozen: false, inWindow: true },
        { date: '2026-03-03', intensity: 2, isFrozen: false, inWindow: true },
        { date: '2026-03-04', intensity: 1, isFrozen: false, inWindow: true },
        { date: '2026-03-05', intensity: 3, isFrozen: false, inWindow: true },
        { date: '2026-03-06', intensity: 2, isFrozen: false, inWindow: true },
        { date: '2026-03-07', intensity: 0, isFrozen: true, inWindow: true }
      ]
    }
  ];
  const period: PeriodOption = 'month';
  const dailyHabitDetails = buildDailyHabitDetails(habits);

  return {
    navigate: () => undefined,
    avgRate: 78,
    bestStreak: 21,
    totalCompletions: 68,
    currentStreaks: 3,
    searchQuery: '',
    setSearchQuery: () => undefined,
    statusFilter: 'all' as const,
    setStatusFilter: () => undefined,
    allTags: Array.from(new Set(habits.flatMap((habit) => habit.tags))),
    selectedTags: [],
    toggleTag: () => undefined,
    dailyData: [
      { day: 'Mar 01', axisLabel: 'Mar 26', completed: 2, total: 3, rate: 67 },
      { day: 'Mar 02', axisLabel: 'Mar 26', completed: 3, total: 3, rate: 100 },
      { day: 'Mar 03', axisLabel: 'Mar 26', completed: 2, total: 3, rate: 67 },
      { day: 'Mar 04', axisLabel: 'Mar 26', completed: 2, total: 3, rate: 67 },
      { day: 'Mar 05', axisLabel: 'Mar 26', completed: 3, total: 3, rate: 100 },
      { day: 'Mar 06', axisLabel: 'Mar 26', completed: 2, total: 3, rate: 67 },
      { day: 'Mar 07', axisLabel: 'Mar 26', completed: 1, total: 3, rate: 33 },
      { day: 'Mar 08', axisLabel: 'Mar 26', completed: 2, total: 3, rate: 67 },
      { day: 'Mar 09', axisLabel: 'Mar 26', completed: 2, total: 3, rate: 67 }
    ],
    habitPeriodData,
    filteredHabits: habits,
    dailyHabitDetails,
    sorted: [...allStats].sort((a, b) => b.stats.completionRate - a.stats.completionRate),
    allStats,
    bestWeekday: 'Wednesday',
    worstWeekday: 'Sunday',
    investmentPercent: 78,
    totalActiveDays: 26,
    period,
    setPeriod: () => undefined,
    hiddenHabits: [],
    toggleHabitVisibility: () => undefined,
    insights,
    activityWeeks
  };
}

function PreviewSlide({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="min-w-full snap-start overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-[0_10px_40px_rgba(2,6,23,0.18)]">
      <div className="border-b border-slate-200 bg-white px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-slate-500">
        {title}
      </div>
      <div className="relative max-h-[760px] overflow-hidden" data-theme="cloud">
        <div className="pointer-events-none">{children}</div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-[#f8f9fb]" />
      </div>
    </article>
  );
}

export function PublicPreviewCarousel() {
  const demoHabits = useMemo(() => buildDemoHabits(), []);
  const demoEditModel = useMemo(() => buildDemoEditModel(), []);
  const demoStatsModel = useMemo(() => buildDemoStatsModel(demoHabits), [demoHabits]);
  const today = isoDate(0);
  const allTags = useMemo(
    () => Array.from(new Set(demoHabits.flatMap((habit) => habit.tags))),
    [demoHabits]
  );
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollPreview = (direction: 'left' | 'right') => {
    const node = carouselRef.current;
    if (!node) {
      return;
    }
    const width = Math.max(320, node.clientWidth * 0.92);
    node.scrollBy({ left: direction === 'right' ? width : -width, behavior: 'smooth' });
  };

  return (
    <section id="product-preview" className="border-b border-slate-200 bg-[#f8fafc] px-4 py-12 sm:px-6">
      <div className="mx-auto w-full max-w-6xl">
        <p className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">Inside the app</p>
        <h2 className="mb-5 text-2xl font-semibold text-slate-900">Swipe through real screens</h2>

        <div className="mb-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => scrollPreview('left')}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-400"
          >
            <ChevronLeftIcon size={14} />
            Left
          </button>
          <button
            type="button"
            onClick={() => scrollPreview('right')}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-400"
          >
            Right
            <ChevronRightIcon size={14} />
          </button>
        </div>

        <div
          ref={carouselRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <PreviewSlide title="Dashboard">
            <BrowserRouter>
              <DashboardView
                habits={demoHabits}
                filtered={demoHabits}
                reminders={[]}
                dropHint={null}
                dragOverHabitId={null}
                draggedHabitId={null}
                searchQuery=""
                setSearchQuery={() => undefined}
                filter="all"
                allTags={allTags}
                selectedTags={[]}
                addingTemplate={null}
                today={today}
                todayRate={67}
                completedToday={2}
                totalActive={3}
                dateStr={new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric'
                })}
                overallStreak={15}
                daysSinceLastCompletion={0}
                setFilter={() => undefined}
                setSelectedTags={() => undefined}
                toggleTag={() => undefined}
                navigate={() => undefined}
                handleExport={() => undefined}
                handleTemplateSelect={async () => undefined}
                handleToggle={async () => undefined}
                handleDismissReminder={() => undefined}
                handleDisableReminder={async () => undefined}
                handleDragStart={() => undefined}
                handleDragOver={() => undefined}
                handleDrop={async () => undefined}
                handleDragEnd={() => undefined}
                handleTouchStart={() => undefined}
                sortMode="custom"
                setSortMode={() => undefined}
                viewDensity="comfortable"
                setViewDensity={() => undefined}
                heroCollapsed={false}
                setHeroCollapsed={() => undefined}
              />
            </BrowserRouter>
          </PreviewSlide>

          <PreviewSlide title="Edit Habit">
            <BrowserRouter>
              <AddEditHabitPage model={demoEditModel} />
            </BrowserRouter>
          </PreviewSlide>

          <PreviewSlide title="Stats">
            <BrowserRouter>
              <StatsView {...demoStatsModel} />
            </BrowserRouter>
          </PreviewSlide>
        </div>
      </div>
    </section>
  );
}
