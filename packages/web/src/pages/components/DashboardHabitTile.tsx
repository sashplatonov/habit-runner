import { useCallback, useRef, useState } from 'react';
import { CheckIcon, FlameIcon } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CompletionRing } from '@/components/CompletionRing';
import { HabitHeatmap } from '@/components/HabitHeatmap';
import { HABIT_COLOR_THEMES } from '@/lib/theme/habit-colors';
import type { HabitColorTheme } from '@/lib/theme/habit-colors';
import { calculateScheduledCompletionRate, calculateScheduledStreak, getScheduleStatusForDate, isMandatoryToday } from '@/lib/habits/schedule';
import { toCompletionKey } from '@/lib/completionKey';
import type { Habit } from '@/types/habit';

const CONFETTI_COLORS = ['var(--accent)', 'var(--accent-secondary)', '#fff', 'var(--glow)'];

function MultiTargetProgress({
  accentHex,
  progressRatio,
  cappedTodayCount,
  safeDailyTarget
}: {
  accentHex: string;
  progressRatio: number;
  cappedTodayCount: number;
  safeDailyTarget: number;
}) {
  return (
    <>
      <span
        className="absolute inset-[2px] rounded-[10px] pointer-events-none overflow-hidden"
        aria-hidden
      >
        <span
          className="absolute inset-y-0 left-0 rounded-[8px] transition-all duration-200"
          style={{
            width: `${progressRatio * 100}%`,
            background: `linear-gradient(90deg, ${accentHex}88, ${accentHex})`
          }}
        />
      </span>
      <span className="absolute inset-[5px] flex items-end gap-[2px] pointer-events-none z-0" aria-hidden>
        {Array.from({ length: safeDailyTarget }, (_, index) => {
          const isFilled = index < cappedTodayCount;
          return (
            <span
              key={index}
              className="h-full flex-1 rounded-full transition-colors duration-200"
              style={{
                backgroundColor: isFilled ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.18)',
                opacity: isFilled ? 1 : 0.6
              }}
            />
          );
        })}
      </span>
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
  todayCount: number;
  dailyTarget: number;
};

export function HabitRowToggleButton({
  completed,
  isFrozen,
  accent,
  toggleButtonClass,
  toggleButtonTitle,
  onToggle,
  streak,
  targetStreak,
  sizeClass = 'w-8 h-8',
  todayCount,
  dailyTarget
}: HabitRowToggleButtonProps) {
  const [animating, setAnimating] = useState(false);
  const [particles, setParticles] = useState<{ id: number; tx: number; ty: number; color: string }[]>([]);
  const particleIdRef = useRef(0);
  const safeDailyTarget = Math.max(1, dailyTarget);
  const cappedTodayCount = Math.min(Math.max(todayCount, 0), safeDailyTarget);
  const showProgress = safeDailyTarget > 1;
  const progressRatio = cappedTodayCount / safeDailyTarget;

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!completed) {
      setAnimating(true);
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
  }, [accent.hex, completed, onToggle, streak, targetStreak]);

  return (
    <div className="relative flex-shrink-0">
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
        disabled={isFrozen}
        className={`${sizeClass} rounded-xl border-[1.5px] flex items-center justify-center transition-all duration-200 relative ${toggleButtonClass} ${
          animating ? 'animate-check-pulse animate-glow-burst' : ''
        } ${isFrozen ? 'cursor-not-allowed opacity-60' : ''}`}
        style={completed && !isFrozen ? { boxShadow: `0 0 12px ${accent.glow}` } : undefined}
        aria-label={toggleButtonTitle}
        title={toggleButtonTitle}
      >
        {showProgress && (
          <MultiTargetProgress
            accentHex={accent.hex}
            progressRatio={progressRatio}
            cappedTodayCount={cappedTodayCount}
            safeDailyTarget={safeDailyTarget}
          />
        )}
        {isFrozen ? (
          <span className="text-[12px] opacity-80" aria-label="Frozen">🧊</span>
        ) : (
          completed && <CheckIcon size={14} className={`${accent.textClass} relative z-10`} strokeWidth={3} />
        )}
      </button>
    </div>
  );
}

type TileHint = { text: string; type: 'good' | 'warn' | 'tip' };

