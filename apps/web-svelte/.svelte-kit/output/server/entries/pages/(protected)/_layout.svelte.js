import { s as sanitize_props, a as spread_props, b as slot, c as attr_class, d as stringify, e as attr_style, f as escape_html, g as derived, h as attr, u as unsubscribe_stores, i as store_get } from "../../../chunks/root.js";
import { T as THEMES, o as onDestroy, t as themeStore } from "../../../chunks/themeStore.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../chunks/state.svelte.js";
import { s as sessionStore } from "../../../chunks/sessionStore.js";
import { w as writable } from "../../../chunks/index.js";
import { e as ensureSyncMeta, u as updateSyncMeta, c as countPendingOutboxEntries, g as getReadyOutboxEntries, m as markOutboxEntriesInflight, d as deleteOutboxEntries, a as updateOutboxEntryFailure, s as setCurrentUserId, b as clearCurrentUserTimeZone } from "../../../chunks/db.js";
import { p as pullChanges, a as applyPullResponse, b as pushChanges, g as getBackoffMs } from "../../../chunks/sync.js";
import { u as undoStore } from "../../../chunks/undoStore.js";
import { c as clearAuthSession, A as API_BASE_URL } from "../../../chunks/session.js";
import "clsx";
import { p as page } from "../../../chunks/stores.js";
import { P as Plus } from "../../../chunks/plus.js";
import { I as Icon } from "../../../chunks/Icon.js";
const CLIENT_LOG_STORAGE_KEY = "habbit-runner:client-logs";
const MAX_STORED_LOGS = 100;
function write(level, payload) {
  const logEntry = {
    ...payload,
    level,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new CustomEvent("app-client-log", { detail: logEntry }));
  try {
    const existing = window.localStorage.getItem(CLIENT_LOG_STORAGE_KEY);
    const logs = existing ? JSON.parse(existing) : [];
    const next = [...logs, logEntry].slice(-MAX_STORED_LOGS);
    window.localStorage.setItem(CLIENT_LOG_STORAGE_KEY, JSON.stringify(next));
  } catch {
  }
}
function logClientInfo(event, message, context) {
  write("info", { event, message, context });
}
function logClientError(event, message, context) {
  write("error", { event, message, context });
}
let activeSyncRun = null;
let shouldRerunAfterActiveSync = false;
async function pushPendingOutbox() {
  const entries = await getReadyOutboxEntries(32);
  if (entries.length === 0) {
    return {
      applied: 0,
      conflicts: 0,
      serverTime: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  await markOutboxEntriesInflight(entries.map((entry) => entry.id));
  const response = await pushChanges(entries);
  await deleteOutboxEntries(response.applied);
  const appliedSet = new Set(response.applied);
  await Promise.all(
    entries.map(async (entry) => {
      if (appliedSet.has(entry.id)) {
        return;
      }
      const conflict = response.conflicts.find((c) => c.opId === entry.id);
      const reason = conflict?.reason ?? "push rejected";
      const nextRetry = new Date(
        Date.now() + getBackoffMs(entry.retryCount + 1)
      ).toISOString();
      await updateOutboxEntryFailure(entry, reason, nextRetry);
    })
  );
  return {
    applied: response.applied.length,
    conflicts: response.conflicts.length,
    serverTime: response.serverTime
  };
}
async function runSyncCycleOnce() {
  const meta = await ensureSyncMeta();
  const result = {
    status: "syncing",
    pending: 0,
    conflicts: 0
  };
  try {
    const firstPull = await pullChanges(meta.lastCursor);
    await applyPullResponse(firstPull);
    const cursorAfterPull = firstPull.nextCursor ?? meta.lastCursor ?? firstPull.serverTime;
    await updateSyncMeta({
      lastCursor: cursorAfterPull,
      lastSyncedAt: firstPull.serverTime,
      status: "syncing",
      lastError: void 0
    });
    const pushResult = await pushPendingOutbox();
    result.conflicts = pushResult.conflicts;
    result.pending = await countPendingOutboxEntries();
    await updateSyncMeta({
      lastSyncedAt: pushResult.serverTime
    });
    const secondPull = await pullChanges(cursorAfterPull);
    await applyPullResponse(secondPull);
    const nextCursor = secondPull.nextCursor ?? cursorAfterPull;
    await updateSyncMeta({
      lastCursor: nextCursor,
      lastSyncedAt: secondPull.serverTime,
      status: "idle",
      lastError: void 0
    });
    result.status = "idle";
    result.lastCursor = nextCursor;
    result.lastSyncedAt = secondPull.serverTime;
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = !navigator.onLine ? "offline" : "error";
    await updateSyncMeta({
      status,
      lastError: message
    });
    const pending = await countPendingOutboxEntries();
    return {
      status,
      pending,
      conflicts: 0,
      lastError: message
    };
  }
}
async function runSyncCycle() {
  if (activeSyncRun) {
    shouldRerunAfterActiveSync = true;
    return activeSyncRun;
  }
  activeSyncRun = runSyncCycleOnce().finally(() => {
    activeSyncRun = null;
    if (!shouldRerunAfterActiveSync) {
      return;
    }
    shouldRerunAfterActiveSync = false;
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        void runSyncCycle();
      }, 0);
    }
  });
  return activeSyncRun;
}
function createSyncStatusStore() {
  const state = writable({
    status: "idle",
    pending: 0,
    conflicts: 0
  });
  let running = false;
  let interval = null;
  let enabled = false;
  async function syncNow() {
    if (!enabled) {
      logClientInfo("sync.skipped", "Sync skipped because user is not authenticated");
      state.update((prev) => ({
        ...prev,
        status: "offline",
        lastError: "authentication required"
      }));
      return;
    }
    if (running) return;
    running = true;
    state.update((prev) => ({
      ...prev,
      status: typeof navigator !== "undefined" && navigator.onLine ? "syncing" : "offline"
    }));
    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        state.update((prev) => ({ ...prev, status: "offline" }));
        return;
      }
      const result = await runSyncCycle();
      state.set(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status = typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error";
      logClientError("sync.cycle_failed", message, { status });
      state.update((prev) => ({
        ...prev,
        status,
        lastError: message
      }));
    } finally {
      running = false;
    }
  }
  function start() {
    enabled = true;
    syncNow();
    interval = setInterval(syncNow, 3e4);
    const handleOnline = () => syncNow();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        syncNow();
      }
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("visibilitychange", handleVisibility);
    return () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("visibilitychange", handleVisibility);
      enabled = false;
    };
  }
  function stop() {
    enabled = false;
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  }
  return {
    subscribe: state.subscribe,
    syncNow,
    start,
    stop
  };
}
const syncStatusStore = createSyncStatusStore();
function Chart_no_axes_column($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.468.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    ["line", { "x1": "18", "x2": "18", "y1": "20", "y2": "10" }],
    ["line", { "x1": "12", "x2": "12", "y1": "20", "y2": "4" }],
    ["line", { "x1": "6", "x2": "6", "y1": "20", "y2": "14" }]
  ];
  Icon($$renderer, spread_props([
    { name: "chart-no-axes-column" },
    $$sanitized_props,
    {
      /**
       * @component @name ChartNoAxesColumn
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8bGluZSB4MT0iMTgiIHgyPSIxOCIgeTE9IjIwIiB5Mj0iMTAiIC8+CiAgPGxpbmUgeDE9IjEyIiB4Mj0iMTIiIHkxPSIyMCIgeTI9IjQiIC8+CiAgPGxpbmUgeDE9IjYiIHgyPSI2IiB5MT0iMjAiIHkyPSIxNCIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/chart-no-axes-column
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Layout_dashboard($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.468.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    [
      "rect",
      { "width": "7", "height": "9", "x": "3", "y": "3", "rx": "1" }
    ],
    [
      "rect",
      { "width": "7", "height": "5", "x": "14", "y": "3", "rx": "1" }
    ],
    [
      "rect",
      { "width": "7", "height": "9", "x": "14", "y": "12", "rx": "1" }
    ],
    [
      "rect",
      { "width": "7", "height": "5", "x": "3", "y": "16", "rx": "1" }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "layout-dashboard" },
    $$sanitized_props,
    {
      /**
       * @component @name LayoutDashboard
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cmVjdCB3aWR0aD0iNyIgaGVpZ2h0PSI5IiB4PSIzIiB5PSIzIiByeD0iMSIgLz4KICA8cmVjdCB3aWR0aD0iNyIgaGVpZ2h0PSI1IiB4PSIxNCIgeT0iMyIgcng9IjEiIC8+CiAgPHJlY3Qgd2lkdGg9IjciIGhlaWdodD0iOSIgeD0iMTQiIHk9IjEyIiByeD0iMSIgLz4KICA8cmVjdCB3aWR0aD0iNyIgaGVpZ2h0PSI1IiB4PSIzIiB5PSIxNiIgcng9IjEiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/layout-dashboard
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Log_out($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.468.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    ["path", { "d": "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" }],
    ["polyline", { "points": "16 17 21 12 16 7" }],
    ["line", { "x1": "21", "x2": "9", "y1": "12", "y2": "12" }]
  ];
  Icon($$renderer, spread_props([
    { name: "log-out" },
    $$sanitized_props,
    {
      /**
       * @component @name LogOut
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNOSAyMUg1YTIgMiAwIDAgMS0yLTJWNWEyIDIgMCAwIDEgMi0yaDQiIC8+CiAgPHBvbHlsaW5lIHBvaW50cz0iMTYgMTcgMjEgMTIgMTYgNyIgLz4KICA8bGluZSB4MT0iMjEiIHgyPSI5IiB5MT0iMTIiIHkyPSIxMiIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/log-out
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Palette($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.468.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    [
      "circle",
      { "cx": "13.5", "cy": "6.5", "r": ".5", "fill": "currentColor" }
    ],
    [
      "circle",
      {
        "cx": "17.5",
        "cy": "10.5",
        "r": ".5",
        "fill": "currentColor"
      }
    ],
    [
      "circle",
      { "cx": "8.5", "cy": "7.5", "r": ".5", "fill": "currentColor" }
    ],
    [
      "circle",
      { "cx": "6.5", "cy": "12.5", "r": ".5", "fill": "currentColor" }
    ],
    [
      "path",
      {
        "d": "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"
      }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "palette" },
    $$sanitized_props,
    {
      /**
       * @component @name Palette
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSIxMy41IiBjeT0iNi41IiByPSIuNSIgZmlsbD0iY3VycmVudENvbG9yIiAvPgogIDxjaXJjbGUgY3g9IjE3LjUiIGN5PSIxMC41IiByPSIuNSIgZmlsbD0iY3VycmVudENvbG9yIiAvPgogIDxjaXJjbGUgY3g9IjguNSIgY3k9IjcuNSIgcj0iLjUiIGZpbGw9ImN1cnJlbnRDb2xvciIgLz4KICA8Y2lyY2xlIGN4PSI2LjUiIGN5PSIxMi41IiByPSIuNSIgZmlsbD0iY3VycmVudENvbG9yIiAvPgogIDxwYXRoIGQ9Ik0xMiAyQzYuNSAyIDIgNi41IDIgMTJzNC41IDEwIDEwIDEwYy45MjYgMCAxLjY0OC0uNzQ2IDEuNjQ4LTEuNjg4IDAtLjQzNy0uMTgtLjgzNS0uNDM3LTEuMTI1LS4yOS0uMjg5LS40MzgtLjY1Mi0uNDM4LTEuMTI1YTEuNjQgMS42NCAwIDAgMSAxLjY2OC0xLjY2OGgxLjk5NmMzLjA1MSAwIDUuNTU1LTIuNTAzIDUuNTU1LTUuNTU0QzIxLjk2NSA2LjAxMiAxNy40NjEgMiAxMiAyeiIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/palette
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Search($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.468.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    ["circle", { "cx": "11", "cy": "11", "r": "8" }],
    ["path", { "d": "m21 21-4.3-4.3" }]
  ];
  Icon($$renderer, spread_props([
    { name: "search" },
    $$sanitized_props,
    {
      /**
       * @component @name Search
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSIxMSIgY3k9IjExIiByPSI4IiAvPgogIDxwYXRoIGQ9Im0yMSAyMS00LjMtNC4zIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/search
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function SyncStatus($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { syncState } = $$props;
    const status = derived(() => syncState?.status ?? "idle");
    function statusColor(s) {
      switch (s) {
        case "syncing":
          return "bg-accent";
        case "error":
          return "bg-red-500";
        case "offline":
          return "bg-amber-500";
        default:
          return "bg-green-500";
      }
    }
    function getStatusLabel(s) {
      switch (s) {
        case "syncing":
          return "Syncing…";
        case "offline":
          return "Offline — changes queued";
        case "error":
          return "Sync error";
        default:
          return "Synced";
      }
    }
    const label = derived(() => getStatusLabel(status()));
    $$renderer2.push(`<div class="px-2 mb-3"><div class="flex items-center gap-2 min-w-0"><span aria-hidden="true"${attr_class(`inline-block h-2.5 w-2.5 rounded-full ${stringify(statusColor(status()))}`)}${attr_style(status() === "syncing" ? "box-shadow: 0 0 8px var(--glow)" : "")}></span> <div class="flex items-center gap-2 min-w-0"><div class="text-xs font-mono text-muted truncate">${escape_html(label())}</div></div> <div class="ml-auto flex items-center gap-2"><button type="button" class="text-[11px] font-mono text-muted hover:text-foreground px-2 py-1 rounded-md whitespace-nowrap" aria-label="Retry sync now">Retry</button></div></div> `);
    if (syncState?.lastError) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="mt-1 text-[11px] font-mono text-red-400">${escape_html(syncState.lastError)}</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="sr-only" aria-live="polite">${escape_html(label())}</div></div>`);
  });
}
function SidebarNav($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let { theme, onLogout, syncState } = $$props;
    let isThemeOpen = false;
    THEMES.filter((t) => t.group === "dark");
    THEMES.filter((t) => t.group === "light");
    function isActive(path) {
      return store_get($$store_subs ??= {}, "$page", page).url.pathname === path;
    }
    $$renderer2.push(`<aside class="hidden sm:flex fixed left-0 top-0 h-screen w-[220px] flex-col bg-bg-primary border-r border-border px-3 py-4 z-50" style="padding-top: calc(var(--safe-area-inset-top, 0px) + 1rem)" aria-label="Sidebar navigation"><a href="/dashboard" class="flex items-center gap-2.5 px-2 mb-5"><img src="/app-icon.svg" alt="Habbit Runner" class="w-8 h-8 rounded-lg flex-shrink-0 object-contain"/> <span class="text-sm font-bold tracking-tight">Habbit Runner</span></a> `);
    SyncStatus($$renderer2, { syncState });
    $$renderer2.push(`<!----> <a href="/habit/new" class="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-accent/10 border border-accent/30 text-accent text-sm font-semibold hover:bg-accent/20 hover:shadow-[0_0_16px_var(--glow)] transition-all duration-200 mb-4">`);
    Plus($$renderer2, { size: 16 });
    $$renderer2.push(`<!----> New Habit</a> <div class="text-[10px] font-mono text-muted uppercase tracking-[0.2em] px-2 mb-1">Navigate</div> <nav class="flex flex-col gap-0.5"><a href="/dashboard"${attr_class(`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${stringify(isActive("/dashboard") ? "bg-accent/10 text-accent" : "text-muted hover:text-foreground hover:bg-bg-secondary")}`)}>`);
    Layout_dashboard($$renderer2, { size: 16 });
    $$renderer2.push(`<!----> Dashboard</a> <a href="/stats"${attr_class(`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${stringify(isActive("/stats") ? "bg-accent-secondary/10 text-accent-secondary" : "text-muted hover:text-foreground hover:bg-bg-secondary")}`)}>`);
    Chart_no_axes_column($$renderer2, { size: 16 });
    $$renderer2.push(`<!----> Stats</a></nav> <div class="flex-1"></div> <div class="border-t border-border pt-3"><div class="text-[10px] font-mono text-muted uppercase tracking-[0.2em] px-2 mb-1">Appearance</div> <div class="relative"><button type="button"${attr_class(`flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${stringify("text-muted hover:text-foreground hover:bg-bg-secondary")}`)} aria-label="Choose color theme"${attr("aria-expanded", isThemeOpen)} aria-haspopup="listbox">`);
    Palette($$renderer2, { size: 16 });
    $$renderer2.push(`<!----> <span class="flex-1 text-left capitalize">${escape_html(theme)}</span> <span class="text-[10px] opacity-50">${escape_html("▼")}</span></button> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    if (onLogout) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<button type="button" class="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-muted hover:text-accent-secondary hover:bg-accent-secondary/10 transition-all duration-200 mt-0.5" aria-label="Log out">`);
      Log_out($$renderer2, { size: 16 });
      $$renderer2.push(`<!----> Logout</button>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div></aside>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
function BottomNav($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let isThemeOpen = false;
    THEMES.filter((t) => t.group === "dark");
    THEMES.filter((t) => t.group === "light");
    const isHome = derived(() => store_get($$store_subs ??= {}, "$page", page).url.pathname === "/dashboard");
    const isStats = derived(() => store_get($$store_subs ??= {}, "$page", page).url.pathname === "/stats");
    $$renderer2.push(`<nav class="flex sm:hidden fixed bottom-0 left-0 right-0 bg-bg-primary/95 border-t border-border backdrop-blur-sm z-50" style="height: calc(72px + env(safe-area-inset-bottom)); padding-bottom: env(safe-area-inset-bottom)" aria-label="Mobile navigation"><a href="/dashboard"${attr_class(`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${stringify(isHome() ? "text-accent" : "text-muted")}`)} aria-label="Dashboard"${attr("aria-current", isHome() ? "page" : void 0)}><div${attr_class(`w-8 h-8 flex items-center justify-center rounded-[10px] ${stringify(isHome() ? "bg-accent/10" : "")}`)}>`);
    Layout_dashboard($$renderer2, { size: 18 });
    $$renderer2.push(`<!----></div> <span class="text-[10px] font-medium">Dashboard</span></a> <a href="/stats"${attr_class(`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${stringify(isStats() ? "text-accent" : "text-muted")}`)} aria-label="Stats"${attr("aria-current", isStats() ? "page" : void 0)}><div${attr_class(`w-8 h-8 flex items-center justify-center rounded-[10px] ${stringify(isStats() ? "bg-accent/10" : "")}`)}>`);
    Chart_no_axes_column($$renderer2, { size: 18 });
    $$renderer2.push(`<!----></div> <span class="text-[10px] font-medium">Stats</span></a> <div class="flex-[0_0_72px] flex items-center justify-center"><a href="/habit/new" class="w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-bg-primary bg-accent" style="box-shadow: 0 0 20px var(--glow), 0 8px 16px rgba(0,0,0,0.4)" aria-label="New habit">`);
    Plus($$renderer2, { size: 24 });
    $$renderer2.push(`<!----></a></div> <button type="button" class="flex-1 flex flex-col items-center justify-center gap-1 text-muted hover:text-accent transition-colors" aria-label="Search habits"><div class="w-8 h-8 flex items-center justify-center rounded-[10px]">`);
    Search($$renderer2, { size: 18 });
    $$renderer2.push(`<!----></div> <span class="text-[10px] font-medium">Search</span></button> <div class="flex-1 flex flex-col items-center justify-center gap-1 relative"><button type="button"${attr_class(`flex flex-col items-center gap-1 ${stringify("text-muted")}`)} aria-label="Choose theme"${attr("aria-expanded", isThemeOpen)} aria-haspopup="listbox"><div${attr_class(`w-8 h-8 flex items-center justify-center rounded-[10px] ${stringify("")}`)}>`);
    Palette($$renderer2, { size: 18 });
    $$renderer2.push(`<!----></div> <span class="text-[10px] font-medium">Theme</span></button> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div></nav>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
function AppLayout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { theme, onLogout, syncState, children } = $$props;
    $$renderer2.push(`<div class="min-h-screen bg-bg-primary"><a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-accent focus:text-bg-primary focus:font-semibold focus:text-sm focus:shadow-lg">Skip to main content</a> `);
    SidebarNav($$renderer2, { theme, onLogout, syncState });
    $$renderer2.push(`<!----> <div class="sm:ml-[220px]"><main id="main-content" tabindex="-1" class="focus:outline-none sm:!pb-0" style="padding-top: var(--safe-area-inset-top, 0px); padding-bottom: calc(72px + var(--safe-area-inset-bottom, 0px))">`);
    children($$renderer2);
    $$renderer2.push(`<!----></main> <footer class="py-4 text-center"><span class="text-[11px] font-mono text-muted/30 select-none">${escape_html((/* @__PURE__ */ new Date("2026-04-07T14:17:52.481Z")).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short"
    }))}</span></footer></div> `);
    BottomNav($$renderer2);
    $$renderer2.push(`<!----></div>`);
  });
}
function PullToRefresh($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { children } = $$props;
    $$renderer2.push(`<div class="relative">`);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div${attr_style(`transform: translateY(${stringify(0)}px); transition: transform 0.2s ease-out`)}>`);
    children($$renderer2);
    $$renderer2.push(`<!----></div></div>`);
  });
}
function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let { children } = $$props;
    onDestroy(() => {
      syncStatusStore.stop();
    });
    async function logout() {
      const refreshToken = store_get($$store_subs ??= {}, "$sessionStore", sessionStore)?.refreshToken;
      clearAuthSession();
      setCurrentUserId();
      clearCurrentUserTimeZone();
      themeStore.resetToDefaults();
      sessionStore.set(null);
      if (refreshToken) {
        try {
          await fetch(`${API_BASE_URL}/auth/logout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken })
          });
        } catch {
        }
      }
    }
    if (store_get($$store_subs ??= {}, "$sessionStore", sessionStore)) {
      $$renderer2.push("<!--[0-->");
      PullToRefresh($$renderer2, {
        isRefreshing: store_get($$store_subs ??= {}, "$syncStatusStore", syncStatusStore).status === "syncing",
        children: ($$renderer3) => {
          $$renderer3.push(`<a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-md focus:border focus:border-accent focus:bg-bg-card focus:px-3 focus:py-2 focus:text-xs focus:text-foreground">Skip to main content</a> `);
          AppLayout($$renderer3, {
            syncState: store_get($$store_subs ??= {}, "$syncStatusStore", syncStatusStore),
            onLogout: logout,
            children: ($$renderer4) => {
              children($$renderer4);
              $$renderer4.push(`<!---->`);
            }
          });
          $$renderer3.push(`<!---->`);
        }
      });
      $$renderer2.push(`<!----> `);
      if (store_get($$store_subs ??= {}, "$undoStore", undoStore)) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl border border-border bg-bg-card/95 px-4 py-3 shadow-lg backdrop-blur-sm animate-slide-in-bottom"><span class="text-sm text-foreground">${escape_html(store_get($$store_subs ??= {}, "$undoStore", undoStore).message)}</span> <button class="text-sm font-semibold text-accent hover:text-accent-secondary transition-colors">${escape_html(store_get($$store_subs ??= {}, "$undoStore", undoStore).actionLabel ?? "Undo")}</button> <button class="text-muted hover:text-foreground transition-colors text-xs" aria-label="Dismiss">✕</button></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _layout as default
};
