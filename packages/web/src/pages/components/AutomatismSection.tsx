import type { HabitColorTheme } from '@/lib/theme/habit-colors';

function getLevel(score: number, accentHex: string) {
  if (score >= 85) {
    return { label: 'Infallible', color: accentHex };
  }
  if (score >= 66) {
    return { label: 'Established', color: accentHex };
  }
  if (score >= 40) {
    return { label: 'Growing', color: 'var(--text-foreground)' };
  }
  return { label: 'Fragile', color: 'var(--text-muted)' };
}

function getAutomatismMessage(score: number): string {
  if (score >= 85) {
    return 'This habit runs on autopilot — your routine is locked in.';
  }
  if (score >= 66) {
    return 'Habit is established. Keep consistent to push it further.';
  }
  if (score >= 40) {
    return `${Math.max(1, 66 - Math.round(score * 0.66))} more active days to reach "automatic" state.`;
  }
  return 'Habit is still fragile. Daily repetition is critical right now.';
}

function getAutomatismColor(score: number): string {
  if (score >= 66) {
    return 'var(--accent)';
  }
  if (score >= 40) {
    return 'var(--accent-secondary)';
  }
  return 'var(--text-muted)';
}

export function AutomatismSection({ score, accent }: { score: number; accent: HabitColorTheme }) {
  const level = getLevel(score, accent.hex);
  const message = getAutomatismMessage(score);
  const color = getAutomatismColor(score);

  return (
    <div className="bg-bg-secondary border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-muted uppercase tracking-widest">Habit Strength</span>
          <span className="text-lg font-bold text-foreground">Automatism: {score}%</span>
        </div>
        <div
          className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border"
          style={{ borderColor: level.color, color: level.color }}
        >
          {level.label}
        </div>
      </div>
      <div className="h-2 bg-border rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-1000 ease-out"
          style={{
            width: `${score}%`,
            backgroundColor: accent.hex,
            boxShadow: `0 0 10px ${accent.glow}`
          }}
        />
      </div>
      <div className="mt-2 text-[10px] leading-relaxed font-mono" style={{ color }}>
        {message}
      </div>
    </div>
  );
}
