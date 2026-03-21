import { GripVerticalIcon, SnowflakeIcon, FlameIcon, TrophyIcon } from 'lucide-react';
import { CompletionRing } from '@/components/CompletionRing';
import { MiniHeatmap } from '@/components/MiniHeatmap';
import { HABIT_COLOR_THEMES } from '@/lib/theme/habit-colors';
import type { HabitColorTheme } from '@/lib/theme/habit-colors';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { calculateScheduledCompletionRate, calculateScheduledStreak, getScheduleStatusForDate, isMandatoryToday } from '@/lib/habits/schedule';
import { formatDate } from '@/lib/habits/habitStats';
import type { Habit } from '@/types/habit';
import type { ViewDensity } from './DashboardHero';
import { HabitRowToggleButton } from './DashboardHabitTile';
export { HabitTile } from './DashboardHabitTile';

function buildLastWeek(completions: Record<string, number>, target: number) {
  return Array.from({ length: 7 }, (_, index) => {
    const cursor = new Date();
    cursor.setDate(cursor.getDate() - (6 - index));
    const key = formatDate(cursor);
    return (completions[key] ?? 0) >= target;
  });
}

type DropHintPosition = 'above' | 'below' | null;

type HabitRowProps = {
  habit: Habit;
  onToggle: () => void;
  onDetail: () => void;
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: () => void;
  onTouchStart?: (event: React.TouchEvent) => void;
  isDropTarget?: boolean;
  isDragging?: boolean;
  dropHintPosition?: DropHintPosition;
  viewDensity: ViewDensity;
  appearanceIndex?: number;
};

function HabitRowMetrics({
  habit,
  target,
  streak,
  last7,
  completionRate
}: {
  habit: Habit;
  target: number;
  streak: number;
  last7: boolean[];
  completionRate: number;
}) {
  const accent = HABIT_COLOR_THEMES[habit.color];

  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <div className="flex items-center gap-0.5 w-10 sm:w-20 justify-end">
        {streak > 0 && (
          habit.type === 'negative' ? (
            <span className="hidden sm:inline flex items-center gap-0.5 text-[10px] font-mono text-accent-secondary whitespace-nowrap">
              <TrophyIcon size={9} className="inline-block flex-shrink-0" />
              {streak}d
            </span>
          ) : (
            <>
              <FlameIcon size={10} className="text-accent-secondary flex-shrink-0" />
              <span className="text-[10px] font-mono text-accent-secondary">{streak}</span>
            </>
          )
        )}
      </div>

      <CompletionRing
        percentage={completionRate}
        size={28}
        strokeWidth={2.5}
        color={habit.color}
        showText={false}
      />

      <div className="hidden sm:flex items-end gap-[1px] h-4 ml-0.5" aria-hidden>
        {last7.map((done, i) => (
          <div
            key={i}
            className="w-[4px] rounded-sm transition-all"
            style={{
              height: done ? '100%' : '30%',
              backgroundColor: done ? accent.hex : 'var(--border)',
              opacity: i === 6 ? 1 : 0.5 + i * 0.07
            }}
          />
        ))}
      </div>

      <div className="hidden lg:flex items-center justify-end ml-1" aria-hidden>
        <MiniHeatmap completions={habit.completions} dailyTarget={target} color={habit.color} />
      </div>
    </div>
  );
}

