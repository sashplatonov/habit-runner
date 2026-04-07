/** Pure helpers for automatism / habit-strength display */

export type AutomatismLevel = 'infallible' | 'established' | 'growing' | 'fragile';

export function getAutomatismLevel(score: number): AutomatismLevel {
  if (score >= 85) return 'infallible';
  if (score >= 66) return 'established';
  if (score >= 40) return 'growing';
  return 'fragile';
}

export function getAutomatismMessage(level: AutomatismLevel): string {
  switch (level) {
    case 'infallible':
      return 'Autopilot';
    case 'established':
      return 'Established';
    case 'growing':
      return 'Growing';
    case 'fragile':
      return 'Fragile';
  }
}

export function getAutomatismColor(level: AutomatismLevel): string {
  switch (level) {
    case 'infallible':
    case 'established':
      return 'var(--accent)';
    case 'growing':
      return 'var(--accent-secondary)';
    case 'fragile':
      return 'var(--text-muted)';
  }
}

export function getAutomatismLevelDetailed(score: number, accentHex: string) {
  if (score >= 85) return { label: 'Infallible', color: accentHex };
  if (score >= 66) return { label: 'Established', color: accentHex };
  if (score >= 40) return { label: 'Growing', color: 'var(--text-foreground)' };
  return { label: 'Fragile', color: 'var(--text-muted)' };
}

export function getAutomatismMessageDetailed(score: number): string {
  if (score >= 85) return 'This habit runs on autopilot — your routine is locked in.';
  if (score >= 66) return 'Habit is established. Keep consistent to push it further.';
  if (score >= 40) return `${Math.max(1, 66 - Math.round(score * 0.66))} more active days to reach "automatic" state.`;
  return 'Habit is still fragile. Daily repetition is critical right now.';
}

export function getAutomatismColorDetailed(score: number): string {
  if (score >= 66) return 'var(--accent)';
  if (score >= 40) return 'var(--accent-secondary)';
  return 'var(--text-muted)';
}
