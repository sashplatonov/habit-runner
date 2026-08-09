import { getContext, setContext } from 'svelte';
import { resolve as kitResolve } from '$app/paths';
import type { HabitsStore } from '$lib/stores/habits';

const APP_RUNTIME_KEY = Symbol('habbit-runner-app-runtime');

export type AppRuntime = {
  habitsStore: HabitsStore;
  routeBase: '/app/(protected)' | '/showcase';
  resolve: <Path extends string>(path: Path, params: Record<string, string>) => string;
  isDemo: boolean;
};

export function createAppRuntime(input: Omit<AppRuntime, 'resolve'>): AppRuntime {
  return {
    ...input,
    resolve<Path extends string>(path: Path, params: Record<string, string>) {
      const normalizedPath = input.routeBase === '/showcase'
        ? path.replace('/app/(protected)', '/showcase')
        : path;
      const resolver = kitResolve as unknown as (route: string, routeParams?: Record<string, string>) => string;
      const resolvedPath = resolver(normalizedPath, params);
      return input.routeBase === '/showcase'
        ? resolvedPath.replace(/^(?:\.\.\/|\.\/)+/, '/')
        : resolvedPath;
    }
  };
}

export function provideAppRuntime(runtime: AppRuntime | (() => AppRuntime)): void {
  setContext(APP_RUNTIME_KEY, runtime);
}

export function getAppRuntime(): AppRuntime {
  const providedRuntime = getContext<AppRuntime | (() => AppRuntime) | undefined>(APP_RUNTIME_KEY);
  const runtime = typeof providedRuntime === 'function' ? providedRuntime() : providedRuntime;
  if (!runtime) {
    throw new Error('App runtime is not available. Render this screen inside an app layout.');
  }
  return runtime;
}