export function HabitRow({
  habit,
  onToggle,
  onDetail,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onTouchStart,
  isDropTarget,
  isDragging = false,
  dropHintPosition,
  viewDensity,
  appearanceIndex
}: HabitRowProps) {
  const todayKey = formatDate(new Date());
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const status = getScheduleStatusForDate(habit, todayDate);
  const scheduledToday = status === 'scheduled' && isMandatoryToday(habit, todayDate);
  const target = Math.max(1, habit.dailyTarget ?? 1);
  const todayCount = habit.completions[todayKey] ?? 0;
  const completed = todayCount >= target;
  const accent = HABIT_COLOR_THEMES[habit.color];
  const { current: streak } = calculateScheduledStreak(habit, habit.completions);
  const last7 = buildLastWeek(habit.completions, target);
  const completionRate = calculateScheduledCompletionRate(habit, habit.completions);
  const isFrozen = status === 'frozen';
  const toggleButtonClass = completed
    ? `${accent.bgClass} ${accent.borderClass}`
    : scheduledToday
      ? 'border-border-hover hover:border-muted'
      : isFrozen
        ? 'border-border bg-bg-secondary text-muted'
        : 'border border-dashed border-border/40 text-muted hover:border-border';
  const toggleButtonTitle = scheduledToday
    ? `Mark ${habit.name} as ${completed ? 'incomplete' : 'complete'}`
    : isFrozen
      ? `Frozen today`
      : `Manual completion for ${habit.name}`;

  return (
    <HabitRowCard
      habit={habit}
      onToggle={onToggle}
      onDetail={onDetail}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onTouchStart={onTouchStart}
      isDropTarget={isDropTarget}
      isDragging={isDragging}
      dropHintPosition={dropHintPosition}
      viewDensity={viewDensity}
      appearanceIndex={appearanceIndex}
      completed={completed}
      scheduledToday={scheduledToday}
      isFrozen={isFrozen}
      accent={accent}
      streak={streak}
      last7={last7}
      completionRate={completionRate}
      toggleButtonClass={toggleButtonClass}
      toggleButtonTitle={toggleButtonTitle}
      todayCount={todayCount}
      target={target}
    />
  );
}

function handleHabitRowKeyDown(
  event: React.KeyboardEvent<HTMLDivElement>,
  onDetail: () => void,
  onToggle: () => void
) {
  if (event.key === 'Enter') {
    event.preventDefault();
    onDetail();
    return;
  }
  if (event.key === ' ') {
    event.preventDefault();
    onToggle();
  }
}

type HabitRowCardProps = {
  habit: Habit;
  completed: boolean;
  scheduledToday: boolean;
  isFrozen: boolean;
  accent: HabitColorTheme;
  streak: number;
  last7: boolean[];
  completionRate: number;
  toggleButtonClass: string;
  toggleButtonTitle: string;
  todayCount: number;
  target: number;
  viewDensity: ViewDensity;
  appearanceIndex?: number;
  onToggle: () => void;
  onDetail: () => void;
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: () => void;
  onTouchStart?: (event: React.TouchEvent) => void;
  isDropTarget?: boolean;
  isDragging?: boolean;
  dropHintPosition?: DropHintPosition;
};

