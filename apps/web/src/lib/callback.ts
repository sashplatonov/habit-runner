export function invokeIfFunction<TArgs extends unknown[]>(value: unknown, ...args: TArgs): void {
  if (typeof value === 'function') {
    (value as (...innerArgs: TArgs) => void)(...args);
  }
}
