import type {
  LucideIcon
} from 'lucide-react';
import {
  ActivityIcon,
  CheckCircle2Icon,
  SparklesIcon,
  PlusCircleIcon
} from 'lucide-react';
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

type Step = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const STEPS: Step[] = [
  {
    title: 'Pick a habit',
    description: 'Start with one goal or choose a ready-made template.',
    icon: SparklesIcon
  },
  {
    title: 'Track your streak',
    description: 'Tap the completion button every day to stay on track.',
    icon: ActivityIcon
  },
  {
    title: 'Celebrate wins',
    description: 'Watch your streak and habits light up the dashboard.',
    icon: CheckCircle2Icon
  }
];

const TEMPLATES: OnboardingTemplate[] = [
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

interface OnboardingProps {
  onCreateCustom: () => void;
  onTemplateSelect: (template: OnboardingTemplate) => Promise<void>;
  activeTemplate?: string | null;
}

export function Onboarding({
  onCreateCustom,
  onTemplateSelect,
  activeTemplate
}: OnboardingProps) {
  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-4 sm:px-6 py-12">
      <div className="w-full max-w-4xl space-y-8">
        <div className="space-y-3 text-center">
          <SparklesIcon className="mx-auto text-accent" size={32} />
          <h1 className="text-3xl font-semibold text-foreground">Habbit Runner is ready</h1>
          <p className="text-sm text-muted">
            Research shows starting with <span className="text-accent font-bold">3 habits</span> is optimal for success. 
            Choose templates that fit your routine.
          </p>
          <button
            type="button"
            onClick={onCreateCustom}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-widest text-accent transition hover:border-accent-secondary/50"
          >
            <PlusCircleIcon size={16} /> Create custom habit
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.title} className="rounded-2xl border border-border bg-bg-secondary p-4 text-center">
              <step.icon className="mx-auto mb-2 text-accent" size={22} />
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">{step.title}</p>
              <p className="mt-2 text-sm text-foreground">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-border bg-gradient-to-br from-bg-secondary/80 via-bg-secondary to-bg-primary/90 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-mono uppercase text-muted tracking-widest">Templates</p>
              <h2 className="text-xl font-semibold text-foreground">Start with one of these</h2>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted">P2.16</span>
          </div>
          <div className="mt-4 space-y-4">
            {TEMPLATES.map((template) => {
              const isActive = activeTemplate === template.name;
              return (
                <div
                  key={template.name}
                  className="flex flex-col gap-2 rounded-2xl border border-border bg-bg-primary/80 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                      <span>{template.icon}</span>
                      <span>{template.name}</span>
                    </div>
                    <p className="text-xs text-muted">{template.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1 text-[10px] uppercase tracking-[0.3em] text-muted">
                      {template.tags.map((tag) => (
                        <span key={tag} className="rounded-full border border-border px-2 py-0.5">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isActive}
                    onClick={() => onTemplateSelect(template)}
                    className={`flex items-center justify-center gap-1 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-widest transition ${isActive ? 'border-accent/70 bg-accent/10 text-accent/80' : 'border-border bg-bg-secondary text-foreground hover:border-accent-secondary/40'}`}
                  >
                    {isActive ? (
                      <span>Adding...</span>
                    ) : (
                      <>
                        <PlusCircleIcon size={12} /> Add
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
