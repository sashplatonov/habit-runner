import { browser } from '$app/environment';
export const ssr = false;
export function load() { return { browserRoute: browser }; }
