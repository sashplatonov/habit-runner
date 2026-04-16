import { describe, expect, it } from 'vitest';
import { Activity, Shield, Star, Zap } from 'lucide-svelte';
import { getHabitPhase, HABIT_PHASES, isPhaseTransition } from '../../src/lib/habits/phases';

describe('habit phases', () => {
  it('binds each phase to a defined lucide icon component', () => {
    expect(HABIT_PHASES.map((phase) => phase.icon)).toEqual([Shield, Zap, Activity, Star]);
  });

  it('returns the expected phase boundaries', () => {
    expect(getHabitPhase(1).id).toBe(1);
    expect(getHabitPhase(21).id).toBe(1);
    expect(getHabitPhase(22).id).toBe(2);
    expect(getHabitPhase(67).id).toBe(3);
    expect(getHabitPhase(100).id).toBe(4);
    expect(isPhaseTransition(21)).toBe(true);
    expect(isPhaseTransition(66)).toBe(true);
    expect(isPhaseTransition(100)).toBe(true);
    expect(isPhaseTransition(42)).toBe(false);
  });
});