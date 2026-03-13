import React, { useState, useRef, useCallback } from 'react';
import { ArrowDownIcon, ArrowUpIcon, CheckIcon, FlameIcon, GripVerticalIcon } from 'lucide-react';
import { CompletionRing } from '@/components/CompletionRing';
import { MiniHeatmap } from '@/components/MiniHeatmap';
import { HABIT_COLOR_THEMES } from '@/lib/theme/habit-colors';
import type { HabitColorTheme } from '@/lib/theme/habit-colors';
import { calculateScheduledCompletionRate, calculateScheduledStreak, getScheduleStatusForDate } from '@/lib/habits/schedule';
import type { Habit } from '@/types/habit';

function getDateKey(date: Date) {
  return date.toISOString().split('T')[0];
}

function buildLastWeek(completions: Record<string, number>, target: number) {
  return Array.from({ length: 7 }, (_, index) => {
    const cursor = new Date();
    cursor.setDate(cursor.getDate() - (6 - index));
    const key = getDateKey(cursor);
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
  isDropTarget?: boolean;
  isDragging?: boolean;
  dropHintPosition?: DropHintPosition;
  reorderMode?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  disableMoveUp?: boolean;
  disableMoveDown?: boolean;
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
    <>
      <div className="hidden lg:flex items-center justify-end mr-1" aria-hidden>
        <MiniHeatmap completions={habit.completions} dailyTarget={target} color={habit.color} />
      </div>

      <div className="hidden md:flex items-end gap-[1px] h-4 sm:h-5" aria-hidden>
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

      <div className="flex items-center gap-1 w-12 sm:w-16 justify-end">
        {streak > 0 && (
          <>
            <FlameIcon size={11} className="text-accent-secondary" />
            <span className="text-[11px] font-mono text-accent-secondary">{streak}</span>
          </>
        )}
      </div>

      <div className="hidden md:block">
        <CompletionRing percentage={completionRate} size={32} strokeWidth={2.5} color={habit.color} showText={false} />
      </div>
    </>
  );
}


function MiniBars({ last7, accentHex }: { last7: boolean[]; accentHex: string }) {
  return (
    <div className="flex items-end gap-[2px] h-[13px]" aria-hidden>
      {last7.map((done, i) => (
        <span
          key={i}
          className="w-[3px] rounded-sm transition-all"
          style={{
            height: done ? '100%' : '40%',
            backgroundColor: done ? accentHex : 'var(--border)',
            opacity: done ? 1 : 0.4 + i * 0.07
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
  isDropTarget,
  isDragging = false,
  dropHintPosition,
  reorderMode,
  onMoveUp,
  onMoveDown,
  disableMoveUp,
  disableMoveDown
}: HabitRowProps) {
  const todayKey = getDateKey(new Date());
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const status = getScheduleStatusForDate(habit, todayDate);
  const scheduledToday = status === 'scheduled';
  const target = Math.max(1, habit.dailyTarget ?? 1);
  const todayCount = habit.completions[todayKey] ?? 0;
  const completed = todayCount >= target;
  const accent = HABIT_COLOR_THEMES[habit.color];
  const { current: streak } = calculateScheduledStreak(habit, habit.completions);
  const last7 = buildLastWeek(habit.completions, target);
  const completionRate = calculateScheduledCompletionRate(habit, habit.completions);
  const toggleButtonClass = completed
    ? `${accent.bgClass} ${accent.borderClass}`
    : scheduledToday
      ? 'border-border-hover hover:border-muted'
      : 'border border-dashed border-border/40 text-muted hover:border-border';
  const toggleButtonTitle = scheduledToday
    ? `Mark ${habit.name} as ${completed ? 'incomplete' : 'complete'}`
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
      isDropTarget={isDropTarget}
      isDragging={isDragging}
      dropHintPosition={dropHintPosition}
      completed={completed}
      scheduledToday={scheduledToday}
      accent={accent}
      streak={streak}
      last7={last7}
      completionRate={completionRate}
      toggleButtonClass={toggleButtonClass}
      toggleButtonTitle={toggleButtonTitle}
      reorderMode={reorderMode}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      disableMoveUp={disableMoveUp}
      disableMoveDown={disableMoveDown}
    />
  );
}

type HabitRowCardProps = {
  habit: Habit;
  completed: boolean;
  scheduledToday: boolean;
  accent: HabitColorTheme;
  streak: number;
  last7: boolean[];
  completionRate: number;
  toggleButtonClass: string;
  toggleButtonTitle: string;
  onToggle: () => void;
  onDetail: () => void;
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: () => void;
  isDropTarget?: boolean;
  isDragging?: boolean;
  dropHintPosition?: DropHintPosition;
  reorderMode?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  disableMoveUp?: boolean;
  disableMoveDown?: boolean;
};

function HabitRowCard({
  habit,
  completed,
  scheduledToday,
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
  isDropTarget,
  isDragging,
  dropHintPosition,
  reorderMode = false,
  onMoveUp,
  onMoveDown,
  disableMoveUp,
  disableMoveDown
}: HabitRowCardProps) {
  const dropTransformClass =
    dropHintPosition === 'above'
      ? '-translate-y-2'
      : dropHintPosition === 'below'
        ? 'translate-y-2'
        : '';
  const dragTransformClass = isDragging ? 'opacity-70 scale-[0.97] shadow-2xl' : '';
  return (
    <div
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
      className={`group flex items-stretch bg-bg-secondary border border-border rounded-xl overflow-hidden hover:border-border-hover transition-all duration-200 cursor-pointer transform ${dropTransformClass} ${dragTransformClass} ${
        isDropTarget ? 'border-accent/60 bg-accent/5' : ''
      }`}
    >
      <div
        className="w-1 self-stretch flex-shrink-0 rounded-l-xl"
        style={{ background: accent.hex }}
        aria-hidden
      />
      <div className="flex-1 flex items-center gap-3 px-3 py-3 min-w-0 overflow-hidden">
        <div className="hidden sm:flex items-center">
          <GripVerticalIcon size={14} className="text-muted" aria-hidden />
        </div>
        <HabitRowInfoPane
          habit={habit}
          accent={accent}
          completed={completed}
          scheduledToday={scheduledToday}
          streak={streak}
          last7={last7}
          onDetail={onDetail}
        />
        <HabitRowMetrics
          habit={habit}
          target={Math.max(1, habit.dailyTarget ?? 1)}
          streak={streak}
          last7={last7}
          completionRate={completionRate}
        />
        {reorderMode && (
          <HabitRowReorderControls
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            disableMoveUp={disableMoveUp}
            disableMoveDown={disableMoveDown}
          />
        )}
        <HabitRowToggleButton
          completed={completed}
          accent={accent}
          toggleButtonClass={toggleButtonClass}
          toggleButtonTitle={toggleButtonTitle}
          onToggle={onToggle}
        />
      </div>
    </div>
  );
}

type HabitRowInfoPaneProps = {
  habit: Habit;
  accent: HabitColorTheme;
  completed: boolean;
  scheduledToday: boolean;
  streak: number;
  last7: boolean[];
  onDetail: () => void;
};

function HabitRowInfoPane({
  habit,
  accent,
  completed,
  scheduledToday,
  streak,
  last7,
  onDetail
}: HabitRowInfoPaneProps) {
  return (
    <>
      <button
        type="button"
        onClick={onDetail}
        className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-lg"
        style={{ background: accent.dim }}
        tabIndex={-1}
        aria-hidden
      >
        {habit.icon}
      </button>
      <button
        type="button"
        onClick={onDetail}
        className="flex flex-col flex-1 min-w-0 text-left gap-1 overflow-hidden"
      >
        <div className={`text-sm font-semibold ${completed ? 'text-muted line-through' : 'text-foreground'} truncate`}>
          {habit.name}
        </div>
        <div className="flex items-center gap-2 mt-1">
          {streak > 0 && (
            <div className="flex items-center gap-1 text-[11px] font-mono font-medium" style={{ color: accent.hex }}>
              <FlameIcon size={10} />
              {streak}d
            </div>
          )}
          <MiniBars last7={last7} accentHex={accent.hex} />
          {!scheduledToday && (
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted">Not scheduled today</span>
          )}
        </div>
      </button>
    </>
  );
}

type HabitRowToggleButtonProps = {
  completed: boolean;
  accent: HabitColorTheme;
  toggleButtonClass: string;
  toggleButtonTitle: string;
  onToggle: () => void;
};

const CONFETTI_COLORS = ['var(--accent)', 'var(--accent-secondary)', '#fff', 'var(--glow)'];

function HabitRowToggleButton({
  completed,
  accent,
  toggleButtonClass,
  toggleButtonTitle,
  onToggle
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
      setTimeout(() => {
        setAnimating(false);
        setParticles([]);
      }, 650);
    }
    onToggle();
  }, [completed, onToggle]);

  return (
    <div className="relative flex-shrink-0">
      {/* Confetti particles */}
      {particles.map((p) => (
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
        className={`w-9 h-9 rounded-xl border-[1.5px] flex items-center justify-center transition-all duration-200 ${toggleButtonClass} ${
          animating ? 'animate-check-pulse animate-glow-burst' : ''
        }`}
        style={completed ? { boxShadow: `0 0 12px ${accent.glow}` } : undefined}
        aria-label={toggleButtonTitle}
        title={toggleButtonTitle}
      >
        {completed && <CheckIcon size={14} className={accent.textClass} strokeWidth={3} />}
      </button>
    </div>
  );
}

type HabitRowReorderControlsProps = {
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  disableMoveUp?: boolean;
  disableMoveDown?: boolean;
};

function HabitRowReorderControls({
  onMoveUp,
  onMoveDown,
  disableMoveUp,
  disableMoveDown
}: HabitRowReorderControlsProps) {
  return (
    <div className="flex flex-col gap-1 sm:hidden">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          if (!disableMoveUp) {
            void onMoveUp?.();
          }
        }}
        disabled={disableMoveUp}
        aria-label="Move habit up"
        className={`w-8 h-8 rounded-xl border border-border/60 flex items-center justify-center transition ${
          disableMoveUp ? 'cursor-not-allowed text-muted/50' : 'hover:border-accent hover:text-accent text-foreground'
        }`}
      >
        <ArrowUpIcon size={16} />
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          if (!disableMoveDown) {
            void onMoveDown?.();
          }
        }}
        disabled={disableMoveDown}
        aria-label="Move habit down"
        className={`w-8 h-8 rounded-xl border border-border/60 flex items-center justify-center transition ${
          disableMoveDown ? 'cursor-not-allowed text-muted/50' : 'hover:border-accent hover:text-accent text-foreground'
        }`}
      >
        <ArrowDownIcon size={16} />
      </button>
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