function HabitRowCard({
  habit,
  completed,
  scheduledToday,
  isFrozen,
  accent,
  streak,
  last7,
  completionRate,
  toggleButtonClass,
  toggleButtonTitle,
  todayCount,
  target,
  onToggle,
  onDetail,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onTouchStart,
  isDropTarget,
  isDragging,
  dropHintPosition,
  viewDensity: _viewDensity,
  appearanceIndex
}: HabitRowCardProps) {
  const outerPaddingClass = 'px-2 py-1.5';
  const innerPaddingClass = 'px-2 py-2';
  const gripHandleClass = 'flex items-center p-0.5 -mx-0.5 touch-none cursor-grab active:cursor-grabbing';
  const dropTransformClass =
    dropHintPosition === 'above'
      ? '-translate-y-2'
      : dropHintPosition === 'below'
        ? 'translate-y-2'
        : '';
  const dragTransformClass = isDragging ? 'opacity-50 scale-[0.97] shadow-2xl ring-2 ring-accent/40' : '';

  const {
    handlers: swipeHandlers,
    offset: swipeOffset,
    direction: swipeDirection,
    isSwiping: isSwipingGesture
  } = useSwipeGesture({
    threshold: 60,
    onSwipeLeft: onDetail,
    onSwipeRight: () => {
      if (!isFrozen) {
        onToggle();
      }
    }
  });

  const animationDelayValue = Math.min(Math.max(appearanceIndex ?? 0, 0), 12) * 0.05;
  const cardStyle: React.CSSProperties = {
    animationDelay: `${animationDelayValue}s`,
    transform: `translateX(${swipeOffset}px)`,
    transition: isSwipingGesture ? 'none' : 'transform 0.2s ease-out',
    touchAction: 'pan-y',
    willChange: 'transform',
    width: '100%'
  };

  const indicatorOpacity = Math.min(1, Math.abs(swipeOffset) / 120);
  const indicatorColor =
    swipeDirection === 'right'
      ? 'rgba(16, 185, 129, 0.25)'
      : swipeDirection === 'left'
        ? 'rgba(59, 130, 246, 0.25)'
        : 'transparent';

  return (
    <div
      data-habit-id={habit.id}
      draggable={Boolean(onDragStart)}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      tabIndex={0}
      role="listitem"
      aria-label={`${habit.name}, ${completed ? 'completed' : 'not completed'}`}
      onKeyDown={(event) => handleHabitRowKeyDown(event, onDetail, onToggle)}
      className={`relative flex items-stretch w-full transform ${outerPaddingClass} ${dropTransformClass} ${dragTransformClass}`}
    >
      <div
        className={`habit-card-inner group z-0 flex items-stretch border rounded-xl overflow-hidden transition-all duration-200 cursor-pointer ${
          isDropTarget ? 'border-accent/60 bg-accent/5' : ''
        } ${isFrozen ? 'bg-bg-card opacity-80 border-border/50' : 'bg-bg-secondary border-border hover:border-border-hover'} animate-fade-slide-up active:scale-[0.98] active:shadow-sm`}
        style={cardStyle}
        onClick={onDetail}
        {...swipeHandlers}
      >
        <span
          className="habit-card-swipe-indicator"
          style={{
            opacity: indicatorOpacity,
            backgroundColor: indicatorColor
          }}
        />
        <HabitRowCardContent
          habit={habit}
          accent={accent}
          innerPaddingClass={innerPaddingClass}
          gripHandleClass={gripHandleClass}
          onTouchStart={onTouchStart}
          completed={completed}
          scheduledToday={scheduledToday}
          isFrozen={isFrozen}
          streak={streak}
          last7={last7}
          completionRate={completionRate}
          toggleButtonClass={toggleButtonClass}
          toggleButtonTitle={toggleButtonTitle}
          onToggle={onToggle}
          todayCount={todayCount}
          target={target}
        />
      </div>
    </div>
  );
}

function HabitRowCardContent({
  habit,
  accent,
  innerPaddingClass,
  gripHandleClass,
  onTouchStart,
  completed,
  scheduledToday,
  isFrozen,
  streak,
  last7,
  completionRate,
  toggleButtonClass,
  toggleButtonTitle,
  onToggle,
  todayCount,
  target
}: {
  habit: Habit;
  accent: HabitColorTheme;
  innerPaddingClass: string;
  gripHandleClass: string;
  onTouchStart?: (event: React.TouchEvent) => void;
  completed: boolean;
  scheduledToday: boolean;
  isFrozen: boolean;
  streak: number;
  last7: boolean[];
  completionRate: number;
  toggleButtonClass: string;
  toggleButtonTitle: string;
  onToggle: () => void;
  todayCount: number;
  target: number;
}) {
  return (
    <div className="relative z-10 flex items-center min-w-0 overflow-hidden flex-1">
      <div className="w-1 self-stretch flex-shrink-0 rounded-l-xl" style={{ background: accent.hex }} aria-hidden />
      <div className={`flex-1 flex items-center justify-between w-full ${innerPaddingClass}`}>
        <div className="flex items-center min-w-0 gap-2">
          <div className={gripHandleClass} onTouchStart={onTouchStart} aria-hidden>
            <GripVerticalIcon size={14} className="text-muted/60 group-hover:text-muted transition-colors" aria-hidden />
          </div>
          <HabitRowInfoPane
            habit={habit}
            accent={accent}
            completed={completed}
            scheduledToday={scheduledToday}
            isFrozen={isFrozen}
          />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <HabitRowMetrics
            habit={habit}
            target={Math.max(1, habit.dailyTarget ?? 1)}
            streak={streak}
            last7={last7}
            completionRate={completionRate}
          />
          <HabitRowToggleButton
            completed={completed}
            isFrozen={isFrozen}
            accent={accent}
            toggleButtonClass={toggleButtonClass}
            toggleButtonTitle={toggleButtonTitle}
            onToggle={onToggle}
            streak={streak}
            targetStreak={habit.targetStreak}
            todayCount={todayCount}
            dailyTarget={target}
          />
        </div>
      </div>
    </div>
  );
}

