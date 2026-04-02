export function getInvestmentColor(percent: number): string {
  if (percent >= 70) {
    return 'var(--accent)';
  }
  if (percent >= 40) {
    return 'var(--accent-secondary)';
  }
  return 'var(--text-muted)';
}

export function getInvestmentMessage(percent: number, worstDay: string): string {
  if (percent >= 80) {
    return `Active ${percent}% of days — excellent consistency!`;
  }
  if (percent >= 60) {
    return `Active ${percent}% of days. Try filling the gaps on ${worstDay !== 'N/A' ? worstDay : 'your slow days'}.`;
  }
  if (percent >= 30) {
    return `Active ${percent}% of days — build a daily routine to improve this.`;
  }
  return `Only ${percent}% active. Start with completing just one habit per day.`;
}

