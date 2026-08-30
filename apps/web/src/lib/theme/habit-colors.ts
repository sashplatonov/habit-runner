import type { HabitColor } from '@/types/habit';

export interface HabitColorTheme {
  hex: string;
  glow: string;
  dim: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
  shadowClass: string;
  heatmapLevels: [string, string, string, string, string];
}

export const HABIT_COLOR_THEMES: Record<HabitColor, HabitColorTheme> = {
  blue: {
    hex: '#00d4ff',
    glow: 'rgba(0,212,255,0.5)',
    dim: 'rgba(0,212,255,0.1)',
    textClass: 'text-[#00d4ff]',
    bgClass: 'bg-[#00d4ff]/10',
    borderClass: 'border-[#00d4ff]/30',
    shadowClass: 'shadow-[0_0_12px_rgba(0,212,255,0.2)]',
    heatmapLevels: ['#0d1117', '#0d2d3d', '#0a4a6e', '#006b9f', '#00d4ff']
  },
  green: {
    hex: '#00ff88',
    glow: 'rgba(0,255,136,0.5)',
    dim: 'rgba(0,255,136,0.1)',
    textClass: 'text-[#00ff88]',
    bgClass: 'bg-[#00ff88]/10',
    borderClass: 'border-[#00ff88]/30',
    shadowClass: 'shadow-[0_0_12px_rgba(0,255,136,0.2)]',
    heatmapLevels: ['#0d1117', '#0d2d1a', '#0a4a28', '#007a3d', '#00ff88']
  },
  purple: {
    hex: '#a855f7',
    glow: 'rgba(168,85,247,0.5)',
    dim: 'rgba(168,85,247,0.1)',
    textClass: 'text-purple-400',
    bgClass: 'bg-purple-400/10',
    borderClass: 'border-purple-400/30',
    shadowClass: 'shadow-[0_0_12px_rgba(168,85,247,0.2)]',
    heatmapLevels: ['#0d1117', '#1a0d2e', '#2d0a4a', '#5b1a8f', '#a855f7']
  },
  orange: {
    hex: '#f97316',
    glow: 'rgba(249,115,22,0.5)',
    dim: 'rgba(249,115,22,0.1)',
    textClass: 'text-orange-400',
    bgClass: 'bg-orange-400/10',
    borderClass: 'border-orange-400/30',
    shadowClass: 'shadow-[0_0_12px_rgba(249,115,22,0.2)]',
    heatmapLevels: ['#0d1117', '#2d1a0d', '#4a2a0a', '#8f4a1a', '#f97316']
  },
  red: {
    hex: '#ef4444',
    glow: 'rgba(239,68,68,0.5)',
    dim: 'rgba(239,68,68,0.1)',
    textClass: 'text-red-400',
    bgClass: 'bg-red-400/10',
    borderClass: 'border-red-400/30',
    shadowClass: 'shadow-[0_0_12px_rgba(239,68,68,0.2)]',
    heatmapLevels: ['#0d1117', '#2d0d0d', '#4a0a0a', '#8f1a1a', '#ef4444']
  },
  cyan: {
    hex: '#22d3ee',
    glow: 'rgba(34,211,238,0.5)',
    dim: 'rgba(34,211,238,0.1)',
    textClass: 'text-cyan-400',
    bgClass: 'bg-cyan-400/10',
    borderClass: 'border-cyan-400/30',
    shadowClass: 'shadow-[0_0_12px_rgba(34,211,238,0.2)]',
    heatmapLevels: ['#0d1117', '#0d2a2d', '#0a3d4a', '#0a6b7a', '#22d3ee']
  },
  pink: {
    hex: '#ec4899',
    glow: 'rgba(236,72,153,0.5)',
    dim: 'rgba(236,72,153,0.1)',
    textClass: 'text-pink-400',
    bgClass: 'bg-pink-400/10',
    borderClass: 'border-pink-400/30',
    shadowClass: 'shadow-[0_0_12px_rgba(236,72,153,0.2)]',
    heatmapLevels: ['#0d1117', '#2d0d1a', '#4a0a2a', '#8f1a4a', '#ec4899']
  },
  mint: {
    hex: '#5eead4',
    glow: 'rgba(94,234,212,0.5)',
    dim: 'rgba(94,234,212,0.1)',
    textClass: 'text-teal-300',
    bgClass: 'bg-teal-300/10',
    borderClass: 'border-teal-300/30',
    shadowClass: 'shadow-[0_0_12px_rgba(94,234,212,0.2)]',
    heatmapLevels: ['#0d1117', '#0d2d24', '#0a4a38', '#0a7a5c', '#5eead4']
  }
};

export const DEFAULT_HABIT_COLOR: HabitColor = 'blue';