type HabitRowInfoPaneProps = {
  habit: Habit;
  accent: HabitColorTheme;
  completed: boolean;
  scheduledToday: boolean;
  isFrozen: boolean;
};

function HabitRowInfoPane({
  habit,
  accent,
  completed,
  scheduledToday,
  isFrozen
}: HabitRowInfoPaneProps) {
  const inlineTags = habit.tags.slice(0, 3);
  const extraTagCount = Math.max(0, habit.tags.length - inlineTags.length);
  const statusBadge = getHabitStatusBadge(isFrozen, scheduledToday);

  const nameClasses = `text-sm font-semibold ${completed ? 'text-muted line-through' : 'text-foreground'} truncate`;
  return (
    <>
      <div
        className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-base"
        style={{ background: accent.dim }}
        aria-hidden
      >
        {habit.icon}
      </div>
      <div
        className="flex flex-col min-w-0 text-left overflow-hidden justify-center"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={nameClasses}>
            {habit.name}
          </span>
          {habit.dailyTarget && habit.dailyTarget > 1 && (
            <span className="flex-shrink-0 text-[10px] font-mono font-medium px-1 py-0.5 rounded bg-accent/10 text-accent-secondary">
              ×{habit.dailyTarget}
            </span>
          )}
          {inlineTags.length > 0 && (
            <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
              {inlineTags.map((tag) => (
                <span key={tag} className="text-[10px] font-mono px-1 py-0.5 rounded bg-accent/10 text-accent-secondary whitespace-nowrap">
                  #{tag}
                </span>
              ))}
              {extraTagCount > 0 && (
                <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-accent/10 text-accent-secondary">
                  +{extraTagCount}
                </span>
              )}
            </div>
          )}
        </div>
        {(habit.description || statusBadge) && (
          <div className="flex items-center gap-2 mt-0.5">
            {habit.description && (
              <span className="text-[10px] text-muted truncate opacity-60">{habit.description}</span>
            )}
            {statusBadge && (
              <span
                className={`flex items-center gap-1 flex-shrink-0 text-[10px] font-mono uppercase tracking-[0.3em] ${statusBadge.tone}`}
                aria-label={statusBadge.title}
              >
                {isFrozen && (
                  <SnowflakeIcon size={10} className="text-current" aria-hidden />
                )}
                {statusBadge.label}
              </span>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function getHabitStatusBadge(isFrozen: boolean, scheduledToday: boolean) {
  if (isFrozen) {
    return { label: 'Frozen', tone: 'text-accent-secondary', title: 'Frozen today' };
  }
  if (!scheduledToday) {
    return { label: 'Not today', tone: 'text-muted', title: 'Not scheduled today' };
  }
  return null;
}

export function DropIndicator() {
  return (
    <div className="px-4 py-1">
      <div className="h-[3px] w-full rounded-full bg-gradient-to-r from-accent to-accent-secondary animate-pulse transition-all" />
    </div>
  );
}
