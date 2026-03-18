import { useState, useRef, useCallback } from 'react';
import { CheckIcon, FlameIcon, GripVerticalIcon, SnowflakeIcon } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CompletionRing } from '@/components/CompletionRing';
import { MiniHeatmap } from '@/components/MiniHeatmap';
import { HABIT_COLOR_THEMES } from '@/lib/theme/habit-colors';
import type { HabitColorTheme } from '@/lib/theme/habit-colors';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { calculateScheduledCompletionRate, calculateScheduledStreak, getScheduleStatusForDate, isMandatoryToday } from '@/lib/habits/schedule';
import { formatDate } from '@/lib/habits/habitStats';
import type { Habit } from '@/types/habit';
import type { ViewDensity } from './DashboardHero';

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
      {/* Streak — always visible, size scales up on sm+ */}
      <div className="flex items-center gap-0.5 w-10 sm:w-20 justify-end">
        {streak > 0 && (
          habit.type === 'negative' ? (
            <span className="hidden sm:inline text-[10px] font-mono text-accent-secondary whitespace-nowrap">{streak}d 🏆</span>
          ) : (
            <>
              <FlameIcon size={10} className="text-accent-secondary flex-shrink-0" />
              <span className="text-[10px] font-mono text-accent-secondary">{streak}</span>
            </>
          )
        )}
      </div>

      {/* Ring — always visible */}
      <CompletionRing
        percentage={completionRate}
        size={28}
        strokeWidth={2.5}
        color={habit.color}
        showText={false}
      />

      {/* Weekly bars — hidden on mobile */}
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

      {/* Heatmap — lg only */}
      <div className="hidden lg:flex items-center justify-end ml-1" aria-hidden>
        <MiniHeatmap completions={habit.completions} dailyTarget={target} color={habit.color} />
      </div>
    </div>
  );
}


function MiniBars({ last7, accentHex }: { last7: boolean[]; accentHex: string }) {
  return (
    <div className="flex items-end gap-[2px] h-[13px] progress-shimmer" aria-hidden>
      {last7.map((done, i) => (
        <span
          key={i}
          className="w-[3px] rounded-sm transition-all progress-shimmer-bar"
          style={{
            height: done ? '100%' : '40%',
            backgroundColor: done ? accentHex : 'var(--border)',
            opacity: done ? 1 : 0.4 + i * 0.07,
            animationDelay: `${i * 0.08}s`
          }}
        />
      ))}
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
    />
  );
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
  viewDensity,
  appearanceIndex
}: HabitRowCardProps) {
  const outerPaddingClass = 'px-2 py-1.5';
  const innerGapClass = 'gap-2';
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
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          onDetail();
          return;
        }
        if (event.key === ' ') {
          event.preventDefault();
          onToggle();
        }
      }}
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
        <div className="relative z-10 flex items-center min-w-0 overflow-hidden flex-1">
          <div
            className="w-1 self-stretch flex-shrink-0 rounded-l-xl"
            style={{ background: accent.hex }}
            aria-hidden
          />
          <div className={`flex-1 flex items-center justify-between w-full ${innerPaddingClass}`}>
            {/* Left side: grip + info */}
            <div className="flex items-center min-w-0 gap-2">
              {/* Grip handle — touch-draggable on mobile, visible always */}
              <div
                className={gripHandleClass}
                onTouchStart={onTouchStart}
                aria-hidden
              >
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
            {/* Right side: metrics + toggle — pinned to right edge via justify-between */}
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
              />
            </div>
          </div>
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
  const statusBadge = isFrozen
    ? { label: 'Frozen', tone: 'text-accent-secondary', title: 'Frozen today' }
    : !scheduledToday
      ? { label: 'Not today', tone: 'text-muted', title: 'Not scheduled today' }
      : null;

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

type HabitRowToggleButtonProps = {
  completed: boolean;
  isFrozen: boolean;
  accent: HabitColorTheme;
  toggleButtonClass: string;
  toggleButtonTitle: string;
  onToggle: () => void;
  streak: number;
  targetStreak: number;
  sizeClass?: string;
};

const CONFETTI_COLORS = ['var(--accent)', 'var(--accent-secondary)', '#fff', 'var(--glow)'];

