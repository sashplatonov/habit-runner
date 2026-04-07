import "clsx";
import { s as sanitize_props, a as spread_props, b as slot, f as escape_html, h as attr, e as attr_style, c as attr_class, l as bind_props, g as derived, d as stringify, k as ensure_array_like, i as store_get, u as unsubscribe_stores } from "../../../../chunks/root.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/state.svelte.js";
import { f as formatDate, i as isMandatoryToday, c as calculateScheduledCompletionRate, a as calculateScheduledStreak, r as resolveHabitSchedule, b as isScheduledForDate, g as getScheduleStatusForDate, h as habitsStore, t as toggleCompletion } from "../../../../chunks/habitsStore.js";
import { u as undoStore } from "../../../../chunks/undoStore.js";
import { j as completionKeyToCalendarDate, t as toCompletionKey } from "../../../../chunks/db.js";
import { C as ChartGuideTooltip, f as formatHabitLabel } from "../../../../chunks/ChartGuideTooltip.js";
import { C as CompletionRing, F as Flame, T as Trending_up, H as HABIT_COLOR_THEMES, S as Snowflake, D as DescriptionTooltip, g as getAutomatismMessage, a as getAutomatismColor, b as getAutomatismLevel, A as Archive, c as Calendar } from "../../../../chunks/automatism.js";
import { I as Icon } from "../../../../chunks/Icon.js";
import { S as Sparkles } from "../../../../chunks/sparkles.js";
import "canvas-confetti";
import { P as Plus } from "../../../../chunks/plus.js";
function Bell_ring($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.468.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    ["path", { "d": "M10.268 21a2 2 0 0 0 3.464 0" }],
    ["path", { "d": "M22 8c0-2.3-.8-4.3-2-6" }],
    [
      "path",
      {
        "d": "M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"
      }
    ],
    ["path", { "d": "M4 2C2.8 3.7 2 5.7 2 8" }]
  ];
  Icon($$renderer, spread_props([
    { name: "bell-ring" },
    $$sanitized_props,
    {
      /**
       * @component @name BellRing
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTAuMjY4IDIxYTIgMiAwIDAgMCAzLjQ2NCAwIiAvPgogIDxwYXRoIGQ9Ik0yMiA4YzAtMi4zLS44LTQuMy0yLTYiIC8+CiAgPHBhdGggZD0iTTMuMjYyIDE1LjMyNkExIDEgMCAwIDAgNCAxN2gxNmExIDEgMCAwIDAgLjc0LTEuNjczQzE5LjQxIDEzLjk1NiAxOCAxMi40OTkgMTggOEE2IDYgMCAwIDAgNiA4YzAgNC40OTktMS40MTEgNS45NTYtMi43MzggNy4zMjYiIC8+CiAgPHBhdGggZD0iTTQgMkMyLjggMy43IDIgNS43IDIgOCIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/bell-ring
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
function Check($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.468.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [["path", { "d": "M20 6 9 17l-5-5" }]];
  Icon($$renderer, spread_props([
    { name: "check" },
    $$sanitized_props,
    {
      /**
       * @component @name Check
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMjAgNiA5IDE3bC01LTUiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/check
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
function Chevron_down($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.468.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [["path", { "d": "m6 9 6 6 6-6" }]];
  Icon($$renderer, spread_props([
    { name: "chevron-down" },
    $$sanitized_props,
    {
      /**
       * @component @name ChevronDown
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtNiA5IDYgNiA2LTYiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/chevron-down
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
function Chevron_up($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.468.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [["path", { "d": "m18 15-6-6-6 6" }]];
  Icon($$renderer, spread_props([
    { name: "chevron-up" },
    $$sanitized_props,
    {
      /**
       * @component @name ChevronUp
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMTggMTUtNi02LTYgNiIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/chevron-up
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
function Ellipsis($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.468.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    ["circle", { "cx": "12", "cy": "12", "r": "1" }],
    ["circle", { "cx": "19", "cy": "12", "r": "1" }],
    ["circle", { "cx": "5", "cy": "12", "r": "1" }]
  ];
  Icon($$renderer, spread_props([
    { name: "ellipsis" },
    $$sanitized_props,
    {
      /**
       * @component @name Ellipsis
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxIiAvPgogIDxjaXJjbGUgY3g9IjE5IiBjeT0iMTIiIHI9IjEiIC8+CiAgPGNpcmNsZSBjeD0iNSIgY3k9IjEyIiByPSIxIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/ellipsis
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
function Grip_vertical($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.468.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    ["circle", { "cx": "9", "cy": "12", "r": "1" }],
    ["circle", { "cx": "9", "cy": "5", "r": "1" }],
    ["circle", { "cx": "9", "cy": "19", "r": "1" }],
    ["circle", { "cx": "15", "cy": "12", "r": "1" }],
    ["circle", { "cx": "15", "cy": "5", "r": "1" }],
    ["circle", { "cx": "15", "cy": "19", "r": "1" }]
  ];
  Icon($$renderer, spread_props([
    { name: "grip-vertical" },
    $$sanitized_props,
    {
      /**
       * @component @name GripVertical
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSI5IiBjeT0iMTIiIHI9IjEiIC8+CiAgPGNpcmNsZSBjeD0iOSIgY3k9IjUiIHI9IjEiIC8+CiAgPGNpcmNsZSBjeD0iOSIgY3k9IjE5IiByPSIxIiAvPgogIDxjaXJjbGUgY3g9IjE1IiBjeT0iMTIiIHI9IjEiIC8+CiAgPGNpcmNsZSBjeD0iMTUiIGN5PSI1IiByPSIxIiAvPgogIDxjaXJjbGUgY3g9IjE1IiBjeT0iMTkiIHI9IjEiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/grip-vertical
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
function Inbox($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.468.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    [
      "polyline",
      { "points": "22 12 16 12 14 15 10 15 8 12 2 12" }
    ],
    [
      "path",
      {
        "d": "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"
      }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "inbox" },
    $$sanitized_props,
    {
      /**
       * @component @name Inbox
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cG9seWxpbmUgcG9pbnRzPSIyMiAxMiAxNiAxMiAxNCAxNSAxMCAxNSA4IDEyIDIgMTIiIC8+CiAgPHBhdGggZD0iTTUuNDUgNS4xMSAyIDEydjZhMiAyIDAgMCAwIDIgMmgxNmEyIDIgMCAwIDAgMi0ydi02bC0zLjQ1LTYuODlBMiAyIDAgMCAwIDE2Ljc2IDRINy4yNGEyIDIgMCAwIDAtMS43OSAxLjExeiIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/inbox
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
function Layout_grid($$renderer, $$props) {
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
      { "width": "7", "height": "7", "x": "3", "y": "3", "rx": "1" }
    ],
    [
      "rect",
      { "width": "7", "height": "7", "x": "14", "y": "3", "rx": "1" }
    ],
    [
      "rect",
      { "width": "7", "height": "7", "x": "14", "y": "14", "rx": "1" }
    ],
    [
      "rect",
      { "width": "7", "height": "7", "x": "3", "y": "14", "rx": "1" }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "layout-grid" },
    $$sanitized_props,
    {
      /**
       * @component @name LayoutGrid
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cmVjdCB3aWR0aD0iNyIgaGVpZ2h0PSI3IiB4PSIzIiB5PSIzIiByeD0iMSIgLz4KICA8cmVjdCB3aWR0aD0iNyIgaGVpZ2h0PSI3IiB4PSIxNCIgeT0iMyIgcng9IjEiIC8+CiAgPHJlY3Qgd2lkdGg9IjciIGhlaWdodD0iNyIgeD0iMTQiIHk9IjE0IiByeD0iMSIgLz4KICA8cmVjdCB3aWR0aD0iNyIgaGVpZ2h0PSI3IiB4PSIzIiB5PSIxNCIgcng9IjEiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/layout-grid
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
function List($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.468.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    ["path", { "d": "M3 12h.01" }],
    ["path", { "d": "M3 18h.01" }],
    ["path", { "d": "M3 6h.01" }],
    ["path", { "d": "M8 12h13" }],
    ["path", { "d": "M8 18h13" }],
    ["path", { "d": "M8 6h13" }]
  ];
  Icon($$renderer, spread_props([
    { name: "list" },
    $$sanitized_props,
    {
      /**
       * @component @name List
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMyAxMmguMDEiIC8+CiAgPHBhdGggZD0iTTMgMThoLjAxIiAvPgogIDxwYXRoIGQ9Ik0zIDZoLjAxIiAvPgogIDxwYXRoIGQ9Ik04IDEyaDEzIiAvPgogIDxwYXRoIGQ9Ik04IDE4aDEzIiAvPgogIDxwYXRoIGQ9Ik04IDZoMTMiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/list
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
function Trophy($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.468.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    ["path", { "d": "M6 9H4.5a2.5 2.5 0 0 1 0-5H6" }],
    ["path", { "d": "M18 9h1.5a2.5 2.5 0 0 0 0-5H18" }],
    ["path", { "d": "M4 22h16" }],
    [
      "path",
      {
        "d": "M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"
      }
    ],
    [
      "path",
      {
        "d": "M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"
      }
    ],
    ["path", { "d": "M18 2H6v7a6 6 0 0 0 12 0V2Z" }]
  ];
  Icon($$renderer, spread_props([
    { name: "trophy" },
    $$sanitized_props,
    {
      /**
       * @component @name Trophy
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNNiA5SDQuNWEyLjUgMi41IDAgMCAxIDAtNUg2IiAvPgogIDxwYXRoIGQ9Ik0xOCA5aDEuNWEyLjUgMi41IDAgMCAwIDAtNUgxOCIgLz4KICA8cGF0aCBkPSJNNCAyMmgxNiIgLz4KICA8cGF0aCBkPSJNMTAgMTQuNjZWMTdjMCAuNTUtLjQ3Ljk4LS45NyAxLjIxQzcuODUgMTguNzUgNyAyMC4yNCA3IDIyIiAvPgogIDxwYXRoIGQ9Ik0xNCAxNC42NlYxN2MwIC41NS40Ny45OC45NyAxLjIxQzE2LjE1IDE4Ljc1IDE3IDIwLjI0IDE3IDIyIiAvPgogIDxwYXRoIGQ9Ik0xOCAySDZ2N2E2IDYgMCAwIDAgMTIgMFYyWiIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/trophy
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
function Zap($$renderer, $$props) {
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
        "d": "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"
      }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "zap" },
    $$sanitized_props,
    {
      /**
       * @component @name Zap
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNNCAxNGExIDEgMCAwIDEtLjc4LTEuNjNsOS45LTEwLjJhLjUuNSAwIDAgMSAuODYuNDZsLTEuOTIgNi4wMkExIDEgMCAwIDAgMTMgMTBoN2ExIDEgMCAwIDEgLjc4IDEuNjNsLTkuOSAxMC4yYS41LjUgMCAwIDEtLjg2LS40NmwxLjkyLTYuMDJBMSAxIDAgMCAwIDExIDE0eiIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/zap
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
const CATEGORY_SCORES = {
  diet: 0.9,
  nutrition: 0.9,
  food: 0.9,
  sleep: 0.85,
  rest: 0.85,
  quit: 0.95,
  abstinence: 0.95,
  exercise: 0.6,
  fitness: 0.6,
  sport: 0.6,
  workout: 0.6,
  meditation: 0.55,
  mindfulness: 0.55,
  reading: 0.4,
  learning: 0.4,
  study: 0.4,
  hydration: 0.15,
  water: 0.15,
  medication: 0.1,
  vitamins: 0.1,
  supplements: 0.1,
  journal: 0.35,
  social: 0.5,
  cleaning: 0.45,
  organization: 0.45
};
function scoreTimeFactor(reminderTime) {
  if (!reminderTime) return 0.3;
  const hour = parseInt(reminderTime.split(":")[0] ?? "12", 10);
  if (hour >= 5 && hour < 12) return 0;
  if (hour >= 12 && hour < 17) return 0.3;
  if (hour >= 17 && hour < 22) return 0.6;
  return 0.9;
}
function scoreCategoryFactor(tags) {
  const lower = (tags ?? []).map((t) => t.toLowerCase());
  for (const [keyword, score] of Object.entries(CATEGORY_SCORES)) {
    if (lower.some((tag) => tag.includes(keyword))) return score;
  }
  return 0.5;
}
function scoreMissFactor(habit, today) {
  const schedule = resolveHabitSchedule(habit);
  const dailyTarget = Math.max(1, habit.dailyTarget ?? 1);
  for (let i = 1; i <= 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = toCompletionKey(date);
    const calendarDate = completionKeyToCalendarDate(key);
    if (!isScheduledForDate(schedule, calendarDate) || habit.freezeDays?.includes(calendarDate)) continue;
    const count = habit.completions[key] ?? 0;
    const isSuccess = habit.type === "negative" ? count === 0 : count >= dailyTarget;
    if (!isSuccess) {
      if (i <= 3) return 1;
      if (i <= 7) return 0.7;
      if (i <= 14) return 0.4;
      return 0.1;
    }
  }
  return 0;
}
function scoreVarianceFactor(habit, today) {
  const schedule = resolveHabitSchedule(habit);
  const dailyTarget = Math.max(1, habit.dailyTarget ?? 1);
  const bits = [];
  for (let i = 1; i <= 60; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = toCompletionKey(date);
    const calendarDate = completionKeyToCalendarDate(key);
    if (!isScheduledForDate(schedule, calendarDate) || habit.freezeDays?.includes(calendarDate)) continue;
    const count = habit.completions[key] ?? 0;
    bits.push(habit.type === "negative" ? count === 0 ? 1 : 0 : count >= dailyTarget ? 1 : 0);
  }
  if (bits.length < 3) return 0.5;
  const mean = bits.reduce((a, b) => a + b, 0) / bits.length;
  const variance = bits.reduce((a, b) => a + (b - mean) ** 2, 0) / bits.length;
  return Math.min(variance / 0.25, 1);
}
function calculateSmartScore(habit, today) {
  const habitAgeDays = Math.max(0, (today.getTime() - new Date(habit.createdAt).getTime()) / 864e5);
  const ageFactor = 1 - Math.min(habitAgeDays / 66, 1);
  const completionRate = calculateScheduledCompletionRate(habit, habit.completions, today) / 100;
  const completionFactor = 1 - completionRate;
  const { current: currentStreak } = calculateScheduledStreak(habit, habit.completions, today);
  const streakFactor = 1 - Math.min(currentStreak / 66, 1);
  const missFactor = scoreMissFactor(habit, today);
  const timeFactor = scoreTimeFactor(habit.reminderTime);
  const typeFactor = habit.type === "negative" ? 0.3 : 0;
  const categoryFactor = scoreCategoryFactor(habit.tags);
  const varianceFactor = scoreVarianceFactor(habit, today);
  return ageFactor * 0.2 + completionFactor * 0.25 + streakFactor * 0.15 + missFactor * 0.15 + timeFactor * 0.05 + typeFactor * 0.05 + categoryFactor * 0.05 + varianceFactor * 0.02;
}
function passesBasicFilters(habit, filter, searchQuery) {
  if (filter === "archived") {
    if (!habit.archived) return false;
  } else if (habit.archived) return false;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    if (!habit.name.toLowerCase().includes(q) && !(habit.description?.toLowerCase().includes(q) ?? false)) return false;
  }
  return true;
}
function sortHabits(a, b, sortMode, today) {
  if (sortMode === "custom") return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  const aDueToday = isMandatoryToday(a, today);
  const bDueToday = isMandatoryToday(b, today);
  if (aDueToday !== bDueToday) return aDueToday ? -1 : 1;
  return calculateSmartScore(b, today) - calculateSmartScore(a, today);
}
function filterAndSortHabits(habits, filter, selectedTags, today, sortMode, searchQuery) {
  const todayKey = formatDate(today);
  return habits.filter((habit) => {
    if (selectedTags.length > 0 && !(habit.tags || []).some((tag) => selectedTags.includes(tag))) return false;
    if (!passesBasicFilters(habit, filter, searchQuery)) return false;
    const mandatoryToday = isMandatoryToday(habit, today);
    const completedToday = (habit.completions[todayKey] ?? 0) >= Math.max(1, habit.dailyTarget ?? 1);
    if (filter === "pending") return mandatoryToday && !completedToday;
    if (filter === "done") return mandatoryToday && completedToday;
    return true;
  }).sort((a, b) => sortHabits(a, b, sortMode, today));
}
function calculateOverallStreak(habits) {
  let streak = 0;
  const cursor = /* @__PURE__ */ new Date();
  cursor.setDate(cursor.getDate() - 1);
  cursor.setHours(0, 0, 0, 0);
  for (let i = 0; i < 30; i++) {
    const key = formatDate(cursor);
    const allDone = habits.every((habit) => {
      if (habit.freezeDays?.includes(completionKeyToCalendarDate(key))) return true;
      if (!isMandatoryToday(habit, cursor)) return true;
      if (habit.type === "negative") return (habit.completions[key] ?? 0) === 0;
      return (habit.completions[key] ?? 0) >= Math.max(1, habit.dailyTarget ?? 1);
    });
    if (allDone) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else break;
  }
  return streak;
}
function getAllTags(habits) {
  const tags = /* @__PURE__ */ new Set();
  habits.forEach((h) => (h.tags || []).forEach((t) => tags.add(t)));
  return Array.from(tags).sort();
}
function exportHabitsCsv(habits) {
  if (typeof document === "undefined" || habits.length === 0) return;
  const escapeCsv = (value) => `"${value.replace(/"/g, '""')}"`;
  const rows = [];
  habits.forEach((habit) => {
    Object.entries(habit.completions).forEach(([date, count]) => {
      if (count > 0) rows.push([date, escapeCsv(habit.name), "1"].join(","));
    });
  });
  const csv = ["Date,Habit Name,Completed", ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `habits-export-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
function DashboardHero($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      dateStr,
      todayRate,
      completedToday,
      totalActive,
      overallStreak,
      daysSinceLastCompletion,
      onExport,
      heroCollapsed = false
    } = $$props;
    let menuOpen = false;
    const remaining = derived(() => totalActive - completedToday);
    const motivationText = derived(() => {
      if (todayRate >= 100) return null;
      if (todayRate >= 50) return `Almost there - ${remaining()} left!`;
      if (todayRate > 0) return `Keep going - ${remaining()} to go`;
      return "Start your streak";
    });
    const showComebackBanner = derived(() => daysSinceLastCompletion >= 2 && todayRate < 100);
    $$renderer2.push(`<section class="border-b border-border bg-bg-primary"><div class="px-4 py-3" style="padding-top: calc(var(--safe-area-inset-top, 0px) + 1rem)"><div class="max-w-2xl mx-auto flex items-center justify-between"><div><div class="mb-1 flex items-center gap-2"><p class="text-[11px] font-mono text-muted uppercase tracking-widest">${escape_html(dateStr)}</p> `);
    ChartGuideTooltip($$renderer2, {
      title: "Today snapshot",
      variant: "bars"
    });
    $$renderer2.push(`<!----></div> <div class="flex items-center gap-3">`);
    CompletionRing($$renderer2, { size: 28, strokeWidth: 3.5, percentage: todayRate });
    $$renderer2.push(`<!----> <div class="text-[12px] font-semibold text-foreground">${escape_html(completedToday)}/${escape_html(totalActive || 0)}</div> <div class="flex items-center gap-1 text-[12px] font-mono text-accent-secondary">`);
    Flame($$renderer2, { size: 14 });
    $$renderer2.push(`<!----> <span>${escape_html(overallStreak)}d</span></div></div></div> <div class="flex items-center gap-2"><div class="relative"><button type="button" class="w-9 h-9 rounded-xl border border-border bg-bg-secondary flex items-center justify-center transition hover:border-accent" aria-haspopup="true"${attr("aria-expanded", menuOpen)}>`);
    Ellipsis($$renderer2, { size: 18 });
    $$renderer2.push(`<!----></button> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> <button type="button" class="w-9 h-9 rounded-xl border border-border bg-bg-secondary flex items-center justify-center transition hover:border-accent"${attr("aria-label", heroCollapsed ? "Expand hero" : "Collapse hero")}>`);
    if (heroCollapsed) {
      $$renderer2.push("<!--[0-->");
      Chevron_down($$renderer2, { size: 16 });
    } else {
      $$renderer2.push("<!--[-1-->");
      Chevron_up($$renderer2, { size: 16 });
    }
    $$renderer2.push(`<!--]--></button></div></div></div> <div class="overflow-hidden transition-all duration-300"${attr_style(`max-height: ${stringify(heroCollapsed ? 0 : 1200)}px`)}${attr("aria-hidden", heroCollapsed)}><div class="px-4 pb-4"><div class="max-w-2xl mx-auto"><div class="flex items-center gap-5 mb-3">`);
    CompletionRing($$renderer2, { size: 88, strokeWidth: 7, percentage: todayRate });
    $$renderer2.push(`<!----> <div class="flex-1 flex flex-col gap-2">`);
    if (motivationText()) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p${attr_class(`text-xs font-mono ${stringify(todayRate >= 50 ? "text-accent-secondary" : "text-muted")} tracking-wide`)}>${escape_html(motivationText())}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="grid grid-cols-3 gap-2"><div class="bg-bg-card border border-border rounded-xl px-3 py-2"><div class="flex items-center gap-1.5 mb-1">`);
    Zap($$renderer2, { size: 10, class: "text-accent" });
    $$renderer2.push(`<!----> <span class="text-[10px] font-mono text-muted uppercase tracking-wider">Active</span></div> <span class="text-lg font-mono font-bold text-foreground">${escape_html(totalActive)}</span></div> <div class="bg-bg-card border border-border rounded-xl px-3 py-2"><div class="flex items-center gap-1.5 mb-1">`);
    Flame($$renderer2, { size: 10, class: "text-accent-secondary" });
    $$renderer2.push(`<!----> <span class="text-[10px] font-mono text-muted uppercase tracking-wider">Streak</span></div> <span class="text-lg font-mono font-bold text-accent-secondary">${escape_html(overallStreak)}d</span></div> <div class="bg-bg-card border border-border rounded-xl px-3 py-2"><div class="flex items-center gap-1.5 mb-1">`);
    Trending_up($$renderer2, { size: 10, class: "text-accent-secondary" });
    $$renderer2.push(`<!----> <span class="text-[10px] font-mono text-muted uppercase tracking-wider">Done</span></div> <span class="text-lg font-mono font-bold text-accent-secondary">${escape_html(completedToday)}</span></div></div></div></div> <div class="h-[3px] bg-border rounded-full overflow-hidden mb-3"><div${attr_class(`h-full rounded-full transition-all duration-700 ${stringify(todayRate >= 100 ? "animate-progress-glow" : "")}`)}${attr_style(`width: ${stringify(Math.min(todayRate, 100))}%; background: ${stringify(todayRate >= 100 ? "linear-gradient(90deg, var(--accent-secondary), var(--accent))" : "linear-gradient(90deg, var(--accent), var(--accent-secondary))")}; box-shadow: 0 0 8px var(--glow)`)}></div></div> `);
    if (showComebackBanner()) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="animate-comeback-slide mb-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-2.5 flex items-center gap-3"><span class="text-lg" role="img" aria-label="welcome back">👋</span> <div><p class="text-sm font-semibold text-foreground">Welcome back!</p> <p class="text-[11px] font-mono text-muted">You've been away for ${escape_html(daysSinceLastCompletion)} days. Let's start fresh today!</p></div></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (todayRate >= 100) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="animate-slide-down-fade mb-3 rounded-xl border border-accent-secondary/30 bg-accent-secondary/5 px-4 py-2.5 flex items-center gap-3"><span class="text-lg" role="img" aria-label="celebration">🎉</span> <div><p class="text-sm font-semibold text-foreground">Perfect day!</p> <p class="text-[11px] font-mono text-muted">All habits completed. Keep the streak alive!</p></div></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div></div></div></section>`);
    bind_props($$props, { heroCollapsed });
  });
}
function RemindersPanel($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      reminders,
      habits
    } = $$props;
    if (reminders.length > 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="max-w-2xl mx-auto px-4 py-3 space-y-2"><div class="flex items-center gap-2"><h2 class="text-xs font-mono text-muted uppercase tracking-wider">Reminders</h2> `);
      ChartGuideTooltip($$renderer2, {
        title: "Reminders",
        variant: "columns"
      });
      $$renderer2.push(`<!----></div> <!--[-->`);
      const each_array = ensure_array_like(reminders);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let reminder = each_array[$$index];
        const habit = habits.find((h) => h.id === reminder.habitId);
        if (habit) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="flex flex-col gap-2 rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3"><div class="flex items-center gap-2">`);
          Bell_ring($$renderer2, { size: 16, class: "text-accent-secondary" });
          $$renderer2.push(`<!----> <div class="text-sm font-semibold text-foreground">${escape_html(reminder.message)}</div> <span class="text-[10px] font-mono text-muted ml-auto">${escape_html(reminder.time)}</span></div> <div class="flex gap-2"><button type="button" class="flex-1 rounded-full border border-accent px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.3em] text-accent hover:bg-accent/10 transition-colors">Mark done</button> <button type="button" class="flex-1 rounded-full border border-border px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.3em] text-muted hover:text-foreground hover:border-border-hover transition-colors">Dismiss</button> <button type="button" class="flex-1 rounded-full border border-destructive px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.3em] text-destructive hover:bg-destructive/10 transition-colors">Disable</button></div></div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function FilterBar($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      filter = "all",
      allTags,
      selectedTags = [],
      habits,
      today,
      sortMode = "custom",
      viewDensity = "compact",
      searchQuery = ""
    } = $$props;
    const todayDate = derived(() => {
      const d = new Date(today);
      d.setHours(0, 0, 0, 0);
      return d;
    });
    const pendingCount = derived(() => habits.filter((h) => {
      if (h.archived) return false;
      if (!isMandatoryToday(h, todayDate())) return false;
      if (h.type === "negative") return (h.completions[today] ?? 0) !== 0;
      return (h.completions[today] ?? 0) < Math.max(1, h.dailyTarget ?? 1);
    }).length);
    const FILTERS = ["pending", "all", "done", "archived"];
    const SORT_MODES = [
      { value: "custom", label: "Custom" },
      { value: "smart", label: "Smart" }
    ];
    $$renderer2.push(`<div class="relative"><div class="absolute top-0 left-0 w-full h-px pointer-events-none" aria-hidden="true"></div> <div${attr_class(`sticky top-[calc(var(--safe-area-inset-top,0px))] z-[70] transition-shadow duration-200 ${stringify("")}`)}><div class="border-b border-border bg-bg-primary/95 backdrop-blur-sm px-4"><div class="max-w-2xl mx-auto"><div class="flex items-center gap-2 pt-3"><span class="text-[10px] font-mono text-muted uppercase tracking-wider">Dashboard filters</span> `);
    ChartGuideTooltip($$renderer2, {
      title: "Dashboard filters",
      variant: "columns"
    });
    $$renderer2.push(`<!----></div> <div class="flex gap-0 overflow-x-auto no-scrollbar"><!--[-->`);
    const each_array = ensure_array_like(FILTERS);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let value = each_array[$$index];
      $$renderer2.push(`<button type="button"${attr_class(`px-4 py-2.5 text-xs font-mono uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${stringify(filter === value ? "border-accent text-accent" : "border-transparent text-muted hover:text-foreground")}`)}>${escape_html(value)} `);
      if (value === "pending" && pendingCount() > 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<span class="ml-1.5 text-[9px] font-mono rounded px-1 py-0.5 border border-accent/40 bg-accent/10 text-accent">${escape_html(pendingCount())}</span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></button>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="flex items-center gap-2 py-3 border-t border-border/40"><div class="relative flex-1"><input type="text" placeholder="Search habits..."${attr("value", searchQuery)} class="w-full bg-bg-secondary border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent transition-all pl-10"/> <div class="absolute left-3 top-1/2 -translate-y-1/2 text-muted"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg></div> `);
    if (searchQuery) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<button class="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></button>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> <div class="flex items-center gap-1"><div class="flex items-center gap-1.5 p-0.5 bg-bg-secondary rounded-lg border border-border/50"><!--[-->`);
    const each_array_1 = ensure_array_like(SORT_MODES);
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let mode = each_array_1[$$index_1];
      $$renderer2.push(`<button type="button"${attr_class(`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all duration-200 ${stringify(sortMode === mode.value ? "bg-bg-primary text-accent shadow-sm ring-1 ring-border" : "text-muted hover:text-foreground")}`)}>`);
      if (mode.value === "custom") {
        $$renderer2.push("<!--[0-->");
        Grip_vertical($$renderer2, { size: 11 });
      } else {
        $$renderer2.push("<!--[-1-->");
        Sparkles($$renderer2, { size: 11 });
      }
      $$renderer2.push(`<!--]--> ${escape_html(mode.label)}</button>`);
    }
    $$renderer2.push(`<!--]--></div> `);
    ChartGuideTooltip($$renderer2, {
      title: "Smart Sort",
      variant: "columns"
    });
    $$renderer2.push(`<!----></div> <div class="flex items-center gap-1 bg-bg-secondary border border-border/50 rounded-lg p-0.5"><button type="button"${attr("aria-pressed", viewDensity === "comfortable")} aria-label="Grid view"${attr_class(`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${stringify(viewDensity === "comfortable" ? "bg-bg-primary border border-border/50 text-foreground shadow-sm" : "text-muted hover:text-foreground")}`)}>`);
    Layout_grid($$renderer2, { size: 16 });
    $$renderer2.push(`<!----></button> <button type="button"${attr("aria-pressed", viewDensity === "compact")} aria-label="List view"${attr_class(`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${stringify(viewDensity === "compact" ? "bg-bg-primary border border-border/50 text-foreground shadow-sm" : "text-muted hover:text-foreground")}`)}>`);
    List($$renderer2, { size: 16 });
    $$renderer2.push(`<!----></button></div></div> <div class="py-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">`);
    if (allTags.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<span class="text-[10px] font-mono text-muted">No tags yet</span>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<!--[-->`);
      const each_array_2 = ensure_array_like(allTags);
      for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
        let tag = each_array_2[$$index_2];
        $$renderer2.push(`<button type="button"${attr_class(`text-[10px] font-mono px-2 py-1 rounded border whitespace-nowrap transition-colors ${stringify(selectedTags.includes(tag) ? "bg-accent/10 border-accent/30 text-accent" : "bg-bg-secondary border-border text-muted hover:text-foreground hover:border-border-hover")}`)}>#${escape_html(tag)}</button>`);
      }
      $$renderer2.push(`<!--]--> `);
      if (selectedTags.length > 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<button type="button" class="text-[10px] font-mono px-2 py-1 rounded border whitespace-nowrap bg-bg-secondary border-accent/30 text-accent hover:bg-accent/10 transition-colors">Clear tags</button>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div></div></div></div></div>`);
    bind_props($$props, { filter, selectedTags, sortMode, viewDensity, searchQuery });
  });
}
function MiniHeatmap($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { completions, dailyTarget = 1, color } = $$props;
    const today = /* @__PURE__ */ new Date();
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    const startDay = days[0].getDay();
    const emptyCells = Array.from({ length: startDay });
    const { hex, glow } = HABIT_COLOR_THEMES[color];
    $$renderer2.push(`<div class="grid grid-rows-7 grid-flow-col gap-[2px]"><!--[-->`);
    const each_array = ensure_array_like(emptyCells);
    for (let i = 0, $$length = each_array.length; i < $$length; i++) {
      each_array[i];
      $$renderer2.push(`<div class="w-[4px] h-[4px] rounded-[1px] bg-transparent"></div>`);
    }
    $$renderer2.push(`<!--]--> <!--[-->`);
    const each_array_1 = ensure_array_like(days);
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let date = each_array_1[$$index_1];
      const dateStr = formatDate(date);
      const isCompleted = (completions[dateStr] ?? 0) >= dailyTarget;
      $$renderer2.push(`<div class="w-[4px] h-[4px] rounded-[1px] transition-all duration-300"${attr_style(`background-color: ${stringify(isCompleted ? hex : "var(--border)")}; box-shadow: ${stringify(isCompleted ? `0 0 4px ${glow}` : "none")}; opacity: ${stringify(isCompleted ? 1 : 0.5)}`)}></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
function ToggleButton($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      completed,
      isFrozen,
      accent,
      toggleButtonClass,
      toggleButtonTitle,
      onToggle,
      streak,
      sizeClass = "w-8 h-8",
      todayCount,
      dailyTarget
    } = $$props;
    let particles = [];
    const safeDailyTarget = derived(() => Math.max(1, dailyTarget));
    const cappedTodayCount = derived(() => Math.min(Math.max(todayCount, 0), safeDailyTarget()));
    const showProgress = derived(() => safeDailyTarget() > 1);
    const progressRatio = derived(() => cappedTodayCount() / safeDailyTarget());
    $$renderer2.push(`<div class="relative flex-shrink-0"><!--[-->`);
    const each_array = ensure_array_like(particles);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let p = each_array[$$index];
      $$renderer2.push(`<span class="confetti-particle"${attr_style(`--tx: ${stringify(p.tx)}px; --ty: ${stringify(p.ty)}px; background: ${stringify(p.color)}; left: 50%; top: 50%; margin-left: -3px; margin-top: -3px`)}></span>`);
    }
    $$renderer2.push(`<!--]--> <button type="button"${attr("disabled", isFrozen, true)}${attr_class(`${stringify(sizeClass)} rounded-xl border-[1.5px] flex items-center justify-center transition-all duration-200 relative ${stringify(toggleButtonClass)} ${stringify("")} ${stringify(isFrozen ? "cursor-not-allowed opacity-60" : "")}`)}${attr_style(completed && !isFrozen ? `box-shadow: 0 0 12px ${accent.glow}` : "")}${attr("aria-label", toggleButtonTitle)}${attr("title", toggleButtonTitle)}>`);
    if (showProgress()) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<span class="absolute inset-[2px] rounded-[10px] pointer-events-none overflow-hidden" aria-hidden="true"><span class="absolute inset-y-0 left-0 rounded-[8px] transition-all duration-200"${attr_style(`width: ${stringify(progressRatio() * 100)}%; background: linear-gradient(90deg, ${stringify(accent.hex)}88, ${stringify(accent.hex)})`)}></span></span> <span class="absolute inset-[5px] flex items-end gap-[2px] pointer-events-none z-0" aria-hidden="true"><!--[-->`);
      const each_array_1 = ensure_array_like(Array(safeDailyTarget()));
      for (let index = 0, $$length = each_array_1.length; index < $$length; index++) {
        each_array_1[index];
        $$renderer2.push(`<span class="h-full flex-1 rounded-full transition-colors duration-200"${attr_style(`background-color: ${stringify(index < cappedTodayCount() ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.18)")}; opacity: ${stringify(index < cappedTodayCount() ? 1 : 0.6)}`)}></span>`);
      }
      $$renderer2.push(`<!--]--></span>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (isFrozen) {
      $$renderer2.push("<!--[0-->");
      Snowflake($$renderer2, { size: 12, class: "opacity-70 text-muted" });
    } else if (completed) {
      $$renderer2.push("<!--[1-->");
      Check($$renderer2, {
        size: 14,
        class: `${stringify(accent.textClass)} relative z-10`,
        strokeWidth: 3
      });
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></button></div>`);
  });
}
function HabitRow($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      habit,
      onToggle,
      onDragStart,
      isDropTarget = false,
      isDragging = false,
      dropHintPosition = null,
      appearanceIndex = 0
    } = $$props;
    const todayKey = formatDate(/* @__PURE__ */ new Date());
    const todayDate = /* @__PURE__ */ new Date();
    todayDate.setHours(0, 0, 0, 0);
    const status = derived(() => getScheduleStatusForDate(habit, todayDate));
    const scheduledToday = derived(() => status() === "scheduled" && isMandatoryToday(habit, todayDate));
    const target = derived(() => Math.max(1, habit.dailyTarget ?? 1));
    const todayCount = derived(() => habit.completions[todayKey] ?? 0);
    const completed = derived(() => todayCount() >= target());
    const accent = derived(() => HABIT_COLOR_THEMES[habit.color]);
    const streakData = derived(() => calculateScheduledStreak(habit, habit.completions));
    const streak = derived(() => streakData().current);
    const completionRate = derived(() => calculateScheduledCompletionRate(habit, habit.completions));
    const isFrozen = derived(() => status() === "frozen");
    const last7 = derived(() => {
      return Array.from({ length: 7 }, (_, i) => {
        const cursor = /* @__PURE__ */ new Date();
        cursor.setDate(cursor.getDate() - (6 - i));
        return (habit.completions[formatDate(cursor)] ?? 0) >= target();
      });
    });
    const toggleButtonClass = derived(() => {
      if (completed()) return `${accent().bgClass} ${accent().borderClass}`;
      if (scheduledToday()) return "border-border-hover hover:border-muted";
      if (isFrozen()) return "border-border bg-bg-secondary text-muted";
      return "border border-dashed border-border/40 text-muted hover:border-border";
    });
    const toggleButtonTitle = derived(() => {
      if (scheduledToday()) return `Mark ${habit.name} as ${completed() ? "incomplete" : "complete"}`;
      if (isFrozen()) return "Frozen today";
      return `Manual completion for ${habit.name}`;
    });
    let swipeOffset = 0;
    const dropTransformClass = derived(() => dropHintPosition === "above" ? "-translate-y-2" : dropHintPosition === "below" ? "translate-y-2" : "");
    const dragTransformClass = derived(() => isDragging ? "opacity-50 scale-[0.97] shadow-2xl ring-2 ring-accent/40" : "");
    const animationDelayValue = derived(() => Math.min(Math.max(appearanceIndex, 0), 12) * 0.05);
    const indicatorOpacity = derived(() => Math.min(1, Math.abs(swipeOffset) / 120));
    const indicatorColor = derived(() => "transparent");
    const inlineTags = derived(() => habit.tags.slice(0, 3));
    const extraTagCount = derived(() => Math.max(0, habit.tags.length - inlineTags().length));
    const statusBadge = derived(() => {
      if (isFrozen()) return {
        label: "Frozen",
        tone: "text-accent-secondary",
        title: "Frozen today"
      };
      if (!scheduledToday()) return {
        label: "Not today",
        tone: "text-muted",
        title: "Not scheduled today"
      };
      return null;
    });
    $$renderer2.push(`<div${attr("data-habit-id", habit.id)}${attr("draggable", Boolean(onDragStart))}${attr("tabindex", 0)} role="listitem"${attr("aria-label", `${stringify(habit.name)}, ${stringify(completed() ? "completed" : "not completed")}`)}${attr_class(`relative flex items-stretch w-full transform px-2 py-1.5 ${stringify(dropTransformClass())} ${stringify(dragTransformClass())}`)}><div${attr_class(`habit-card-inner group z-0 flex items-stretch border rounded-xl overflow-hidden transition-all duration-200 cursor-pointer ${stringify(isDropTarget ? "border-accent/60 bg-accent/5" : "")} ${stringify(isFrozen() ? "bg-bg-card opacity-80 border-border/50" : "bg-bg-secondary border-border hover:border-border-hover")} animate-fade-slide-up active:scale-[0.98] active:shadow-sm`)}${attr_style(`animation-delay: ${stringify(animationDelayValue())}s; transform: translateX(${stringify(swipeOffset)}px); transition: ${stringify("transform 0.2s ease-out")}; touch-action: pan-y; will-change: transform; width: 100%`)}><span class="habit-card-swipe-indicator"${attr_style(`opacity: ${stringify(indicatorOpacity())}; background-color: ${stringify(indicatorColor())}`)}></span> <div class="relative z-10 flex items-center min-w-0 overflow-hidden flex-1"><div class="w-1 self-stretch flex-shrink-0 rounded-l-xl"${attr_style(`background: ${stringify(accent().hex)}`)} aria-hidden="true"></div> <div class="flex-1 flex items-center justify-between w-full px-2 py-2"><div class="flex items-center min-w-0 gap-2"><div class="flex items-center p-0.5 -mx-0.5 touch-none cursor-grab active:cursor-grabbing" aria-hidden="true">`);
    Grip_vertical($$renderer2, {
      size: 14,
      class: "text-muted/60 group-hover:text-muted transition-colors"
    });
    $$renderer2.push(`<!----></div> <div class="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-base"${attr_style(`background: ${stringify(accent().dim)}`)} aria-hidden="true">${escape_html(habit.icon)}</div> <div class="flex flex-col min-w-0 text-left overflow-hidden justify-center"><div class="flex items-center gap-1.5 min-w-0"><span${attr_class(`text-sm font-semibold ${stringify(completed() ? "text-muted line-through" : "text-foreground")} truncate`)}>${escape_html(habit.name)}</span> `);
    if (habit.description) {
      $$renderer2.push("<!--[0-->");
      DescriptionTooltip($$renderer2, { description: habit.description });
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (habit.dailyTarget && habit.dailyTarget > 1) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<span class="flex-shrink-0 text-[10px] font-mono font-medium px-1 py-0.5 rounded bg-accent/10 text-accent-secondary">×${escape_html(habit.dailyTarget)}</span>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (inlineTags().length > 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="hidden sm:flex items-center gap-1 flex-shrink-0"><!--[-->`);
      const each_array = ensure_array_like(inlineTags());
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let tag = each_array[$$index];
        $$renderer2.push(`<span class="text-[10px] font-mono px-1 py-0.5 rounded bg-accent/10 text-accent-secondary whitespace-nowrap">#${escape_html(tag)}</span>`);
      }
      $$renderer2.push(`<!--]--> `);
      if (extraTagCount() > 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<span class="text-[10px] font-mono px-1 py-0.5 rounded bg-accent/10 text-accent-secondary">+${escape_html(extraTagCount())}</span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    if (statusBadge()) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="flex items-center gap-2 mt-0.5"><span${attr_class(`flex items-center gap-1 flex-shrink-0 text-[10px] font-mono uppercase tracking-[0.3em] ${stringify(statusBadge().tone)}`)}${attr("aria-label", statusBadge().title)}>`);
      if (isFrozen()) {
        $$renderer2.push("<!--[0-->");
        Snowflake($$renderer2, { size: 10, class: "text-current" });
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> ${escape_html(statusBadge().label)}</span></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div></div> <div class="flex items-center gap-2 flex-shrink-0">`);
    ChartGuideTooltip($$renderer2, {
      title: `${stringify(habit.name)} row`,
      variant: "columns"
    });
    $$renderer2.push(`<!----> <div class="flex items-center gap-1.5 flex-shrink-0"><div class="flex items-center gap-0.5 w-10 sm:w-20 justify-end">`);
    if (streak() > 0) {
      $$renderer2.push("<!--[0-->");
      if (habit.type === "negative") {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<span class="hidden sm:inline flex items-center gap-0.5 text-[10px] font-mono text-accent-secondary whitespace-nowrap">`);
        Trophy($$renderer2, { size: 9, class: "inline-block flex-shrink-0" });
        $$renderer2.push(`<!---->${escape_html(streak())}d</span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        Flame($$renderer2, { size: 10, class: "text-accent-secondary flex-shrink-0" });
        $$renderer2.push(`<!----> <span class="text-[10px] font-mono text-accent-secondary">${escape_html(streak())}</span>`);
      }
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    CompletionRing($$renderer2, {
      percentage: completionRate(),
      size: 28,
      strokeWidth: 2.5,
      color: habit.color,
      showText: false
    });
    $$renderer2.push(`<!----> <div class="hidden sm:flex items-end gap-[1px] h-4 ml-0.5" aria-hidden="true"><!--[-->`);
    const each_array_1 = ensure_array_like(last7());
    for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
      let done = each_array_1[i];
      $$renderer2.push(`<div class="w-[4px] rounded-sm transition-all"${attr_style(`height: ${stringify(done ? "100%" : "30%")}; background-color: ${stringify(done ? accent().hex : "var(--border)")}; opacity: ${stringify(i === 6 ? 1 : 0.5 + i * 0.07)}`)}></div>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="hidden lg:flex items-center justify-end ml-1" aria-hidden="true">`);
    MiniHeatmap($$renderer2, {
      completions: habit.completions,
      dailyTarget: target(),
      color: habit.color
    });
    $$renderer2.push(`<!----></div></div> `);
    ToggleButton($$renderer2, {
      completed: completed(),
      isFrozen: isFrozen(),
      accent: accent(),
      toggleButtonClass: toggleButtonClass(),
      toggleButtonTitle: toggleButtonTitle(),
      onToggle,
      streak: streak(),
      todayCount: todayCount(),
      dailyTarget: target()
    });
    $$renderer2.push(`<!----></div></div></div></div></div>`);
  });
}
function getHabitAgeDays(habit) {
  return Math.floor((Date.now() - new Date(habit.createdAt).getTime()) / (1e3 * 60 * 60 * 24));
}
function getCompletionCount(habit, target, daysAgo, windowDays) {
  const today = /* @__PURE__ */ new Date();
  let count = 0;
  for (let i = daysAgo; i < daysAgo + windowDays; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = toCompletionKey(d);
    if ((habit.completions[key] ?? 0) >= target) count++;
  }
  return count;
}
function computeTileHint(habit, completionRate, streak) {
  const target = Math.max(1, habit.dailyTarget ?? 1);
  const habitAgeDays = getHabitAgeDays(habit);
  if (habitAgeDays < 7) {
    return streak > 0 ? { iconName: "sprout", text: `Day ${streak} — great start!`, type: "good" } : { iconName: "sprout", text: "New habit — start today!", type: "tip" };
  }
  const recent7 = getCompletionCount(habit, target, 0, 7);
  const canComparePrev = habitAgeDays >= 14;
  const prev7 = canComparePrev ? getCompletionCount(habit, target, 7, 7) : 0;
  const weekTrend = canComparePrev ? recent7 - prev7 : 0;
  if (completionRate >= 80 && streak >= 5) return { iconName: "check-circle-2", text: "On track — great consistency", type: "good" };
  if (weekTrend >= 3) return { iconName: "trending-up", text: "Trending up this week", type: "good" };
  if (weekTrend <= -3 && recent7 < 3) return { iconName: "trending-down", text: "Losing momentum — stay consistent", type: "warn" };
  if (streak === 0 && completionRate > 20) return { iconName: "alert-triangle", text: "Restart your streak today", type: "warn" };
  if (habitAgeDays >= 30 && completionRate < 40) return { iconName: "lightbulb", text: "Try adjusting schedule or goal", type: "tip" };
  return null;
}
function HabitTile($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { habit, onToggle, appearanceIndex = 0 } = $$props;
    const todayKey = formatDate(/* @__PURE__ */ new Date());
    const todayDate = /* @__PURE__ */ new Date();
    todayDate.setHours(0, 0, 0, 0);
    const status = derived(() => getScheduleStatusForDate(habit, todayDate));
    const scheduledToday = derived(() => status() === "scheduled" && isMandatoryToday(habit, todayDate));
    const target = derived(() => Math.max(1, habit.dailyTarget ?? 1));
    const todayCount = derived(() => habit.completions[todayKey] ?? 0);
    const completed = derived(() => todayCount() >= target());
    const accent = derived(() => HABIT_COLOR_THEMES[habit.color]);
    const streakData = derived(() => calculateScheduledStreak(habit, habit.completions));
    const streak = derived(() => streakData().current);
    const completionRate = derived(() => calculateScheduledCompletionRate(habit, habit.completions));
    const isFrozen = derived(() => status() === "frozen");
    const hint = derived(() => computeTileHint(habit, streak(), completionRate(), isFrozen()));
    const automatismScore = derived(() => habit.automatismScore ?? 0);
    const automatismLevel = derived(() => getAutomatismLevel(automatismScore()));
    const automatismMessage = derived(() => getAutomatismMessage(automatismLevel()));
    const automatismColor = derived(() => getAutomatismColor(automatismLevel()));
    const toggleButtonClass = derived(() => {
      if (completed()) return `${accent().bgClass} ${accent().borderClass}`;
      if (scheduledToday()) return "border-border-hover hover:border-muted";
      if (isFrozen()) return "border-border bg-bg-secondary text-muted";
      return "border border-dashed border-border/40 text-muted hover:border-border";
    });
    const toggleButtonTitle = derived(() => {
      if (scheduledToday()) return `Mark ${habit.name} as ${completed() ? "incomplete" : "complete"}`;
      if (isFrozen()) return "Frozen today";
      return `Manual completion for ${habit.name}`;
    });
    const animationDelayValue = derived(() => Math.min(Math.max(appearanceIndex, 0), 12) * 0.05);
    $$renderer2.push(`<div${attr_class(`group relative animate-fade-slide-up cursor-pointer rounded-2xl border transition-all hover:shadow-md ${stringify(completed() ? "bg-bg-card border-border/50" : "bg-bg-secondary border-border hover:border-border-hover")}`)}${attr_style(`animation-delay: ${stringify(animationDelayValue())}s`)} role="listitem"${attr("tabindex", 0)}><div class="absolute top-0 left-6 right-6 h-[2px] rounded-b-full"${attr_style(`background: linear-gradient(90deg, ${stringify(accent().hex)}, ${stringify(accent().glow)})`)} aria-hidden="true"></div> <div class="p-4"><div class="flex items-center justify-between mb-3"><div class="flex items-center gap-2.5 min-w-0"><div class="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl"${attr_style(`background: ${stringify(accent().dim)}`)} aria-hidden="true">${escape_html(habit.icon)}</div> <div class="min-w-0"><h3${attr_class(`text-sm font-semibold truncate ${stringify(completed() ? "text-muted line-through" : "text-foreground")}`)}>${escape_html(habit.name)}</h3> <div class="flex items-center gap-2 mt-0.5">`);
    if (isFrozen()) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<span class="text-[10px] font-mono uppercase tracking-wide text-accent-secondary flex items-center gap-1">`);
      Snowflake($$renderer2, { size: 10 });
      $$renderer2.push(`<!----> Frozen</span>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (streak() > 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<span class="text-[10px] font-mono text-accent-secondary flex items-center gap-0.5">`);
      Flame($$renderer2, { size: 10 });
      $$renderer2.push(`<!----> ${escape_html(streak())}d</span>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div></div></div> `);
    ToggleButton($$renderer2, {
      completed: completed(),
      isFrozen: isFrozen(),
      accent: accent(),
      toggleButtonClass: toggleButtonClass(),
      toggleButtonTitle: toggleButtonTitle(),
      onToggle,
      streak: streak(),
      todayCount: todayCount(),
      dailyTarget: target(),
      sizeClass: "w-10 h-10"
    });
    $$renderer2.push(`<!----></div> <div class="flex items-center gap-3 mb-3">`);
    CompletionRing($$renderer2, {
      percentage: completionRate(),
      size: 40,
      strokeWidth: 3.5,
      color: habit.color
    });
    $$renderer2.push(`<!----> <div class="flex-1"><div class="text-xs font-mono text-muted mb-1">${escape_html(Math.round(completionRate()))}% completion</div> <div class="h-1 bg-border rounded-full overflow-hidden"><div class="h-full rounded-full transition-all duration-500"${attr_style(`width: ${stringify(completionRate())}%; background: ${stringify(accent().hex)}`)}></div></div></div></div> `);
    if (automatismScore() > 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="mb-3"><div class="flex items-center justify-between mb-1"><span class="text-[10px] font-mono text-muted uppercase tracking-wide">Automatism</span> <span class="text-[10px] font-mono"${attr_style(`color: ${stringify(automatismColor())}`)}>${escape_html(automatismMessage())}</span></div> <div class="h-1 bg-border rounded-full overflow-hidden"><div class="h-full rounded-full transition-all duration-500"${attr_style(`width: ${stringify(automatismScore())}%; background: ${stringify(automatismColor())}`)}></div></div></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (hint()) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="text-[11px] font-mono text-muted flex items-center gap-1.5 mt-1"><span class="flex-shrink-0" aria-hidden="true">💡</span> <span class="truncate">${escape_html(hint().text)}</span></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (habit.tags.length > 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="flex flex-wrap gap-1 mt-2.5"><!--[-->`);
      const each_array = ensure_array_like(habit.tags.slice(0, 3));
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let tag = each_array[$$index];
        $$renderer2.push(`<span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent/10 text-accent-secondary">#${escape_html(tag)}</span>`);
      }
      $$renderer2.push(`<!--]--> `);
      if (habit.tags.length > 3) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent/10 text-accent-secondary">+${escape_html(habit.tags.length - 3)}</span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div></div>`);
  });
}
function HabitListSection($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      filteredHabits,
      filter,
      viewDensity,
      sortMode,
      draggedHabitId,
      dragOverHabitId,
      dropHintPosition,
      onToggle,
      onDragStart
    } = $$props;
    const FILTER_EMPTY = {
      pending: {
        icon: Calendar,
        title: "All done for now",
        subtitle: "Nothing left pending today"
      },
      all: {
        icon: Inbox,
        title: "No habits yet",
        subtitle: "Create your first habit to get started"
      },
      done: {
        icon: Calendar,
        title: "Nothing completed today",
        subtitle: "Complete a habit and it will appear here"
      },
      archived: {
        icon: Archive,
        title: "No archived habits",
        subtitle: "Archived habits will appear here"
      }
    };
    const emptyInfo = derived(() => FILTER_EMPTY[filter]);
    const groupByTag = derived(() => filter === "all" && sortMode === "custom");
    const groups = derived(() => {
      if (!groupByTag() || filteredHabits.length === 0) return [{ tag: null, habits: filteredHabits }];
      const tagMap = /* @__PURE__ */ new Map();
      const untagged = [];
      for (const h of filteredHabits) {
        if (h.tags.length === 0) {
          untagged.push(h);
          continue;
        }
        const first = h.tags[0];
        if (!tagMap.has(first)) tagMap.set(first, []);
        tagMap.get(first).push(h);
      }
      const result = [];
      for (const [tag, habits] of tagMap) result.push({ tag, habits });
      if (untagged.length > 0) result.push({ tag: null, habits: untagged });
      return result;
    });
    $$renderer2.push(`<div class="max-w-2xl mx-auto px-4 pt-4 pb-32">`);
    if (filteredHabits.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="flex flex-col items-center justify-center py-16 text-center animate-fade-slide-up"><div class="w-14 h-14 rounded-2xl border border-border bg-bg-secondary flex items-center justify-center mb-3">`);
      if (emptyInfo().icon) {
        $$renderer2.push("<!--[-->");
        emptyInfo().icon($$renderer2, { size: 24, class: "text-muted" });
        $$renderer2.push("<!--]-->");
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push("<!--]-->");
      }
      $$renderer2.push(`</div> <p class="text-sm font-semibold text-foreground mb-1">${escape_html(emptyInfo().title)}</p> <p class="text-xs font-mono text-muted mb-4">${escape_html(emptyInfo().subtitle)}</p> `);
      if (filter === "all") {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<button type="button" class="px-4 py-2 rounded-xl border border-accent bg-accent/10 text-accent text-xs font-mono uppercase tracking-wider hover:bg-accent/20 transition-colors flex items-center gap-1.5">`);
        Plus($$renderer2, { size: 14 });
        $$renderer2.push(`<!----> Add first habit</button>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<!--[-->`);
      const each_array = ensure_array_like(groups());
      for (let $$index_2 = 0, $$length = each_array.length; $$index_2 < $$length; $$index_2++) {
        let group = each_array[$$index_2];
        if (groupByTag() && group.tag) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="mb-2 mt-4 first:mt-0"><h3 class="text-[10px] font-mono text-muted uppercase tracking-widest px-2">#${escape_html(group.tag)}</h3></div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (viewDensity === "comfortable") {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="grid grid-cols-1 sm:grid-cols-2 gap-3"><!--[-->`);
          const each_array_1 = ensure_array_like(group.habits);
          for (let index = 0, $$length2 = each_array_1.length; index < $$length2; index++) {
            let habit = each_array_1[index];
            HabitTile($$renderer2, {
              habit,
              onToggle: () => onToggle(habit),
              appearanceIndex: index
            });
          }
          $$renderer2.push(`<!--]--></div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
          $$renderer2.push(`<div role="list" class="space-y-0.5"><!--[-->`);
          const each_array_2 = ensure_array_like(group.habits);
          for (let index = 0, $$length2 = each_array_2.length; index < $$length2; index++) {
            let habit = each_array_2[index];
            HabitRow($$renderer2, {
              habit,
              onToggle: () => onToggle(habit),
              onDragStart: (e) => onDragStart(habit, e),
              isDragging: draggedHabitId === habit.id,
              isDropTarget: dragOverHabitId === habit.id,
              dropHintPosition: dragOverHabitId === habit.id ? dropHintPosition : null,
              appearanceIndex: index
            });
          }
          $$renderer2.push(`<!--]--></div>`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
function Onboarding($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="fixed inset-0 z-50 flex items-center justify-center bg-bg/90 backdrop-blur-sm p-4"><div class="w-full max-w-md rounded-2xl border border-border bg-bg-card p-6 shadow-2xl"><div class="flex items-center justify-between mb-4"><h2 class="text-base font-semibold text-foreground">Welcome to Habbit Runner</h2> <button type="button" class="text-muted hover:text-foreground text-lg leading-none" aria-label="Close">×</button></div> <div class="space-y-4"><div class="flex items-start gap-3"><div class="flex-shrink-0 w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-sm font-bold text-accent">1</div> <div><p class="text-sm font-semibold text-foreground">Pick a habit</p> <p class="text-xs text-muted">Choose something small that matters to you.</p></div></div> <div class="flex items-start gap-3"><div class="flex-shrink-0 w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-sm font-bold text-accent">2</div> <div><p class="text-sm font-semibold text-foreground">Track daily</p> <p class="text-xs text-muted">Tap to mark each day done. Build your streak.</p></div></div> <div class="flex items-start gap-3"><div class="flex-shrink-0 w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-sm font-bold text-accent">3</div> <div><p class="text-sm font-semibold text-foreground">Celebrate progress</p> <p class="text-xs text-muted">Watch the streaks and stats grow over time.</p></div></div></div> <div class="mt-6 border-t border-border pt-4"><p class="text-xs font-semibold text-muted mb-2">Quick start templates</p> <div class="grid grid-cols-3 gap-2"><button type="button" class="rounded-lg border border-border bg-bg-card px-2 py-2 text-center text-xs hover:border-accent/40 transition-colors"><span class="text-base">🧘</span> <p class="mt-1 text-[10px] text-muted">Morning stretch</p></button> <button type="button" class="rounded-lg border border-border bg-bg-card px-2 py-2 text-center text-xs hover:border-accent/40 transition-colors"><span class="text-base">💧</span> <p class="mt-1 text-[10px] text-muted">Hydration</p></button> <button type="button" class="rounded-lg border border-border bg-bg-card px-2 py-2 text-center text-xs hover:border-accent/40 transition-colors"><span class="text-base">📖</span> <p class="mt-1 text-[10px] text-muted">Focus time</p></button></div></div> <button type="button" class="mt-5 w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-bg transition-all hover:opacity-90 active:scale-[0.98]">Got it, let's go</button></div></div>`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function Dashboard($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let filter = "all";
    let searchQuery = "";
    let selectedTags = [];
    let sortMode = "custom";
    let viewDensity = "compact";
    let heroCollapsed = false;
    let reminders = [];
    let draggedHabitId = null;
    let dragOverHabitId = null;
    let dropHintPosition = null;
    const habits = derived(() => store_get($$store_subs ??= {}, "$habitsStore", habitsStore));
    const today = derived(() => formatDate(/* @__PURE__ */ new Date()));
    const todayDate = derived(() => {
      const d = /* @__PURE__ */ new Date();
      d.setHours(0, 0, 0, 0);
      return d;
    });
    const activeHabits = derived(() => habits().filter((h) => !h.archived));
    const totalActive = derived(() => activeHabits().filter((h) => isMandatoryToday(h, todayDate())).length);
    const completedToday = derived(() => activeHabits().filter((h) => {
      if (!isMandatoryToday(h, todayDate())) return false;
      const target = Math.max(1, h.dailyTarget ?? 1);
      return (h.completions[today()] ?? 0) >= target;
    }).length);
    const todayRate = derived(() => totalActive() > 0 ? Math.round(completedToday() / totalActive() * 100) : 0);
    const overallStreak = derived(() => calculateOverallStreak(habits()));
    const daysSinceLastCompletion = derived(() => {
      let min = Infinity;
      for (const h of activeHabits()) {
        const keys = Object.keys(h.completions).filter((k) => (h.completions[k] ?? 0) > 0).sort().reverse();
        if (keys.length > 0) {
          const diff = Math.floor((Date.now() - new Date(keys[0]).getTime()) / 864e5);
          if (diff < min) min = diff;
        }
      }
      return min === Infinity ? 0 : min;
    });
    const allTags = derived(() => getAllTags(habits()));
    const allCheckins = derived(() => {
      const merged = {};
      for (const h of habits()) {
        for (const [k, v] of Object.entries(h.completions)) {
          merged[k] = (merged[k] ?? 0) + v;
        }
      }
      return merged;
    });
    const filteredHabits = derived(() => filterAndSortHabits(habits(), filter, searchQuery, selectedTags, sortMode, today()));
    const dateStr = derived(() => (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }));
    const showOnboarding = derived(() => habits().length === 0);
    async function handleToggle(habit) {
      const result = await toggleCompletion(habit.id, today());
      if (result?.undo) {
        undoStore.push({
          label: `${formatHabitLabel(habit)} ${result.newCompleted ? "completed" : "undone"}`,
          execute: result.undo
        });
      }
    }
    function handleExport() {
      exportHabitsCsv(habits());
    }
    function handleDragStart(habit, e) {
      if (sortMode !== "custom") return;
      draggedHabitId = habit.id;
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", habit.id);
      }
    }
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div class="min-h-screen bg-bg-primary">`);
      if (showOnboarding()) {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<div class="flex items-center justify-center min-h-screen px-4">`);
        Onboarding($$renderer3);
        $$renderer3.push(`<!----></div>`);
      } else {
        $$renderer3.push("<!--[-1-->");
        DashboardHero($$renderer3, {
          dateStr: dateStr(),
          todayRate: todayRate(),
          completedToday: completedToday(),
          totalActive: totalActive(),
          overallStreak: overallStreak(),
          daysSinceLastCompletion: daysSinceLastCompletion(),
          onExport: handleExport,
          get heroCollapsed() {
            return heroCollapsed;
          },
          set heroCollapsed($$value) {
            heroCollapsed = $$value;
            $$settled = false;
          }
        });
        $$renderer3.push(`<!----> `);
        RemindersPanel($$renderer3, {
          reminders,
          habits: activeHabits()
        });
        $$renderer3.push(`<!----> `);
        FilterBar($$renderer3, {
          allTags: allTags(),
          habits: activeHabits(),
          today: today(),
          get filter() {
            return filter;
          },
          set filter($$value) {
            filter = $$value;
            $$settled = false;
          },
          get selectedTags() {
            return selectedTags;
          },
          set selectedTags($$value) {
            selectedTags = $$value;
            $$settled = false;
          },
          get sortMode() {
            return sortMode;
          },
          set sortMode($$value) {
            sortMode = $$value;
            $$settled = false;
          },
          get viewDensity() {
            return viewDensity;
          },
          set viewDensity($$value) {
            viewDensity = $$value;
            $$settled = false;
          },
          get searchQuery() {
            return searchQuery;
          },
          set searchQuery($$value) {
            searchQuery = $$value;
            $$settled = false;
          }
        });
        $$renderer3.push(`<!----> `);
        HabitListSection($$renderer3, {
          filteredHabits: filteredHabits(),
          filter,
          viewDensity,
          sortMode,
          allCheckins: allCheckins(),
          draggedHabitId,
          dragOverHabitId,
          dropHintPosition,
          onToggle: handleToggle,
          onDragStart: handleDragStart
        });
        $$renderer3.push(`<!----> <a href="/habit/new" class="fixed bottom-20 right-6 z-50 w-12 h-12 rounded-full bg-accent text-bg-primary shadow-lg flex items-center justify-center hover:bg-accent/90 transition-colors" aria-label="Add new habit">`);
        Plus($$renderer3, { size: 22 });
        $$renderer3.push(`<!----></a>`);
      }
      $$renderer3.push(`<!--]--></div>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
function _page($$renderer) {
  Dashboard($$renderer);
}
export {
  _page as default
};
