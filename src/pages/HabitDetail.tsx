import React, { useState } from 'react';
import {
  ArrowLeftIcon,
  EditIcon,
  FlameIcon,
  TrendingUpIcon,
  CalendarIcon,
  TargetIcon,
  TrashIcon,
  ArchiveIcon,
  ArchiveRestoreIcon } from
'lucide-react';
import { HeatmapGrid } from '@/components/HeatmapGrid';
import { CompletionRing } from '@/components/CompletionRing';
import { useHabits } from '@/hooks/useHabits';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid } from
'recharts';
interface HabitDetailProps {
  habitId: string;
  onNavigate: (view: string, habitId?: string) => void;
}
const colorAccent: Record<
  string,
  {
    primary: string;
    glow: string;
    dim: string;
  }> =
{
  blue: {
    primary: '#00d4ff',
    glow: 'rgba(0,212,255,0.3)',
    dim: 'rgba(0,212,255,0.1)'
  },
  green: {
    primary: '#00ff88',
    glow: 'rgba(0,255,136,0.3)',
    dim: 'rgba(0,255,136,0.1)'
  },
  purple: {
    primary: '#a855f7',
    glow: 'rgba(168,85,247,0.3)',
    dim: 'rgba(168,85,247,0.1)'
  },
  orange: {
    primary: '#f97316',
    glow: 'rgba(249,115,22,0.3)',
    dim: 'rgba(249,115,22,0.1)'
  },
  red: {
    primary: '#ef4444',
    glow: 'rgba(239,68,68,0.3)',
    dim: 'rgba(239,68,68,0.1)'
  },
  cyan: {
    primary: '#22d3ee',
    glow: 'rgba(34,211,238,0.3)',
    dim: 'rgba(34,211,238,0.1)'
  }
};
export function HabitDetail({ habitId, onNavigate }: HabitDetailProps) {
  const {
    allHabits,
    toggleCompletion,
    getHabitStats,
    deleteHabit,
    updateHabit
  } = useHabits();
  const habit = allHabits.find((h) => h.id === habitId);
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!habit) {
    return (
      <div className="min-h-screen bg-[#080810] pt-14 flex items-center justify-center">
        <div className="text-[#64748b] font-mono">Habit not found</div>
      </div>);

  }
  const stats = getHabitStats(habitId);
  const accent = colorAccent[habit.color];
  const today = new Date().toISOString().split('T')[0];
  const completedToday = !!habit.completions[today];
  const handleDelete = () => {
    deleteHabit(habitId);
    onNavigate('dashboard');
  };
  const handleToggleArchive = () => {
    updateHabit(habitId, {
      archived: !habit.archived
    });
  };
  const CustomTooltip = ({
    active,
    payload,
    label






  }: {active?: boolean;payload?: {value: number;}[];label?: string;}) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#12121f] border border-[#1e1e2e] rounded px-2 py-1.5">
          <p className="text-[10px] font-mono text-[#64748b]">{label}</p>
          <p
            className="text-xs font-mono font-bold"
            style={{
              color: accent.primary
            }}>

            {payload[0].value}%
          </p>
        </div>);

    }
    return null;
  };
  return (
    <div className="min-h-screen bg-[#080810] pt-14">
      {/* Header */}
      <div className="border-b border-[#1e1e2e] bg-[#080810] px-4 py-4 sticky top-14 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="text-[#64748b] hover:text-white transition-colors p-1 -ml-1">

            <ArrowLeftIcon size={16} />
          </button>
          <span className="text-xl">{habit.icon}</span>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-white truncate">
              {habit.name}
            </h1>
            <p className="text-[11px] text-[#64748b] truncate">
              {habit.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleArchive}
              className={`p-1.5 rounded border transition-colors ${habit.archived ? 'border-orange-400/30 text-orange-400 bg-orange-400/10 hover:bg-orange-400/20' : 'border-[#1e1e2e] text-[#64748b] hover:text-white hover:border-[#2e2e3e]'}`}
              title={habit.archived ? 'Unarchive' : 'Archive'}>

              {habit.archived ?
              <ArchiveRestoreIcon size={13} /> :

              <ArchiveIcon size={13} />
              }
            </button>
            <button
              onClick={() => onNavigate('edit', habitId)}
              className="p-1.5 rounded border border-[#1e1e2e] text-[#64748b] hover:text-white hover:border-[#2e2e3e] transition-colors">

              <EditIcon size={13} />
            </button>
            <button
              onClick={() => toggleCompletion(habitId)}
              className={`px-3 py-1.5 rounded text-xs font-mono font-medium border transition-all duration-200 ${completedToday ? 'border-[#1e1e2e] text-[#64748b] bg-transparent' : 'text-[#080810] font-bold'}`}
              style={
              !completedToday ?
              {
                backgroundColor: accent.primary,
                borderColor: accent.primary,
                boxShadow: `0 0 16px ${accent.glow}`
              } :
              {}
              }>

              {completedToday ? '✓ Done' : 'Mark Done'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-lg p-3">
            <div className="flex items-center gap-1 mb-2">
              <FlameIcon size={10} className="text-orange-400" />
              <span className="text-[9px] font-mono text-[#64748b] uppercase tracking-wider">
                Streak
              </span>
            </div>
            <div className="text-xl font-mono font-bold text-orange-400">
              {stats.currentStreak}
            </div>
            <div className="text-[9px] font-mono text-[#64748b]">days</div>
          </div>
          <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-lg p-3">
            <div className="flex items-center gap-1 mb-2">
              <TargetIcon
                size={10}
                style={{
                  color: accent.primary
                }} />

              <span className="text-[9px] font-mono text-[#64748b] uppercase tracking-wider">
                Best
              </span>
            </div>
            <div
              className="text-xl font-mono font-bold"
              style={{
                color: accent.primary
              }}>

              {stats.longestStreak}
            </div>
            <div className="text-[9px] font-mono text-[#64748b]">days</div>
          </div>
          <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-lg p-3">
            <div className="flex items-center gap-1 mb-2">
              <TrendingUpIcon size={10} className="text-[#00ff88]" />
              <span className="text-[9px] font-mono text-[#64748b] uppercase tracking-wider">
                Rate
              </span>
            </div>
            <div className="text-xl font-mono font-bold text-[#00ff88]">
              {stats.completionRate}%
            </div>
            <div className="text-[9px] font-mono text-[#64748b]">30 days</div>
          </div>
          <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-lg p-3">
            <div className="flex items-center gap-1 mb-2">
              <CalendarIcon size={10} className="text-[#64748b]" />
              <span className="text-[9px] font-mono text-[#64748b] uppercase tracking-wider">
                Total
              </span>
            </div>
            <div className="text-xl font-mono font-bold text-white">
              {stats.completedDays}
            </div>
            <div className="text-[9px] font-mono text-[#64748b]">days</div>
          </div>
        </div>

        {/* Completion ring + progress */}
        <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-lg p-4 flex items-center gap-4">
          <CompletionRing
            percentage={stats.completionRate}
            size={72}
            strokeWidth={5}
            color={habit.color}
            showText={true} />

          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-[#64748b]">
                Target streak
              </span>
              <span
                className="text-xs font-mono"
                style={{
                  color: accent.primary
                }}>

                {stats.currentStreak}/{habit.targetStreak}d
              </span>
            </div>
            <div className="h-1.5 bg-[#1e1e2e] rounded-full overflow-hidden mb-3">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, stats.currentStreak / habit.targetStreak * 100)}%`,
                  backgroundColor: accent.primary,
                  boxShadow: `0 0 8px ${accent.glow}`
                }} />

            </div>
            <div className="flex gap-2">
              {habit.tags.map((tag) =>
              <span
                key={tag}
                className="text-[10px] font-mono px-2 py-0.5 rounded border"
                style={{
                  color: accent.primary,
                  borderColor: accent.glow,
                  backgroundColor: accent.dim
                }}>

                  #{tag}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Heatmap */}
        <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-mono text-[#64748b] uppercase tracking-wider">
              Activity — 26 weeks
            </h2>
            <span className="text-[10px] font-mono text-[#64748b]">
              {stats.completedDays} completions
            </span>
          </div>
          <div className="overflow-x-auto">
            <HeatmapGrid
              completions={habit.completions}
              color={habit.color}
              weeks={26} />

          </div>
        </div>

        {/* Trend chart */}
        <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-lg p-4">
          <h2 className="text-xs font-mono text-[#64748b] uppercase tracking-wider mb-4">
            Monthly completion rate
          </h2>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart
              data={stats.monthlyData}
              margin={{
                top: 4,
                right: 4,
                bottom: 0,
                left: -20
              }}>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e1e2e"
                vertical={false} />

              <XAxis
                dataKey="month"
                tick={{
                  fill: '#64748b',
                  fontSize: 10,
                  fontFamily: 'JetBrains Mono'
                }}
                axisLine={false}
                tickLine={false} />

              <YAxis
                tick={{
                  fill: '#64748b',
                  fontSize: 10,
                  fontFamily: 'JetBrains Mono'
                }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`} />

              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="rate"
                stroke={accent.primary}
                strokeWidth={2}
                dot={{
                  fill: accent.primary,
                  r: 3,
                  strokeWidth: 0
                }}
                activeDot={{
                  r: 5,
                  fill: accent.primary,
                  style: {
                    filter: `drop-shadow(0 0 6px ${accent.glow})`
                  }
                }}
                style={{
                  filter: `drop-shadow(0 0 4px ${accent.glow})`
                }} />

            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly bars */}
        <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-lg p-4">
          <h2 className="text-xs font-mono text-[#64748b] uppercase tracking-wider mb-3">
            Weekly completions
          </h2>
          <div className="flex items-end gap-1 h-16">
            {stats.weeklyData.map((w, i) =>
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                className="w-full rounded-sm transition-all"
                style={{
                  height: `${w.count / 7 * 100}%`,
                  minHeight: 2,
                  backgroundColor: accent.primary,
                  opacity: 0.4 + i / stats.weeklyData.length * 0.6,
                  boxShadow:
                  i === stats.weeklyData.length - 1 ?
                  `0 0 8px ${accent.glow}` :
                  'none'
                }} />

              </div>
            )}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] font-mono text-[#64748b]">12w ago</span>
            <span className="text-[9px] font-mono text-[#64748b]">
              this week
            </span>
          </div>
        </div>

        {/* Danger zone */}
        <div className="border border-[#1e1e2e] rounded-lg p-4">
          <h2 className="text-xs font-mono text-[#64748b] uppercase tracking-wider mb-3">
            Danger zone
          </h2>
          {!confirmDelete ?
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-2 text-xs font-mono text-red-400 hover:text-red-300 border border-red-400/20 hover:border-red-400/40 px-3 py-2 rounded transition-colors">

              <TrashIcon size={12} />
              Delete habit
            </button> :

          <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-[#64748b]">
                Are you sure?
              </span>
              <button
              onClick={handleDelete}
              className="text-xs font-mono text-red-400 border border-red-400/40 px-3 py-1.5 rounded hover:bg-red-400/10 transition-colors">

                Delete
              </button>
              <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs font-mono text-[#64748b] border border-[#1e1e2e] px-3 py-1.5 rounded hover:text-white transition-colors">

                Cancel
              </button>
            </div>
          }
        </div>
      </div>
    </div>);

}