function HabitRowToggleButton({
  completed,
  isFrozen,
  accent,
  toggleButtonClass,
  toggleButtonTitle,
  onToggle,
  streak,
  targetStreak,
  sizeClass = 'w-8 h-8'
}: HabitRowToggleButtonProps) {
  const [animating, setAnimating] = useState(false);
  const [particles, setParticles] = useState<{ id: number; tx: number; ty: number; color: string }[]>([]);
  const particleIdRef = useRef(0);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // Fire animation only when going unchecked → checked
    if (!completed) {
      setAnimating(true);
      // Spawn confetti particles
      const newParticles = Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * 2 * Math.PI;
        const dist = 20 + Math.random() * 18;
        return {
          id: ++particleIdRef.current,
          tx: Math.cos(angle) * dist,
          ty: Math.sin(angle) * dist - 10,
          color: CONFETTI_COLORS[i % CONFETTI_COLORS.length]
        };
      });
      setParticles(newParticles);

      // Task 1: Big celebration on Target Streak
      if (streak + 1 === targetStreak) {
        setTimeout(() => {
          confetti({
            particleCount: 150,
            spread: 160,
            origin: { y: 0.6 },
            colors: ['#FFD700', '#FFA500', accent.hex],
            zIndex: 1000
          });
        }, 300);
      }

      setTimeout(() => {
        setAnimating(false);
        setParticles([]);
      }, 650);
    }
    onToggle();
  }, [completed, onToggle, streak, targetStreak, accent.hex]);

  return (
    <div className="relative flex-shrink-0">
      {/* Confetti particles */}
      {particles.map((p: any) => (
        <span
          key={p.id}
          className="confetti-particle"
          style={{
            '--tx': `${p.tx}px`,
            '--ty': `${p.ty}px`,
            background: p.color,
            left: '50%',
            top: '50%',
            marginLeft: '-3px',
            marginTop: '-3px'
          } as React.CSSProperties}
        />
      ))}
      <button
        type="button"
        onClick={handleClick}
        disabled={isFrozen}
      className={`${sizeClass} rounded-xl border-[1.5px] flex items-center justify-center transition-all duration-200 ${toggleButtonClass} ${
          animating ? 'animate-check-pulse animate-glow-burst' : ''
        } ${isFrozen ? 'cursor-not-allowed opacity-60' : ''}`}
        style={completed && !isFrozen ? { boxShadow: `0 0 12px ${accent.glow}` } : undefined}
        aria-label={toggleButtonTitle}
        title={toggleButtonTitle}
      >
        {isFrozen ? (
          <span className="text-[12px] opacity-80" aria-label="Frozen">🧊</span>
        ) : (
          completed && <CheckIcon size={14} className={accent.textClass} strokeWidth={3} />
        )}
      </button>
    </div>
  );
}


export function HabitTile({
  habit,
  onToggle,
  onDetail,
  appearanceIndex
}: Pick<HabitRowProps, 'habit' | 'onToggle' | 'onDetail' | 'appearanceIndex'>) {
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
      ? 'Frozen today'
      : `Manual completion for ${habit.name}`;

  const animationDelayValue = Math.min(Math.max(appearanceIndex ?? 0, 0), 12) * 0.05;

  return (
    <div
      role="listitem"
      tabIndex={0}
      aria-label={`${habit.name}, ${completed ? 'completed' : 'not completed'}`}
      className={`relative bg-bg-secondary border rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:border-border-hover active:scale-[0.97] animate-fade-slide-up ${
        isFrozen ? 'opacity-75 border-border/50' : 'border-border'
      }`}
      style={{ animationDelay: `${animationDelayValue}s` }}
      onClick={onDetail}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); onDetail(); }
        if (e.key === ' ') { e.preventDefault(); onToggle(); }
      }}
    >
      <div className="h-[3px] w-full" style={{ background: accent.hex }} />
      <div className="p-3 flex flex-col" style={{ minHeight: '120px' }}>
        {/* Top: icon + ring — fixed */}
        <div className="flex items-center justify-between mb-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: accent.dim }}
          >
            {habit.icon}
          </div>
          <CompletionRing percentage={completionRate} size={26} strokeWidth={2.5} color={habit.color} showText={false} />
        </div>

        {/* Middle: name + meta — grows to fill space */}
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-semibold truncate leading-tight ${completed ? 'text-muted line-through' : 'text-foreground'}`}>
            {habit.name}
            {habit.dailyTarget && habit.dailyTarget > 1 && (
              <span className="ml-1 text-[10px] font-mono font-medium px-1 py-0.5 rounded bg-accent/10 text-accent-secondary">
                ×{habit.dailyTarget}
              </span>
            )}
          </div>
          <div className="mt-0.5 h-4">
            {streak > 0 && !isFrozen && scheduledToday ? (
              habit.type === 'negative' ? (
                <span className="text-[10px] font-mono text-accent-secondary">{streak}d 🏆</span>
              ) : (
                <div className="flex items-center gap-0.5">
                  <FlameIcon size={9} className="text-accent-secondary flex-shrink-0" />
                  <span className="text-[10px] font-mono text-accent-secondary">{streak}</span>
                </div>
              )
            ) : isFrozen ? (
              <span className="text-[10px] font-mono text-muted">🧊</span>
            ) : !scheduledToday ? (
              <span className="text-[10px] font-mono text-muted">🌙</span>
            ) : null}
          </div>
        </div>

        {/* Bottom: mini bars + toggle — always pinned */}
        <div className="flex items-center justify-between mt-2 pt-1 border-t border-border/30">
          <MiniBars last7={last7} accentHex={accent.hex} />
          <HabitRowToggleButton
            completed={completed}
            isFrozen={isFrozen}
            accent={accent}
            toggleButtonClass={toggleButtonClass}
            toggleButtonTitle={toggleButtonTitle}
            onToggle={onToggle}
            streak={streak}
            targetStreak={habit.targetStreak}
            sizeClass="w-8 h-8"
          />
        </div>
      </div>
    </div>
  );
}

export function DropIndicator() {
  return (
    <div className="px-4 py-1">
      <div className="h-[3px] w-full rounded-full bg-gradient-to-r from-accent to-accent-secondary animate-pulse transition-all" />
    </div>
  );
}
