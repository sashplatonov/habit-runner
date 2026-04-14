import { Activity, CheckCircle2, Sparkles } from 'lucide-svelte';
import type { HabitColor, HabitFrequency } from '@habbit-runner/shared';

export type OnboardingTemplate = {
  name: string;
  description: string;
  icon: string;
  color: HabitColor;
  tags: string[];
  frequency: HabitFrequency;
  customDays?: number[];
  targetStreak: number;
};

export type OnboardingStep = {
  title: string;
  description: string;
  icon: typeof Sparkles;
};

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: 'Pick a habit',
    description: 'Start with one goal or choose a ready-made template.',
    icon: Sparkles
  },
  {
    title: 'Track your streak',
    description: 'Tap the completion button every day to stay on track.',
    icon: Activity
  },
  {
    title: 'Celebrate wins',
    description: 'Watch your streak and habits light up the dashboard.',
    icon: CheckCircle2
  }
];

export const ONBOARDING_TEMPLATES: OnboardingTemplate[] = [
  {
    name: 'Morning stretch',
    description: 'Five minutes of gentle stretching to wake up the body.',
    icon: '🧘',
    color: 'purple',
    tags: ['wellness', 'movement'],
    frequency: 'daily',
    targetStreak: 14
  },
  {
    name: 'Hydration boost',
    description: 'Drink a glass of water in the morning and evening.',
    icon: '💧',
    color: 'cyan',
    tags: ['health', 'hydration'],
    frequency: 'daily',
    targetStreak: 21
  },
  {
    name: 'Focus sprint',
    description: 'Do 60 minutes of deep work on weekdays.',
    icon: '💻',
    color: 'blue',
    tags: ['focus', 'productivity'],
    frequency: 'weekdays',
    customDays: [1, 2, 3, 4, 5],
    targetStreak: 10
  }
];