function computeTileHint(habit: Habit, completionRate: number, streak: number): TileHint | null {
  const target = Math.max(1, habit.dailyTarget ?? 1);
  const today = new Date();
  const habitAgeDays = Math.floor((today.getTime() - new Date(habit.createdAt).getTime()) / (1000 * 60 * 60 * 24));

  // New habit — encourage, skip long-period comparisons
  if (habitAgeDays < 7) {
    if (streak > 0) return { text: `🌱 Day ${streak} — great start!`, type: 'good' };
    return { text: '🌱 New habit — start today!', type: 'tip' };
  }

  let recent7 = 0;
  let prev7 = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = toCompletionKey(d);
    if ((habit.completions[key] ?? 0) >= target) recent7++;
  }

  // Only compare prev7 if the habit existed during that window
  const canComparePrev = habitAgeDays >= 14;
  if (canComparePrev) {
    for (let i = 7; i < 14; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = toCompletionKey(d);
      if ((habit.completions[key] ?? 0) >= target) prev7++;
    }
  }

  const weekTrend = canComparePrev ? recent7 - prev7 : 0;
  if (completionRate >= 80 && streak >= 5) return { text: '✅ On track — great consistency', type: 'good' };
  if (weekTrend >= 3) return { text: '📈 Trending up this week', type: 'good' };
  if (streak === 0 && completionRate > 20) return { text: '⚠️ Restart your streak today', type: 'warn' };
  if (canComparePrev && weekTrend <= -3 && recent7 < 3) return { text: '📉 Losing momentum — stay consistent', type: 'warn' };
  if (habitAgeDays >= 30 && completionRate < 40) return { text: '💡 Try adjusting schedule or goal', type: 'tip' };
  return null;
}

function HabitTileMeta({
  habit,
  completed,
  streak,
  isFrozen,
  scheduledToday,
  hint
}: {
  habit: Habit;
  completed: boolean;
  streak: number;
  isFrozen: boolean;
  scheduledToday: boolean;
  hint: TileHint | null;
}) {
  const hintColor = hint?.type === 'good' ? 'text-accent' : hint?.type === 'warn' ? 'text-accent-secondary' : 'text-muted';
  return (
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
      {hint && (
        <p className={`text-[9px] font-mono mt-1 truncate ${hintColor}`}>{hint.text}</p>
      )}
    </div>
  );
}

function buildTilePresentation(habit: Habit) {
  const todayKey = toCompletionKey(new Date());
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const status = getScheduleStatusForDate(habit, todayDate);
  const scheduledToday = status === 'scheduled' && isMandatoryToday(habit, todayDate);
  const target = Math.max(1, habit.dailyTarget ?? 1);
  const todayCount = habit.completions[todayKey] ?? 0;
  const completed = todayCount >= target;
  const accent = HABIT_COLOR_THEMES[habit.color];
  const { current: streak } = calculateScheduledStreak(habit, habit.completions);
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

  const hint = computeTileHint(habit, completionRate, streak);

  return {
    accent,
    completed,
    completionRate,
    hint,
    isFrozen,
    scheduledToday,
    streak,
    target,
    todayCount,
    toggleButtonClass,
    toggleButtonTitle
  };
}

export function HabitTile({
  habit,
  onToggle,
  onDetail,
  appearanceIndex
}: {
  habit: Habit;
  onToggle: () => void;
  onDetail: () => void;
  appearanceIndex?: number;
}) {
  const presentation = buildTilePresentation(habit);
  const animationDelayValue = Math.min(Math.max(appearanceIndex ?? 0, 0), 12) * 0.05;

  return (
    <div
      role="listitem"
      tabIndex={0}
      aria-label={`${habit.name}, ${presentation.completed ? 'completed' : 'not completed'}`}
      className={`relative bg-bg-secondary border rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:border-border-hover active:scale-[0.97] animate-fade-slide-up ${
        presentation.isFrozen ? 'opacity-75 border-border/50' : 'border-border'
      }`}
      style={{ animationDelay: `${animationDelayValue}s` }}
      onClick={onDetail}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); onDetail(); }
        if (e.key === ' ') { e.preventDefault(); onToggle(); }
      }}
    >
      <div className="h-[3px] w-full" style={{ background: presentation.accent.hex }} />
      <div className="p-3 flex flex-col" style={{ minHeight: '120px' }}>
        <div className="flex items-center justify-between mb-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: presentation.accent.dim }}
          >
            {habit.icon}
          </div>
          <CompletionRing percentage={presentation.completionRate} size={26} strokeWidth={2.5} color={habit.color} showText={false} />
        </div>

        <HabitTileMeta
          habit={habit}
          completed={presentation.completed}
          streak={presentation.streak}
          isFrozen={presentation.isFrozen}
          scheduledToday={presentation.scheduledToday}
          hint={presentation.hint}
        />

        <div className="flex items-center justify-between mt-2 pt-1 border-t border-border/30">
          <HabitHeatmap
            completions={habit.completions}
            dailyTarget={presentation.target}
            color={habit.color}
            compact
          />
          <HabitRowToggleButton
            completed={presentation.completed}
            isFrozen={presentation.isFrozen}
            accent={presentation.accent}
            toggleButtonClass={presentation.toggleButtonClass}
            toggleButtonTitle={presentation.toggleButtonTitle}
            onToggle={onToggle}
            streak={presentation.streak}
            targetStreak={habit.targetStreak}
            sizeClass="w-8 h-8"
            todayCount={presentation.todayCount}
            dailyTarget={presentation.target}
          />
        </div>
      </div>
    </div>
  );
}
