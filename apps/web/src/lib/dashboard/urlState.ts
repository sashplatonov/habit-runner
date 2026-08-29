/* eslint-disable complexity */
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import type { PathnameWithSearchOrHash } from '$app/types';

type DashboardUrlState = {
  filter?: string;
  search?: string;
  tags?: string;
  sort?: string;
  density?: string;
  collapsed?: string;
};

export function readDashboardStateFromURL(): Partial<DashboardUrlState> {
  if (!browser) { return {}; }

  const params = new URLSearchParams(window.location.search);
  const state: Partial<DashboardUrlState> = {};

  if (params.has('filter')) { state.filter = params.get('filter') ?? undefined; }
  if (params.has('search')) { state.search = params.get('search') ?? undefined; }
  if (params.has('tags')) { state.tags = params.get('tags') ?? undefined; }
  if (params.has('sort')) { state.sort = params.get('sort') ?? undefined; }
  if (params.has('density')) { state.density = params.get('density') ?? undefined; }
  if (params.has('collapsed')) { state.collapsed = params.get('collapsed') ?? undefined; }

  return state;
}

export function updateDashboardURL(state: Partial<DashboardUrlState>) {
  if (!browser) { return; }

  const url = new URL(window.location.href);
  const params = url.searchParams;

  // Update or remove each param
  if (state.filter !== undefined) {
    if (state.filter && state.filter !== 'pending') {
      params.set('filter', state.filter);
    } else {
      params.delete('filter');
    }
  }

  if (state.search !== undefined) {
    if (state.search) {
      params.set('search', state.search);
    } else {
      params.delete('search');
    }
  }

  if (state.tags !== undefined) {
    if (state.tags) {
      params.set('tags', state.tags);
    } else {
      params.delete('tags');
    }
  }

  if (state.sort !== undefined) {
    if (state.sort && state.sort !== 'custom') {
      params.set('sort', state.sort);
    } else {
      params.delete('sort');
    }
  }

  if (state.density !== undefined) {
    if (state.density && state.density !== 'comfortable') {
      params.set('density', state.density);
    } else {
      params.delete('density');
    }
  }

  if (state.collapsed !== undefined) {
    if (state.collapsed === 'true') {
      params.set('collapsed', 'true');
    } else {
      params.delete('collapsed');
    }
  }

  // Update URL without full reload
  const queryString = params.toString();
  const newUrl = url.pathname + (queryString ? '?' + queryString : '') + url.hash;
  if (newUrl !== window.location.pathname + window.location.search + window.location.hash) {
    void goto(resolve(newUrl as PathnameWithSearchOrHash, {} as never), { replaceState: true, keepFocus: true, noScroll: true });
  }
}

export function parseTagsFromURL(tagsParam: string | undefined): string[] {
  if (!tagsParam) {return [];}
  return tagsParam.split(',').map(t => t.trim()).filter(Boolean);
}

export function stringifyTagsForURL(tags: string[]): string {
  return tags.join(',');
}
