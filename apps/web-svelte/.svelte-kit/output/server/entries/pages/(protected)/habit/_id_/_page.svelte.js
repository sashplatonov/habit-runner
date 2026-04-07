import { s as sanitize_props, a as spread_props, b as slot, e as attr_style, d as stringify, k as ensure_array_like, f as escape_html, g as derived, h as attr, c as attr_class, i as store_get, u as unsubscribe_stores } from "../../../../../chunks/root.js";
import "@sveltejs/kit/internal";
import "../../../../../chunks/exports.js";
import "../../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../../chunks/state.svelte.js";
import { p as page } from "../../../../../chunks/stores.js";
import { H as HABIT_COLOR_THEMES, d as DEFAULT_HABIT_COLOR, D as DescriptionTooltip, A as Archive, S as Snowflake, F as Flame, T as Trending_up, c as Calendar, C as CompletionRing, e as getAutomatismLevelDetailed, f as getAutomatismMessageDetailed, h as getAutomatismColorDetailed } from "../../../../../chunks/automatism.js";
import { f as formatDate, d as getHabitStats, r as resolveHabitSchedule, b as isScheduledForDate, h as habitsStore } from "../../../../../chunks/habitsStore.js";
import { n as normalizeToCompletionKey, j as completionKeyToCalendarDate } from "../../../../../chunks/db.js";
import { C as ChartGuideTooltip, f as formatHabitLabel } from "../../../../../chunks/ChartGuideTooltip.js";
import "../../../../../chunks/undoStore.js";
import { T as TARGET_STREAK_TOOLTIP } from "../../../../../chunks/blockGuideTooltips.js";
import { A as Arrow_left } from "../../../../../chunks/arrow-left.js";
import { I as Icon } from "../../../../../chunks/Icon.js";
function Archive_restore($$renderer, $$props) {
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
      { "width": "20", "height": "5", "x": "2", "y": "3", "rx": "1" }
    ],
    ["path", { "d": "M4 8v11a2 2 0 0 0 2 2h2" }],
    ["path", { "d": "M20 8v11a2 2 0 0 1-2 2h-2" }],
    ["path", { "d": "m9 15 3-3 3 3" }],
    ["path", { "d": "M12 12v9" }]
  ];
  Icon($$renderer, spread_props([
    { name: "archive-restore" },
    $$sanitized_props,
    {
      /**
       * @component @name ArchiveRestore
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cmVjdCB3aWR0aD0iMjAiIGhlaWdodD0iNSIgeD0iMiIgeT0iMyIgcng9IjEiIC8+CiAgPHBhdGggZD0iTTQgOHYxMWEyIDIgMCAwIDAgMiAyaDIiIC8+CiAgPHBhdGggZD0iTTIwIDh2MTFhMiAyIDAgMCAxLTIgMmgtMiIgLz4KICA8cGF0aCBkPSJtOSAxNSAzLTMgMyAzIiAvPgogIDxwYXRoIGQ9Ik0xMiAxMnY5IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/archive-restore
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
function Chevron_left($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.468.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [["path", { "d": "m15 18-6-6 6-6" }]];
  Icon($$renderer, spread_props([
    { name: "chevron-left" },
    $$sanitized_props,
    {
      /**
       * @component @name ChevronLeft
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMTUgMTgtNi02IDYtNiIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/chevron-left
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
function Chevron_right($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.468.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [["path", { "d": "m9 18 6-6-6-6" }]];
  Icon($$renderer, spread_props([
    { name: "chevron-right" },
    $$sanitized_props,
    {
      /**
       * @component @name ChevronRight
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtOSAxOCA2LTYtNi02IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/chevron-right
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
function Square_pen($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.468.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    [
      "path",
      {
        "d": "M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
      }
    ],
    [
      "path",
      {
        "d": "M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"
      }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "square-pen" },
    $$sanitized_props,
    {
      /**
       * @component @name SquarePen
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTIgM0g1YTIgMiAwIDAgMC0yIDJ2MTRhMiAyIDAgMCAwIDIgMmgxNGEyIDIgMCAwIDAgMi0ydi03IiAvPgogIDxwYXRoIGQ9Ik0xOC4zNzUgMi42MjVhMSAxIDAgMCAxIDMgM2wtOS4wMTMgOS4wMTRhMiAyIDAgMCAxLS44NTMuNTA1bC0yLjg3My44NGEuNS41IDAgMCAxLS42Mi0uNjJsLjg0LTIuODczYTIgMiAwIDAgMSAuNTA2LS44NTJ6IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/square-pen
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
function Target($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.468.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    ["circle", { "cx": "12", "cy": "12", "r": "10" }],
    ["circle", { "cx": "12", "cy": "12", "r": "6" }],
    ["circle", { "cx": "12", "cy": "12", "r": "2" }]
  ];
  Icon($$renderer, spread_props([
    { name: "target" },
    $$sanitized_props,
    {
      /**
       * @component @name Target
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgLz4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI2IiAvPgogIDxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjIiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/target
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
function Trash_2($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.468.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    ["path", { "d": "M3 6h18" }],
    ["path", { "d": "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }],
    ["path", { "d": "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" }],
    ["line", { "x1": "10", "x2": "10", "y1": "11", "y2": "17" }],
    ["line", { "x1": "14", "x2": "14", "y1": "11", "y2": "17" }]
  ];
  Icon($$renderer, spread_props([
    { name: "trash-2" },
    $$sanitized_props,
    {
      /**
       * @component @name Trash2
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMyA2aDE4IiAvPgogIDxwYXRoIGQ9Ik0xOSA2djE0YzAgMS0xIDItMiAySDdjLTEgMC0yLTEtMi0yVjYiIC8+CiAgPHBhdGggZD0iTTggNlY0YzAtMSAxLTIgMi0yaDRjMSAwIDIgMSAyIDJ2MiIgLz4KICA8bGluZSB4MT0iMTAiIHgyPSIxMCIgeTE9IjExIiB5Mj0iMTciIC8+CiAgPGxpbmUgeDE9IjE0IiB4Mj0iMTQiIHkxPSIxMSIgeTI9IjE3IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/trash-2
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
const HABIT_PHASES = [
  {
    id: 1,
    name: "Reinforcement",
    range: "1–21",
    description: "Every day is critical",
    hint: "Missing = serious setback",
    minDays: 1,
    maxDays: 21,
    iconName: "shield"
  },
  {
    id: 2,
    name: "Momentum",
    range: "22–66",
    description: "Getting easier, stay consistent",
    hint: "3 misses in a row = danger",
    minDays: 22,
    maxDays: 66,
    iconName: "zap"
  },
  {
    id: 3,
    name: "Automation",
    range: "67–99",
    description: "Running on autopilot",
    hint: "Occasional misses are fine",
    minDays: 67,
    maxDays: 99,
    iconName: "activity"
  },
  {
    id: 4,
    name: "Identity",
    range: "100+",
    description: "This is who you are",
    hint: "Habit is part of your identity",
    minDays: 100,
    maxDays: null,
    iconName: "star"
  }
];
function getHabitPhase(streak) {
  if (streak >= 100) {
    return HABIT_PHASES[3];
  }
  if (streak >= 67) {
    return HABIT_PHASES[2];
  }
  if (streak >= 22) {
    return HABIT_PHASES[1];
  }
  return HABIT_PHASES[0];
}
function HabitHeatmap($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const FILL_OPACITIES = [0, 0.22, 0.46, 0.72, 1];
    const DAYS = 90;
    let {
      completions,
      dailyTarget = 1,
      color = DEFAULT_HABIT_COLOR,
      compact = false
    } = $$props;
    function getIntensity(count, target) {
      if (count <= 0) return 0;
      const ratio = count / Math.max(1, target);
      if (ratio >= 1) return 4;
      if (ratio >= 0.75) return 3;
      if (ratio >= 0.5) return 2;
      return 1;
    }
    function buildWeeks(comps, dt) {
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = formatDate(today);
      const rangeStart = new Date(today);
      rangeStart.setDate(today.getDate() - (DAYS - 1));
      const rangeStartStr = formatDate(rangeStart);
      const dayOfWeek = (rangeStart.getDay() + 6) % 7;
      const gridStart = new Date(rangeStart);
      gridStart.setDate(rangeStart.getDate() - dayOfWeek);
      const weeks2 = [];
      const cursor = new Date(gridStart);
      while (formatDate(cursor) <= todayStr) {
        const week = [];
        for (let d = 0; d < 7; d++) {
          const dateStr = formatDate(cursor);
          week.push({
            date: dateStr,
            intensity: getIntensity(comps[dateStr] ?? 0, dt),
            isToday: dateStr === todayStr,
            isOutOfRange: dateStr > todayStr || dateStr < rangeStartStr
          });
          cursor.setDate(cursor.getDate() + 1);
        }
        weeks2.push(week);
      }
      return weeks2;
    }
    function buildMonthMarkers(weeks2) {
      const markers2 = [];
      let lastMonth = -1;
      weeks2.forEach((week, idx) => {
        const weekStart = new Date(normalizeToCompletionKey(week[0].date));
        const m = weekStart.getMonth();
        if (m !== lastMonth) {
          markers2.push({
            label: weekStart.toLocaleString("default", { month: "short" }),
            index: idx
          });
          lastMonth = m;
        }
      });
      return markers2;
    }
    const weeks = derived(() => buildWeeks(completions, dailyTarget));
    const { hex: accentHex, glow } = HABIT_COLOR_THEMES[color];
    const n = derived(() => weeks().length);
    const markers = derived(() => buildMonthMarkers(weeks()));
    function cellStyle(cell) {
      if (cell.isOutOfRange) return "background-color: transparent; opacity: 0";
      if (cell.intensity === 0) return "background-color: var(--border); opacity: 0.5";
      return `background-color: ${accentHex}; opacity: ${FILL_OPACITIES[cell.intensity]}; box-shadow: 0 0 4px ${glow}`;
    }
    function cellOutline(cell) {
      return cell.isToday && !cell.isOutOfRange ? `1px solid ${accentHex}` : "none";
    }
    if (compact) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="grid gap-[2px]"${attr_style(`grid-template-columns: repeat(${stringify(n())}, 4px); grid-template-rows: repeat(7, 4px); grid-auto-flow: column;`)}><!--[-->`);
      const each_array = ensure_array_like(weeks().flat());
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let cell = each_array[$$index];
        $$renderer2.push(`<div class="w-[4px] h-[4px] rounded-[1px]"${attr_style(`${stringify(cellStyle(cell))}; outline: ${stringify(cellOutline(cell))}; outline-offset: 1px;`)}></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="relative select-none sm:max-w-[320px] sm:mx-auto"><div class="flex w-full gap-0"><div class="grid shrink-0 gap-1 sm:gap-1.5 mr-1.5" style="width: 16px; grid-template-rows: repeat(7, minmax(0, 1fr))"><!--[-->`);
      const each_array_1 = ensure_array_like(["M", "", "W", "", "F", "", ""]);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let label = each_array_1[$$index_1];
        $$renderer2.push(`<div class="text-[9px] font-mono text-muted flex items-center">${escape_html(label)}</div>`);
      }
      $$renderer2.push(`<!--]--></div> <div class="grid flex-1 gap-1 sm:gap-1.5"${attr_style(`grid-template-columns: repeat(${stringify(n())}, minmax(0, 1fr))`)}><!--[-->`);
      const each_array_2 = ensure_array_like(weeks());
      for (let $$index_3 = 0, $$length = each_array_2.length; $$index_3 < $$length; $$index_3++) {
        let week = each_array_2[$$index_3];
        $$renderer2.push(`<div class="grid gap-1 sm:gap-1.5" style="grid-template-rows: repeat(7, minmax(0, 1fr))"><!--[-->`);
        const each_array_3 = ensure_array_like(week);
        for (let $$index_2 = 0, $$length2 = each_array_3.length; $$index_2 < $$length2; $$index_2++) {
          let cell = each_array_3[$$index_2];
          $$renderer2.push(`<div class="aspect-square w-full rounded-[2px] transition-transform hover:scale-110"${attr_style(`${stringify(cellStyle(cell))}; cursor: ${stringify(cell.isOutOfRange ? "default" : "pointer")}; outline: ${stringify(cellOutline(cell))}; outline-offset: 1px;`)}></div>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]--></div></div> `);
      if (markers().length > 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="relative mt-1 h-4 ml-[18px] overflow-hidden"><!--[-->`);
        const each_array_4 = ensure_array_like(markers());
        for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
          let m = each_array_4[$$index_4];
          $$renderer2.push(`<span class="absolute text-[9px] font-mono text-muted"${attr_style(`left: ${stringify(m.index / n() * 100)}%`)}>${escape_html(m.label)}</span>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function getStreakHint(currentStreak, longestStreak) {
  if (currentStreak === 0) return { iconName: "flame", text: "Start today" };
  if (currentStreak >= longestStreak && longestStreak > 0) return { iconName: "trophy", text: "Personal best!" };
  return { iconName: "flame", text: `${longestStreak - currentStreak}d to record` };
}
function getBestHint(longestStreak) {
  if (longestStreak >= 21) return { iconName: "check-circle-2", text: "Habit established" };
  if (longestStreak >= 7) return { iconName: "dumbbell", text: "Good foundation" };
  return { iconName: "target", text: "Target: 7 days" };
}
function getRateHint(habitAgeDays, completionRate) {
  if (habitAgeDays < 7) return { iconName: "sprout", text: "Just started" };
  if (habitAgeDays < 14) {
    return completionRate >= 60 ? { iconName: "check-circle-2", text: "Strong start!" } : { iconName: "dumbbell", text: "Keep building" };
  }
  if (completionRate >= 80) return { iconName: "check-circle-2", text: "Excellent" };
  if (completionRate >= 60) return { iconName: "lightbulb", text: "Aim for 80%+" };
  if (completionRate >= 40) return { iconName: "trending-up", text: "Room to grow" };
  return { iconName: "alert-triangle", text: "Needs focus" };
}
function getRateColor(habitAgeDays, completionRate) {
  if (habitAgeDays < 14) return completionRate >= 60 ? "text-accent" : "text-accent-secondary";
  if (completionRate >= 80) return "text-accent";
  if (completionRate >= 50) return "text-accent-secondary";
  return "text-muted";
}
function getTotalHint(completedDays) {
  if (completedDays >= 100) return { iconName: "trophy", text: "100+ milestone!" };
  return { iconName: "calendar", text: `${100 - completedDays} to 100` };
}
function getHabitAgeDays(habitCreatedAt) {
  return Math.floor((Date.now() - new Date(habitCreatedAt).getTime()) / (1e3 * 60 * 60 * 24));
}
function getRateWindowLabel(habitAgeDays) {
  const rateWindowDays = Math.min(30, habitAgeDays);
  return rateWindowDays < 30 ? `${rateWindowDays}d` : "30 days";
}
function HabitDetail($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    const habitId = derived(() => store_get($$store_subs ??= {}, "$page", page).params.id);
    const allHabits = derived(() => store_get($$store_subs ??= {}, "$habitsStore", habitsStore));
    const habit = derived(() => allHabits().find((h) => h.id === habitId()));
    const todayFormatted = formatDate(/* @__PURE__ */ new Date());
    const todayFreezeKey = completionKeyToCalendarDate(todayFormatted);
    const stats = derived(() => habit() ? getHabitStats(habitId()) : null);
    const accent = derived(() => habit() ? HABIT_COLOR_THEMES[habit().color] : HABIT_COLOR_THEMES.indigo);
    const dailyTarget = derived(() => Math.max(1, habit()?.dailyTarget ?? 1));
    const todayCount = derived(() => habit()?.completions[todayFormatted] ?? 0);
    const completedToday = derived(() => todayCount() >= dailyTarget());
    const canIncrement = derived(() => todayCount() < dailyTarget());
    const isTodayFrozen = derived(() => habit() ? habit().freezeDays.includes(todayFreezeKey) : false);
    const habitAgeDays = derived(() => habit() ? getHabitAgeDays(habit().createdAt) : 0);
    const rateWindowLabel = derived(() => getRateWindowLabel(habitAgeDays()));
    const streakHint = derived(() => stats() ? getStreakHint(stats().currentStreak, stats().longestStreak) : null);
    const bestHint = derived(() => stats() ? getBestHint(stats().longestStreak) : null);
    const rateHint = derived(() => stats() ? getRateHint(habitAgeDays(), stats().completionRate) : null);
    const totalHint = derived(() => stats() ? getTotalHint(stats().completedDays) : null);
    const rateColor = derived(() => stats() ? getRateColor(habitAgeDays(), stats().completionRate) : "text-muted");
    const phase = derived(() => stats() ? getHabitPhase(stats().currentStreak) : null);
    const automatismScore = derived(() => stats()?.automatismScore ?? 0);
    const automatismLevel = derived(() => getAutomatismLevelDetailed(automatismScore(), accent().hex));
    const automatismMessage = derived(() => getAutomatismMessageDetailed(automatismScore()));
    const automatismColor = derived(() => getAutomatismColorDetailed(automatismScore()));
    const monthlyInsight = derived(() => {
      if (!stats() || !habit()) return null;
      const data = stats().monthlyData;
      if (data.length < 2 || habitAgeDays() < 14) return {
        text: "Complete more weeks to see monthly trends.",
        color: "var(--text-muted)"
      };
      const last = data[data.length - 1].rate;
      const prev = data[data.length - 2].rate;
      const trend = last - prev;
      if (last >= 80 && trend >= 0) return {
        text: `${last}% last month — excellent, keep this up.`,
        color: "var(--accent)"
      };
      if (trend >= 15) return {
        text: `Up ${trend}% from last month — great momentum!`,
        color: "var(--accent)"
      };
      if (trend <= -15) return {
        text: `Down ${Math.abs(trend)}% this month. What changed?`,
        color: "var(--accent-secondary)"
      };
      if (last < 40) return {
        text: "Low rate. Try habit stacking or reduce the target.",
        color: "var(--accent-secondary)"
      };
      return {
        text: `${last}% this month. Consistent effort adds up.`,
        color: "var(--text-muted)"
      };
    });
    const weeklyInsight = derived(() => {
      if (!stats() || !habit()) return null;
      const data = stats().weeklyData;
      if (data.length < 4 || habitAgeDays() < 14) return null;
      const lastWeek = data[data.length - 1].count;
      const recentAvg = data.slice(-3).reduce((s, w) => s + w.count, 0) / 3;
      const earlierAvg = data.slice(-6, -3).reduce((s, w) => s + w.count, 0) / 3;
      const trend = recentAvg - earlierAvg;
      if (lastWeek === 7) return {
        text: "Perfect last week — all 7 days!",
        color: "var(--accent)"
      };
      if (trend > 1.5) return {
        text: "Weekly completions trending up — great momentum.",
        color: "var(--accent)"
      };
      if (trend < -1.5) return {
        text: "Completions dropping. Try pairing with an existing habit.",
        color: "var(--accent-secondary)"
      };
      if (lastWeek === 0) return {
        text: "No completions last week. Start fresh today.",
        color: "var(--accent-secondary)"
      };
      return {
        text: `${lastWeek}/7 days last week. Aim for one more.`,
        color: "var(--text-muted)"
      };
    });
    const heatmapDayDetails = derived(() => {
      if (!habit()) return {};
      const details = {};
      for (const [date, count] of Object.entries(habit().completions)) {
        if (count >= dailyTarget()) details[date] = [formatHabitLabel(habit())];
      }
      return details;
    });
    const completedCount = derived(() => habit() ? Object.keys(habit().completions).length : 0);
    const targetStreak = derived(() => habit()?.targetStreak ?? 21);
    const remaining = derived(() => stats() ? targetStreak() - stats().currentStreak : 0);
    const streakHintText = derived(() => {
      if (!stats()) return "";
      if (stats().currentStreak >= targetStreak()) return "Target reached! Set a new challenge.";
      if (stats().currentStreak === 0) return `Start today — ${targetStreak()} days to reach your target.`;
      return `${remaining()} more day${remaining() === 1 ? "" : "s"} to hit your ${targetStreak()}-day target.`;
    });
    const streakHintColor = derived(() => {
      if (!stats()) return "text-muted";
      if (stats().currentStreak >= targetStreak()) return "text-accent";
      if (stats().currentStreak > targetStreak() * 0.5) return "text-accent-secondary";
      return "text-muted";
    });
    let displayDate = /* @__PURE__ */ new Date();
    const retroGrid = derived(() => {
      if (!habit()) return { weeks: [], monthCount: 0 };
      const schedule = resolveHabitSchedule(habit());
      return buildRetroGrid(habit(), schedule, displayDate);
    });
    const maxValue = derived(dailyTarget);
    const monthYearLabel = derived(() => displayDate.toLocaleString("en-US", { month: "short", year: "numeric" }));
    const isCurrentMonth = derived(() => displayDate.getMonth() === (/* @__PURE__ */ new Date()).getMonth() && displayDate.getFullYear() === (/* @__PURE__ */ new Date()).getFullYear());
    const disableNextMonth = derived(() => displayDate.getFullYear() > (/* @__PURE__ */ new Date()).getFullYear() || displayDate.getFullYear() === (/* @__PURE__ */ new Date()).getFullYear() && displayDate.getMonth() >= (/* @__PURE__ */ new Date()).getMonth());
    function buildRetroGrid(h, schedule, refDate) {
      const now = /* @__PURE__ */ new Date();
      const todayKey = formatDate(now);
      const startDate = new Date(refDate);
      startDate.setDate(startDate.getDate() - 29);
      const weekStartOffset = (startDate.getDay() + 6) % 7;
      const paddedStart = new Date(startDate);
      paddedStart.setDate(paddedStart.getDate() - weekStartOffset);
      const days = [];
      for (let i = 0; i < weekStartOffset; i++) {
        const d = new Date(paddedStart);
        d.setDate(paddedStart.getDate() + i);
        days.push({
          date: formatDate(d),
          dayOfMonth: d.getDate(),
          scheduled: false,
          count: 0,
          isToday: false,
          isFuture: false,
          isEmpty: true,
          dayOfWeek: d.getDay(),
          isWeekend: d.getDay() === 0 || d.getDay() === 6,
          isFrozen: false
        });
      }
      const monthIndexMap = /* @__PURE__ */ new Map();
      const regMonth = (m) => {
        if (!monthIndexMap.has(m)) monthIndexMap.set(m, monthIndexMap.size);
        return monthIndexMap.get(m);
      };
      for (let i = 0; i < 30; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        const dk = formatDate(d);
        const fk = completionKeyToCalendarDate(dk);
        const wd = d.getDay();
        days.push({
          date: dk,
          dayOfMonth: d.getDate(),
          scheduled: isScheduledForDate(schedule, d),
          count: h.completions[dk] ?? 0,
          isToday: dk === todayKey,
          isFuture: d > now,
          isEmpty: false,
          dayOfWeek: wd,
          isWeekend: wd === 0 || wd === 6,
          monthIndex: regMonth(d.getMonth()),
          isFrozen: (h.freezeDays ?? []).includes(fk)
        });
      }
      const weeks = [];
      for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
      return { weeks, monthCount: monthIndexMap.size };
    }
    function retroDayBg(day) {
      if (day.isEmpty || day.isFuture) return "transparent";
      if (day.count >= maxValue()) return accent().heatmapLevels[4];
      if (day.count > 0) return accent().heatmapLevels[3];
      return "var(--bg-card)";
    }
    const DAY_HEADERS = ["M", "T", "W", "T", "F", "S", "S"];
    if (!habit() || !stats()) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="min-h-screen bg-bg-primary flex items-center justify-center"><div class="text-muted font-mono">Habit not found</div></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="min-h-screen bg-bg-primary"><div class="border-b border-border bg-bg-primary px-4 sticky top-0 z-10" style="top: var(--safe-area-inset-top, 0px); padding-top: calc(var(--safe-area-inset-top, 0px) + 1rem); padding-bottom: 1rem"><div class="max-w-2xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center"><div class="flex items-center gap-3 min-w-0 flex-1"><button aria-label="Back to dashboard" class="text-muted hover:text-foreground transition-colors p-1 -ml-1 flex-shrink-0">`);
      Arrow_left($$renderer2, { size: 16 });
      $$renderer2.push(`<!----></button> <span class="text-xl flex-shrink-0">${escape_html(habit().icon)}</span> <div class="flex-1 min-w-0"><h1 class="text-base font-semibold text-foreground break-words sm:truncate">${escape_html(habit().name)}</h1> `);
      if (habit().description) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="flex items-center gap-1 min-w-0"><p class="text-[11px] text-muted truncate">${escape_html(habit().description)}</p> `);
        DescriptionTooltip($$renderer2, { description: habit().description });
        $$renderer2.push(`<!----></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div></div> <div class="flex flex-wrap items-center gap-2 sm:justify-end"><button${attr("aria-label", habit().archived ? "Unarchive" : "Archive")}${attr_class(`p-1.5 rounded border transition-colors ${stringify(habit().archived ? "border-accent-secondary/30 text-accent-secondary bg-accent-secondary/10" : "border-border text-muted hover:text-foreground hover:border-border-hover")}`)}>`);
      if (habit().archived) {
        $$renderer2.push("<!--[0-->");
        Archive_restore($$renderer2, { size: 13 });
      } else {
        $$renderer2.push("<!--[-1-->");
        Archive($$renderer2, { size: 13 });
      }
      $$renderer2.push(`<!--]--></button> <button aria-label="Edit habit" class="p-1.5 rounded border border-border text-muted hover:text-foreground hover:border-border-hover transition-colors">`);
      Square_pen($$renderer2, { size: 13 });
      $$renderer2.push(`<!----></button> <button${attr("disabled", !canIncrement(), true)}${attr_class(`px-3 py-1.5 rounded text-xs font-mono font-medium border transition-all duration-200 ${stringify(completedToday() ? "border-border text-muted bg-transparent" : "text-bg-primary font-bold")} disabled:opacity-40 disabled:cursor-not-allowed`)}${attr_style(!completedToday() ? `background-color: ${accent().hex}; border-color: ${accent().hex}; box-shadow: 0 0 16px ${accent().glow}` : "")}>${escape_html(completedToday() ? "Done" : "Add +1")}</button> <button${attr("disabled", todayCount() <= 0, true)} class="px-3 py-1.5 rounded text-xs font-mono font-medium border border-border text-muted transition disabled:opacity-40 disabled:cursor-not-allowed hover:border-border-hover hover:text-foreground">-1</button> <button${attr("aria-label", isTodayFrozen() ? "Unfreeze today" : "Freeze today")}${attr_class(`inline-flex h-[34px] w-[34px] flex-none items-center justify-center rounded border transition-colors ${stringify(isTodayFrozen() ? "border-accent text-accent bg-accent/15" : "border-border text-muted hover:text-foreground hover:border-border-hover")}`)}>`);
      Snowflake($$renderer2, { size: 11, strokeWidth: 2.2 });
      $$renderer2.push(`<!----></button></div></div></div> <div class="max-w-2xl mx-auto px-4 py-4 space-y-4"><div class="space-y-2"><div class="flex items-center gap-2"><h2 class="text-xs font-mono text-muted uppercase tracking-wider">Key metrics</h2> `);
      ChartGuideTooltip($$renderer2, {
        title: "Key metrics",
        variant: "columns"
      });
      $$renderer2.push(`<!----></div> <div class="grid grid-cols-2 gap-2 sm:grid-cols-4"><div class="bg-bg-secondary border border-border rounded-lg p-3"><div class="flex items-center gap-1 mb-2">`);
      Flame($$renderer2, { size: 10, class: "text-accent-secondary" });
      $$renderer2.push(`<!----> <span class="text-[9px] font-mono text-muted uppercase tracking-wider">Streak</span> <span class="ml-auto">`);
      ChartGuideTooltip($$renderer2, {
        title: "Adaptive phases",
        focusPoints: HABIT_PHASES.map((p) => `${p.name} (${p.range}d): ${p.description}`),
        variant: "columns"
      });
      $$renderer2.push(`<!----></span></div> <div class="text-xl font-mono font-bold text-accent-secondary">${escape_html(stats().currentStreak)}</div> <div class="text-[9px] font-mono text-muted">days</div> `);
      if (phase() && stats().currentStreak > 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="flex items-center gap-0.5 mt-0.5 mb-0.5"><span class="text-[9px] font-mono text-muted">${escape_html(phase().name)}</span></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (streakHint()) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div${attr_class(`flex items-center gap-0.5 mt-1 ${stringify(stats().currentStreak === 0 ? "text-accent-secondary" : stats().currentStreak >= stats().longestStreak ? "text-accent" : "text-muted")}`)}><span class="text-[9px] font-mono">${escape_html(streakHint().text)}</span></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div> <div class="bg-bg-secondary border border-border rounded-lg p-3"><div class="flex items-center gap-1 mb-2">`);
      Target($$renderer2, { size: 10, style: `color: ${stringify(accent().hex)}` });
      $$renderer2.push(`<!----> <span class="text-[9px] font-mono text-muted uppercase tracking-wider">Best</span></div> <div class="text-xl font-mono font-bold"${attr_style(`color: ${stringify(accent().hex)}`)}>${escape_html(stats().longestStreak)}</div> <div class="text-[9px] font-mono text-muted">days</div> `);
      if (bestHint()) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div${attr_class(`flex items-center gap-0.5 mt-1 ${stringify(stats().longestStreak >= 21 ? "text-accent" : stats().longestStreak >= 7 ? "text-accent-secondary" : "text-muted")}`)}><span class="text-[9px] font-mono">${escape_html(bestHint().text)}</span></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div> <div class="bg-bg-secondary border border-border rounded-lg p-3"><div class="flex items-center gap-1 mb-2">`);
      Trending_up($$renderer2, { size: 10, class: "text-accent-secondary" });
      $$renderer2.push(`<!----> <span class="text-[9px] font-mono text-muted uppercase tracking-wider">Rate</span></div> <div${attr_class(`text-xl font-mono font-bold ${stringify(rateColor())}`)}>${escape_html(stats().completionRate)}%</div> <div class="text-[9px] font-mono text-muted">${escape_html(rateWindowLabel())}</div> `);
      if (rateHint()) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div${attr_class(`flex items-center gap-0.5 mt-1 ${stringify(rateColor())}`)}><span class="text-[9px] font-mono">${escape_html(rateHint().text)}</span></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div> <div class="bg-bg-secondary border border-border rounded-lg p-3"><div class="flex items-center gap-1 mb-2">`);
      Calendar($$renderer2, { size: 10, class: "text-muted" });
      $$renderer2.push(`<!----> <span class="text-[9px] font-mono text-muted uppercase tracking-wider">Total</span></div> <div class="text-xl font-mono font-bold text-foreground">${escape_html(stats().completedDays)}</div> <div class="text-[9px] font-mono text-muted">days</div> `);
      if (totalHint()) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div${attr_class(`flex items-center gap-0.5 mt-1 ${stringify(stats().completedDays >= 100 ? "text-accent" : "text-muted")}`)}><span class="text-[9px] font-mono">${escape_html(totalHint().text)}</span></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div></div></div> <div class="bg-bg-secondary border border-border rounded-xl p-4"><div class="flex items-center justify-between mb-3"><div class="flex flex-col"><div class="flex items-center gap-2"><span class="text-[10px] font-mono text-muted uppercase tracking-widest">Habit Strength</span> `);
      ChartGuideTooltip($$renderer2, {
        title: "Habit strength",
        variant: "line"
      });
      $$renderer2.push(`<!----></div> <span class="text-lg font-bold text-foreground">Automatism: ${escape_html(automatismScore())}%</span></div> <div class="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border"${attr_style(`border-color: ${stringify(automatismLevel().color)}; color: ${stringify(automatismLevel().color)}`)}>${escape_html(automatismLevel().label)}</div></div> <div class="h-2 bg-border rounded-full overflow-hidden"><div class="h-full transition-all duration-1000 ease-out"${attr_style(`width: ${stringify(automatismScore())}%; background-color: ${stringify(accent().hex)}; box-shadow: 0 0 10px ${stringify(accent().glow)}`)}></div></div> <p class="text-[10px] font-mono mt-2"${attr_style(`color: ${stringify(automatismColor())}`)}>${escape_html(automatismMessage())}</p></div> <div class="bg-bg-secondary border border-border rounded-2xl p-4"><div class="mb-2 flex items-center gap-2"><div class="text-[11px] font-mono text-muted uppercase tracking-[0.5em]">Today</div> `);
      ChartGuideTooltip($$renderer2, {
        title: "Today progress",
        variant: "bars"
      });
      $$renderer2.push(`<!----></div> <p class="text-sm text-foreground">Completed <span class="font-mono font-bold"${attr_style(`color: ${stringify(accent().hex)}`)}>${escape_html(todayCount())}</span> / ${escape_html(dailyTarget())} today.</p> <p class="text-[11px] text-muted mt-1">Reminder settings are available on the edit screen.</p></div> <div class="bg-bg-secondary border border-border rounded-lg p-3 space-y-3"><div class="flex items-center justify-between"><div class="flex items-center gap-2"><h2 class="text-xs font-mono text-muted uppercase tracking-wider">Activity - 90 days</h2> `);
      ChartGuideTooltip($$renderer2, {
        title: "Activity heatmap",
        variant: "grid"
      });
      $$renderer2.push(`<!----></div> <span class="text-[10px] font-mono text-muted">${escape_html(completedCount())} completions</span></div> <div class="w-full mx-auto lg:max-w-[560px]">`);
      HabitHeatmap($$renderer2, {
        completions: habit().completions,
        dailyTarget: dailyTarget(),
        color: habit().color,
        dayDetails: heatmapDayDetails()
      });
      $$renderer2.push(`<!----></div></div> <div class="bg-bg-secondary border border-border rounded-lg p-4 flex items-center gap-4">`);
      CompletionRing($$renderer2, {
        percentage: stats().completionRate,
        size: 72,
        strokeWidth: 5,
        color: habit().color,
        showText: true
      });
      $$renderer2.push(`<!----> <div class="flex-1"><div class="flex items-center justify-between mb-2"><div class="flex items-center gap-2"><span class="text-xs font-mono text-muted">Target streak</span> `);
      ChartGuideTooltip($$renderer2, spread_props([TARGET_STREAK_TOOLTIP, { triggerClassName: "h-7 w-7" }]));
      $$renderer2.push(`<!----></div> <span class="text-xs font-mono"${attr_style(`color: ${stringify(accent().hex)}`)}>${escape_html(stats().currentStreak)}/${escape_html(targetStreak())}d</span></div> <div class="h-1.5 bg-border rounded-full overflow-hidden mb-2"><div class="h-full rounded-full transition-all duration-700"${attr_style(`width: ${stringify(Math.min(100, stats().currentStreak / targetStreak() * 100))}%; background-color: ${stringify(accent().hex)}; box-shadow: 0 0 8px ${stringify(accent().glow)}`)}></div></div> <p${attr_class(`text-[9px] font-mono mb-2 ${stringify(streakHintColor())}`)}>${escape_html(streakHintText())}</p> <div class="flex gap-2 flex-wrap"><!--[-->`);
      const each_array = ensure_array_like(habit().tags);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let tag = each_array[$$index];
        $$renderer2.push(`<span class="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border border-border bg-bg-card text-foreground"><span class="w-1.5 h-1.5 rounded-full"${attr_style(`background-color: ${stringify(accent().hex)}`)}></span>${escape_html(tag)}</span>`);
      }
      $$renderer2.push(`<!--]--></div></div></div> `);
      if (stats().monthlyData.length > 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="bg-bg-secondary border border-border rounded-lg p-4"><div class="mb-4 flex items-center gap-2"><h2 class="text-xs font-mono text-muted uppercase tracking-wider">Monthly completion rate</h2> `);
        ChartGuideTooltip($$renderer2, {
          title: "Monthly completion rate",
          variant: "line"
        });
        $$renderer2.push(`<!----></div> <div class="flex items-end gap-1 h-24"><!--[-->`);
        const each_array_1 = ensure_array_like(stats().monthlyData);
        for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
          let m = each_array_1[i];
          $$renderer2.push(`<div class="flex-1 flex flex-col items-center gap-0.5"><div class="w-full rounded-sm transition-all"${attr_style(`height: ${stringify(Math.max(2, m.rate))}%; background-color: ${stringify(accent().hex)}; opacity: ${stringify(0.4 + i / stats().monthlyData.length * 0.6)}; ${stringify(i === stats().monthlyData.length - 1 ? `box-shadow: 0 0 8px ${accent().glow}` : "")}`)}></div> <span class="text-[8px] font-mono text-muted truncate w-full text-center">${escape_html(m.month)}</span></div>`);
        }
        $$renderer2.push(`<!--]--></div> `);
        if (monthlyInsight()) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="flex items-center gap-1 mt-3"${attr_style(`color: ${stringify(monthlyInsight().color)}`)}><p class="text-[10px] font-mono">${escape_html(monthlyInsight().text)}</p></div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (stats().weeklyData.length > 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="bg-bg-secondary border border-border rounded-lg p-4"><div class="mb-3 flex items-center gap-2"><h2 class="text-xs font-mono text-muted uppercase tracking-wider">Weekly completions</h2> `);
        ChartGuideTooltip($$renderer2, {
          title: "Weekly completions",
          variant: "columns"
        });
        $$renderer2.push(`<!----></div> <div class="flex items-end gap-1 h-16"><!--[-->`);
        const each_array_2 = ensure_array_like(stats().weeklyData);
        for (let i = 0, $$length = each_array_2.length; i < $$length; i++) {
          let w = each_array_2[i];
          $$renderer2.push(`<div class="flex-1 flex flex-col items-center gap-1"><div class="w-full rounded-sm transition-all"${attr_style(`height: ${stringify(w.count / 7 * 100)}%; min-height: 2px; background-color: ${stringify(accent().hex)}; opacity: ${stringify(0.4 + i / stats().weeklyData.length * 0.6)}; ${stringify(i === stats().weeklyData.length - 1 ? `box-shadow: 0 0 8px ${accent().glow}` : "")}`)}></div></div>`);
        }
        $$renderer2.push(`<!--]--></div> <div class="flex justify-between mt-1 mb-2"><span class="text-[9px] font-mono text-muted">12w ago</span> <span class="text-[9px] font-mono text-muted">this week</span></div> `);
        if (weeklyInsight()) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="flex items-center gap-1"${attr_style(`color: ${stringify(weeklyInsight().color)}`)}><p class="text-[10px] font-mono">${escape_html(weeklyInsight().text)}</p></div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div class="bg-bg-secondary border border-border rounded-2xl p-3 space-y-2"><div class="flex items-center justify-between gap-2"><div><h2 class="text-[11px] font-mono text-muted uppercase tracking-[0.5em]">Retro calendar</h2></div> <span class="text-[11px] font-mono text-muted">30d</span></div> <div class="flex items-center justify-between gap-2 pt-1"><button class="flex items-center justify-center w-7 h-7 rounded border border-border hover:border-border-hover text-muted hover:text-foreground transition-colors">`);
      Chevron_left($$renderer2, { size: 16 });
      $$renderer2.push(`<!----></button> <button${attr_class(`text-xs font-mono uppercase tracking-wider transition-colors ${stringify(isCurrentMonth() ? "text-foreground font-semibold" : "text-muted hover:text-foreground")}`)}>${escape_html(monthYearLabel())}</button> <button${attr("disabled", disableNextMonth(), true)} class="flex items-center justify-center w-7 h-7 rounded border border-border hover:border-border-hover text-muted hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed">`);
      Chevron_right($$renderer2, { size: 16 });
      $$renderer2.push(`<!----></button></div> <div class="w-full mx-auto lg:max-w-[248px]"><div class="grid grid-cols-7 gap-1.5 sm:gap-2"><!--[-->`);
      const each_array_3 = ensure_array_like(DAY_HEADERS);
      for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
        let d = each_array_3[$$index_3];
        $$renderer2.push(`<div class="text-center text-[9px] font-mono text-muted uppercase tracking-wider py-0.5">${escape_html(d)}</div>`);
      }
      $$renderer2.push(`<!--]--></div> <div class="space-y-1.5 sm:space-y-2"><!--[-->`);
      const each_array_4 = ensure_array_like(retroGrid().weeks);
      for (let wi = 0, $$length = each_array_4.length; wi < $$length; wi++) {
        let week = each_array_4[wi];
        $$renderer2.push(`<div class="grid grid-cols-7 gap-1.5 sm:gap-2"><!--[-->`);
        const each_array_5 = ensure_array_like(week);
        for (let $$index_4 = 0, $$length2 = each_array_5.length; $$index_4 < $$length2; $$index_4++) {
          let day = each_array_5[$$index_4];
          if (day.isEmpty) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<div class="aspect-square w-full"></div>`);
          } else {
            $$renderer2.push("<!--[-1-->");
            $$renderer2.push(`<button type="button"${attr("disabled", day.isFuture, true)}${attr_class(`aspect-square w-full rounded-md border flex flex-col items-center justify-center transition-all duration-150 relative overflow-hidden ${stringify(day.isFuture ? "opacity-30 cursor-not-allowed" : "hover:brightness-110")} ${stringify(day.isToday ? "ring-1" : "")}`)}${attr_style(`background-color: ${stringify(retroDayBg(day))}; border-color: ${stringify(day.scheduled ? accent().hex : "var(--border)")}; border-style: ${stringify(day.scheduled ? "solid" : "dashed")}; ${stringify(day.count >= maxValue() ? `box-shadow: 0 0 10px ${accent().glow}` : "")} ${stringify(day.isToday ? `--tw-ring-color: ${accent().hex}` : "")}`)}${attr("aria-label", `${stringify(day.date)} ${stringify(day.count)}/${stringify(maxValue())}`)}><span${attr_class(`text-[9px] font-mono leading-none ${stringify(day.count >= maxValue() ? "font-bold text-foreground" : day.isToday ? "font-semibold" : "text-muted")}`)}${attr_style(day.isToday && day.count < maxValue() ? `color: ${accent().hex}` : "")}>${escape_html(day.dayOfMonth)}</span> `);
            if (day.count > 0 && maxValue() > 1) {
              $$renderer2.push("<!--[0-->");
              $$renderer2.push(`<span class="text-[7px] font-mono text-foreground/60 leading-none">${escape_html(day.count)}/${escape_html(maxValue())}</span>`);
            } else {
              $$renderer2.push("<!--[-1-->");
            }
            $$renderer2.push(`<!--]--> `);
            if (day.isFrozen) {
              $$renderer2.push("<!--[0-->");
              $$renderer2.push(`<span class="absolute top-1 right-1 text-[8px] text-accent-secondary">`);
              Snowflake($$renderer2, { size: 10, strokeWidth: 2 });
              $$renderer2.push(`<!----></span>`);
            } else {
              $$renderer2.push("<!--[-1-->");
            }
            $$renderer2.push(`<!--]--></button>`);
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]--></div></div> `);
      {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div> <div class="border border-border rounded-lg p-4"><h2 class="text-xs font-mono text-muted uppercase tracking-wider mb-3">Danger zone</h2> `);
      {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<button class="flex items-center gap-2 text-xs font-mono text-accent hover:text-accent-secondary/80 border border-accent/20 hover:border-accent/40 px-3 py-2 rounded transition-colors">`);
        Trash_2($$renderer2, { size: 12 });
        $$renderer2.push(`<!----> Delete habit</button>`);
      }
      $$renderer2.push(`<!--]--></div></div></div>`);
    }
    $$renderer2.push(`<!--]-->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    const habitId = derived(() => store_get($$store_subs ??= {}, "$page", page).params.id);
    HabitDetail($$renderer2, { habitId: habitId() });
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _page as default
};
