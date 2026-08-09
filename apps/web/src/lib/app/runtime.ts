import { getContext, setContext } from 'svelte';
import { resolve as kitResolve } from '$app/paths';
import type { HabitsStore } from '$lib/stores/habits';
import type { ThemeId } from '$lib/theme/themes';

const APP_RUNTIME_KEY = Symbol('habbit-runner-app-runtime');

export type AppRuntime = {
  habitsStore: HabitsStore;
  routeBase: '/app/(protected)' | '/showcase';
  theme: ThemeId;
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
      return resolver(normalizedPath, params);
    }
  };
}

export function provideAppRuntime(runtime: AppRuntime): void {
  setContext(APP_RUNTIME_KEY, runtime);
}

export function getAppRuntime(): AppRuntime {
  const runtime = getContext<AppRuntime | undefined>(APP_RUNTIME_KEY);
  if (!runtime) {
    throw new Error('App runtime is not available. Render this screen inside an app layout.');
  }
  return runtime;
}
