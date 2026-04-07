export function getInvestmentColor(percent: number): string {
  if (percent >= 80) return 'var(--accent)';
  if (percent >= 50) return 'var(--accent-secondary)';
  return 'var(--text-muted)';
}

export function getInvestmentMessage(percent: number, worstDay: string): string {
  if (percent >= 80) return 'Outstanding commitment — keep this pace.';
  if (percent >= 50) return `Good momentum. Try to cover ${worstDay} more consistently.`;
  if (percent >= 20) return 'Room to grow — aim for one more active day each week.';
  return 'Just getting started. Focus on one habit to build the base.';
}
