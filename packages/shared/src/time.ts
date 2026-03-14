export function toSyncISO(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  }
  return d.toISOString().replace(/\.\d+Z$/, 'Z');
}

export function nowSyncISO(): string {
  return toSyncISO(new Date());
}
