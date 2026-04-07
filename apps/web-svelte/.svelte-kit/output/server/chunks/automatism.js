import { s as sanitize_props, a as spread_props, b as slot, c as attr_class, d as stringify, h as attr, e as attr_style, f as escape_html, g as derived } from "./root.js";
import { I as Icon } from "./Icon.js";
import "clsx";
function Archive($$renderer, $$props) {
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
    ["path", { "d": "M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" }],
    ["path", { "d": "M10 12h4" }]
  ];
  Icon($$renderer, spread_props([
    { name: "archive" },
    $$sanitized_props,
    {
      /**
       * @component @name Archive
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cmVjdCB3aWR0aD0iMjAiIGhlaWdodD0iNSIgeD0iMiIgeT0iMyIgcng9IjEiIC8+CiAgPHBhdGggZD0iTTQgOHYxMWEyIDIgMCAwIDAgMiAyaDEyYTIgMiAwIDAgMCAyLTJWOCIgLz4KICA8cGF0aCBkPSJNMTAgMTJoNCIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/archive
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
function Calendar($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.468.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    ["path", { "d": "M8 2v4" }],
    ["path", { "d": "M16 2v4" }],
    [
      "rect",
      { "width": "18", "height": "18", "x": "3", "y": "4", "rx": "2" }
    ],
    ["path", { "d": "M3 10h18" }]
  ];
  Icon($$renderer, spread_props([
    { name: "calendar" },
    $$sanitized_props,
    {
      /**
       * @component @name Calendar
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNOCAydjQiIC8+CiAgPHBhdGggZD0iTTE2IDJ2NCIgLz4KICA8cmVjdCB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHg9IjMiIHk9IjQiIHJ4PSIyIiAvPgogIDxwYXRoIGQ9Ik0zIDEwaDE4IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/calendar
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
function Flame($$renderer, $$props) {
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
        "d": "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
      }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "flame" },
    $$sanitized_props,
    {
      /**
       * @component @name Flame
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNOC41IDE0LjVBMi41IDIuNSAwIDAgMCAxMSAxMmMwLTEuMzgtLjUtMi0xLTMtMS4wNzItMi4xNDMtLjIyNC00LjA1NCAyLTYgLjUgMi41IDIgNC45IDQgNi41IDIgMS42IDMgMy41IDMgNS41YTcgNyAwIDEgMS0xNCAwYzAtMS4xNTMuNDMzLTIuMjk0IDEtM2EyLjUgMi41IDAgMCAwIDIuNSAyLjV6IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/flame
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
function Snowflake($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.468.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    ["line", { "x1": "2", "x2": "22", "y1": "12", "y2": "12" }],
    ["line", { "x1": "12", "x2": "12", "y1": "2", "y2": "22" }],
    ["path", { "d": "m20 16-4-4 4-4" }],
    ["path", { "d": "m4 8 4 4-4 4" }],
    ["path", { "d": "m16 4-4 4-4-4" }],
    ["path", { "d": "m8 20 4-4 4 4" }]
  ];
  Icon($$renderer, spread_props([
    { name: "snowflake" },
    $$sanitized_props,
    {
      /**
       * @component @name Snowflake
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8bGluZSB4MT0iMiIgeDI9IjIyIiB5MT0iMTIiIHkyPSIxMiIgLz4KICA8bGluZSB4MT0iMTIiIHgyPSIxMiIgeTE9IjIiIHkyPSIyMiIgLz4KICA8cGF0aCBkPSJtMjAgMTYtNC00IDQtNCIgLz4KICA8cGF0aCBkPSJtNCA4IDQgNC00IDQiIC8+CiAgPHBhdGggZD0ibTE2IDQtNCA0LTQtNCIgLz4KICA8cGF0aCBkPSJtOCAyMCA0LTQgNCA0IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/snowflake
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
function Trending_up($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.468.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    ["polyline", { "points": "22 7 13.5 15.5 8.5 10.5 2 17" }],
    ["polyline", { "points": "16 7 22 7 22 13" }]
  ];
  Icon($$renderer, spread_props([
    { name: "trending-up" },
    $$sanitized_props,
    {
      /**
       * @component @name TrendingUp
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cG9seWxpbmUgcG9pbnRzPSIyMiA3IDEzLjUgMTUuNSA4LjUgMTAuNSAyIDE3IiAvPgogIDxwb2x5bGluZSBwb2ludHM9IjE2IDcgMjIgNyAyMiAxMyIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/trending-up
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
const HABIT_COLOR_THEMES = {
  blue: {
    hex: "#00d4ff",
    glow: "rgba(0,212,255,0.5)",
    dim: "rgba(0,212,255,0.1)",
    textClass: "text-[#00d4ff]",
    bgClass: "bg-[#00d4ff]/10",
    borderClass: "border-[#00d4ff]/30",
    shadowClass: "shadow-[0_0_12px_rgba(0,212,255,0.2)]",
    heatmapLevels: ["#0d1117", "#0d2d3d", "#0a4a6e", "#006b9f", "#00d4ff"]
  },
  green: {
    hex: "#00ff88",
    glow: "rgba(0,255,136,0.5)",
    dim: "rgba(0,255,136,0.1)",
    textClass: "text-[#00ff88]",
    bgClass: "bg-[#00ff88]/10",
    borderClass: "border-[#00ff88]/30",
    shadowClass: "shadow-[0_0_12px_rgba(0,255,136,0.2)]",
    heatmapLevels: ["#0d1117", "#0d2d1a", "#0a4a28", "#007a3d", "#00ff88"]
  },
  purple: {
    hex: "#a855f7",
    glow: "rgba(168,85,247,0.5)",
    dim: "rgba(168,85,247,0.1)",
    textClass: "text-purple-400",
    bgClass: "bg-purple-400/10",
    borderClass: "border-purple-400/30",
    shadowClass: "shadow-[0_0_12px_rgba(168,85,247,0.2)]",
    heatmapLevels: ["#0d1117", "#1a0d2e", "#2d0a4a", "#5b1a8f", "#a855f7"]
  },
  orange: {
    hex: "#f97316",
    glow: "rgba(249,115,22,0.5)",
    dim: "rgba(249,115,22,0.1)",
    textClass: "text-orange-400",
    bgClass: "bg-orange-400/10",
    borderClass: "border-orange-400/30",
    shadowClass: "shadow-[0_0_12px_rgba(249,115,22,0.2)]",
    heatmapLevels: ["#0d1117", "#2d1a0d", "#4a2a0a", "#8f4a1a", "#f97316"]
  },
  red: {
    hex: "#ef4444",
    glow: "rgba(239,68,68,0.5)",
    dim: "rgba(239,68,68,0.1)",
    textClass: "text-red-400",
    bgClass: "bg-red-400/10",
    borderClass: "border-red-400/30",
    shadowClass: "shadow-[0_0_12px_rgba(239,68,68,0.2)]",
    heatmapLevels: ["#0d1117", "#2d0d0d", "#4a0a0a", "#8f1a1a", "#ef4444"]
  },
  cyan: {
    hex: "#22d3ee",
    glow: "rgba(34,211,238,0.5)",
    dim: "rgba(34,211,238,0.1)",
    textClass: "text-cyan-400",
    bgClass: "bg-cyan-400/10",
    borderClass: "border-cyan-400/30",
    shadowClass: "shadow-[0_0_12px_rgba(34,211,238,0.2)]",
    heatmapLevels: ["#0d1117", "#0d2a2d", "#0a3d4a", "#0a6b7a", "#22d3ee"]
  }
};
const DEFAULT_HABIT_COLOR = "blue";
function CompletionRing($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      percentage,
      size = 40,
      strokeWidth = 3,
      color = DEFAULT_HABIT_COLOR,
      showText = false,
      className = ""
    } = $$props;
    const clampedPercentage = derived(() => Math.min(percentage, 100));
    const radius = derived(() => (size - strokeWidth * 2) / 2);
    const circumference = derived(() => radius() * 2 * Math.PI);
    const offset = derived(() => circumference() - clampedPercentage() / 100 * circumference());
    const colorTheme = derived(() => HABIT_COLOR_THEMES[color]);
    const isFull = derived(() => percentage >= 100);
    const ringStroke = derived(() => isFull() ? "var(--accent-secondary)" : colorTheme().hex);
    const ringFilter = derived(() => percentage <= 0 ? "none" : `drop-shadow(0 0 ${isFull() ? 8 : 4}px ${isFull() ? "var(--glow-secondary)" : colorTheme().glow})`);
    const textColor = derived(() => isFull() ? "var(--accent-secondary)" : colorTheme().hex);
    $$renderer2.push(`<div${attr_class(`relative inline-flex items-center justify-center ${stringify(isFull() ? "animate-ring-celebrate" : "")} ${stringify(className)}`)}><svg${attr("width", size)}${attr("height", size)} class="-rotate-90"><circle${attr("cx", size / 2)}${attr("cy", size / 2)}${attr("r", radius())} fill="none" stroke="var(--border)"${attr("stroke-width", strokeWidth)}></circle><circle${attr("cx", size / 2)}${attr("cy", size / 2)}${attr("r", radius())} fill="none"${attr("stroke", ringStroke())}${attr("stroke-width", strokeWidth)}${attr("stroke-dasharray", circumference())}${attr("stroke-dashoffset", offset())} stroke-linecap="round"${attr_style(`filter: ${stringify(ringFilter())}; transition: stroke-dashoffset 0.6s ease, stroke 0.4s ease;`)}></circle></svg> `);
    if (showText) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<span class="absolute text-[10px] font-mono font-bold"${attr_style(`color: ${stringify(textColor())}`)}>${escape_html(Math.round(percentage))}</span>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
function DescriptionTooltip($$renderer, $$props) {
  let { text, children } = $$props;
  $$renderer.push(`<div class="inline-block">`);
  children($$renderer);
  $$renderer.push(`<!----></div> `);
  {
    $$renderer.push("<!--[-1-->");
  }
  $$renderer.push(`<!--]-->`);
}
function getAutomatismLevel(score) {
  if (score >= 85) return "infallible";
  if (score >= 66) return "established";
  if (score >= 40) return "growing";
  return "fragile";
}
function getAutomatismMessage(level) {
  switch (level) {
    case "infallible":
      return "Autopilot";
    case "established":
      return "Established";
    case "growing":
      return "Growing";
    case "fragile":
      return "Fragile";
  }
}
function getAutomatismColor(level) {
  switch (level) {
    case "infallible":
    case "established":
      return "var(--accent)";
    case "growing":
      return "var(--accent-secondary)";
    case "fragile":
      return "var(--text-muted)";
  }
}
function getAutomatismLevelDetailed(score, accentHex) {
  if (score >= 85) return { label: "Infallible", color: accentHex };
  if (score >= 66) return { label: "Established", color: accentHex };
  if (score >= 40) return { label: "Growing", color: "var(--text-foreground)" };
  return { label: "Fragile", color: "var(--text-muted)" };
}
function getAutomatismMessageDetailed(score) {
  if (score >= 85) return "This habit runs on autopilot — your routine is locked in.";
  if (score >= 66) return "Habit is established. Keep consistent to push it further.";
  if (score >= 40) return `${Math.max(1, 66 - Math.round(score * 0.66))} more active days to reach "automatic" state.`;
  return "Habit is still fragile. Daily repetition is critical right now.";
}
function getAutomatismColorDetailed(score) {
  if (score >= 66) return "var(--accent)";
  if (score >= 40) return "var(--accent-secondary)";
  return "var(--text-muted)";
}
export {
  Archive as A,
  CompletionRing as C,
  DescriptionTooltip as D,
  Flame as F,
  HABIT_COLOR_THEMES as H,
  Snowflake as S,
  Trending_up as T,
  getAutomatismColor as a,
  getAutomatismLevel as b,
  Calendar as c,
  DEFAULT_HABIT_COLOR as d,
  getAutomatismLevelDetailed as e,
  getAutomatismMessageDetailed as f,
  getAutomatismMessage as g,
  getAutomatismColorDetailed as h
};
