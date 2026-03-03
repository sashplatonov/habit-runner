import React, { useState } from 'react';
import {
  CheckIcon,
  ChevronRightIcon,
  FlameIcon,
  TrendingUpIcon,
  ZapIcon } from
'lucide-react';
import { CompletionRing } from '../components/CompletionRing';
import { Habit } from '../types/habit';
import { useHabits } from '../hooks/useHabits';
interface DashboardProps {
  onNavigate: (view: string, habitId?: string) => void;
}
const colorAccent: Record<
  string,
  {
    text: string;
    bg: string;
    border: string;
    glow: string;
  }> =
{
  blue: {
    text: 'text-[#00d4ff]',
    bg: 'bg-[#00d4ff]/10',
    border: 'border-[#00d4ff]/30',
    glow: 'shadow-[0_0_12px_rgba(0,212,255,0.2)]'
  },
  green: {
    text: 'text-[#00ff88]',
    bg: 'bg-[#00ff88]/10',
    border: 'border-[#00ff88]/30',
    glow: 'shadow-[0_0_12px_rgba(0,255,136,0.2)]'
  },
  purple: {
    text: 'text-purple-400',
    bg: 'bg-purple-400/10',
    border: 'border-purple-400/30',
    glow: 'shadow-[0_0_12px_rgba(168,85,247,0.2)]'
  },
  orange: {
    text: 'text-orange-400',
    bg: 'bg-orange-400/10',
    border: 'border-orange-400/30',
    glow: 'shadow-[0_0_12px_rgba(249,115,22,0.2)]'
  },
  red: {
    text: 'text-red-400',
    bg: 'bg-red-400/10',
    border: 'border-red-400/30',
    glow: 'shadow-[0_0_12px_rgba(239,68,68,0.2)]'
  },
  cyan: {
    text: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
    border: 'border-cyan-400/30',
    glow: 'shadow-[0_0_12px_rgba(34,211,238,0.2)]'
  }
};
function HabitRow({
  habit,
  onToggle,
  onDetail




}: {habit: Habit;onToggle: () => void;onDetail: () => void;}) {
  const today = new Date().toISOString().split('T')[0];
  const completed = !!habit.completions[today];
  const accent = colorAccent[habit.color];
  // Calculate current streak
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = d.toISOString().split('T')[0];
    if (habit.completions[key]) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  // Last 7 days mini bars
  const last7 = Array.from(
    {
      length: 7
    },
    (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return !!habit.completions[date.toISOString().split('T')[0]];
    }
  );
  // Completion rate last 30 days
  let rate30 = 0;
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    if (habit.completions[date.toISOString().split('T')[0]]) rate30++;
  }
  const completionRate = Math.round(rate30 / 30 * 100);
  return (
    <div
      className={`group flex items-center gap-3 px-4 py-3 border-b border-[#1e1e2e] hover:bg-[#0f0f1a] transition-colors cursor-pointer ${completed ? 'opacity-100' : 'opacity-90'}`}>

      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${completed ? `${accent.bg} ${accent.border} ${accent.glow}` : 'border-[#2e2e3e] hover:border-[#3e3e4e]'}`}
        aria-label={`Mark ${habit.name} as ${completed ? 'incomplete' : 'complete'}`}>

        {completed &&
        <CheckIcon size={11} className={accent.text} strokeWidth={3} />
        }
      </button>

      {/* Icon + Name */}
      <button
        onClick={onDetail}
        className="flex items-center gap-2.5 flex-1 min-w-0 text-left">

        <span className="text-base leading-none">{habit.icon}</span>
        <div className="min-w-0">
          <div
            className={`text-sm font-medium ${completed ? 'text-[#64748b] line-through' : 'text-white'} truncate`}>

            {habit.name}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {habit.tags.slice(0, 2).map((tag) =>
            <span
              key={tag}
              className={`text-[10px] font-mono ${accent.text} opacity-70`}>

                #{tag}
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Last 7 days mini bars */}
      <div className="hidden sm:flex items-end gap-[2px] h-5">
        {last7.map((done, i) =>
        <div
          key={i}
          className="w-[4px] rounded-sm transition-all"
          style={{
            height: done ? '100%' : '30%',
            backgroundColor: done ?
            habit.color === 'green' ?
            '#00ff88' :
            '#00d4ff' :
            '#1e1e2e',
            opacity: i === 6 ? 1 : 0.5 + i * 0.07
          }} />

        )}
      </div>

      {/* Streak */}
      <div className="hidden md:flex items-center gap-1 w-16 justify-end">
        {streak > 0 &&
        <>
            <FlameIcon size={11} className="text-orange-400" />
            <span className="text-[11px] font-mono text-orange-400">
              {streak}
            </span>
          </>
        }
      </div>

      {/* Completion ring */}
      <CompletionRing
        percentage={completionRate}
        size={32}
        strokeWidth={2.5}
        color={habit.color}
        showText={false} />


      {/* Chevron */}
      <button
        onClick={onDetail}
        className="text-[#2e2e3e] group-hover:text-[#64748b] transition-colors">

        <ChevronRightIcon size={14} />
      </button>
    </div>);

}
export function Dashboard({ onNavigate }: DashboardProps) {
  const { habits, toggleCompletion, getTodayCompletionRate } = useHabits();
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all');
  const today = new Date().toISOString().split('T')[0];
  const todayRate = getTodayCompletionRate();
  const completedToday = habits.filter((h) => h.completions[today]).length;
  const totalActive = habits.length;
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });
  const filtered = habits.filter((h) => {
    if (filter === 'pending') return !h.completions[today];
    if (filter === 'done') return !!h.completions[today];
    return true;
  });
  // Overall streak (days where all habits completed)
  let overallStreak = 0;
  const d = new Date();
  d.setDate(d.getDate() - 1);
  for (let i = 0; i < 30; i++) {
    const key = d.toISOString().split('T')[0];
    const allDone = habits.every((h) => h.completions[key]);
    if (allDone) {
      overallStreak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return (
    <div className="min-h-screen bg-[#080810] pt-14">
      {/* Header */}
      <div className="border-b border-[#1e1e2e] bg-[#080810] px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[11px] font-mono text-[#64748b] uppercase tracking-widest mb-1">
                {dateStr}
              </p>
              <h1 className="text-xl font-semibold text-white">Today</h1>
            </div>
            <div className="text-right">
              <div
                className="text-3xl font-mono font-bold text-[#00d4ff]"
                style={{
                  textShadow: '0 0 20px rgba(0,212,255,0.5)'
                }}>

                {todayRate}%
              </div>
              <div className="text-[10px] font-mono text-[#64748b]">
                {completedToday}/{totalActive} done
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-[#1e1e2e] rounded-full overflow-hidden mb-4">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${todayRate}%`,
                background: 'linear-gradient(90deg, #00d4ff, #00ff88)',
                boxShadow: '0 0 8px rgba(0,212,255,0.6)'
              }} />

          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-lg px-3 py-2">
              <div className="flex items-center gap-1.5 mb-1">
                <ZapIcon size={10} className="text-[#00d4ff]" />
                <span className="text-[10px] font-mono text-[#64748b] uppercase tracking-wider">
                  Active
                </span>
              </div>
              <span className="text-lg font-mono font-bold text-white">
                {totalActive}
              </span>
            </div>
            <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-lg px-3 py-2">
              <div className="flex items-center gap-1.5 mb-1">
                <FlameIcon size={10} className="text-orange-400" />
                <span className="text-[10px] font-mono text-[#64748b] uppercase tracking-wider">
                  Streak
                </span>
              </div>
              <span className="text-lg font-mono font-bold text-orange-400">
                {overallStreak}d
              </span>
            </div>
            <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-lg px-3 py-2">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUpIcon size={10} className="text-[#00ff88]" />
                <span className="text-[10px] font-mono text-[#64748b] uppercase tracking-wider">
                  Done
                </span>
              </div>
              <span className="text-lg font-mono font-bold text-[#00ff88]">
                {completedToday}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="border-b border-[#1e1e2e] px-4">
        <div className="max-w-2xl mx-auto flex gap-0">
          {(['all', 'pending', 'done'] as const).map((f) =>
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider border-b-2 transition-colors ${filter === f ? 'border-[#00d4ff] text-[#00d4ff]' : 'border-transparent text-[#64748b] hover:text-white'}`}>

              {f}
              {f === 'pending' &&
            <span className="ml-1.5 text-[9px] bg-[#1e1e2e] px-1 py-0.5 rounded font-mono">
                  {habits.filter((h) => !h.completions[today]).length}
                </span>
            }
            </button>
          )}
        </div>
      </div>

      {/* Habit list */}
      <div className="max-w-2xl mx-auto">
        {filtered.length === 0 ?
        <div className="flex flex-col items-center justify-center py-16 text-[#64748b]">
            <div className="text-4xl mb-3">✓</div>
            <p className="font-mono text-sm">All habits completed!</p>
          </div> :

        filtered.map((habit) =>
        <HabitRow
          key={habit.id}
          habit={habit}
          onToggle={() => toggleCompletion(habit.id)}
          onDetail={() => onNavigate('detail', habit.id)} />

        )
        }
      </div>
    </div>);

}