import { s as sanitize_props, a as spread_props, b as slot, f as escape_html, e as attr_style, d as stringify, k as ensure_array_like, c as attr_class, h as attr, g as derived, i as store_get, u as unsubscribe_stores } from "./root.js";
import "@sveltejs/kit/internal";
import "./exports.js";
import "./utils.js";
import "@sveltejs/kit/internal/server";
import "./state.svelte.js";
import { p as page } from "./stores.js";
import { a as calculateScheduledStreak, h as habitsStore } from "./habitsStore.js";
import { k as describeSchedule } from "./db.js";
import { P as Plus } from "./plus.js";
import { A as Arrow_left } from "./arrow-left.js";
import { I as Icon } from "./Icon.js";
function X($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.468.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    ["path", { "d": "M18 6 6 18" }],
    ["path", { "d": "m6 6 12 12" }]
  ];
  Icon($$renderer, spread_props([
    { name: "x" },
    $$sanitized_props,
    {
      /**
       * @component @name X
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTggNiA2IDE4IiAvPgogIDxwYXRoIGQ9Im02IDYgMTIgMTIiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/x
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
const COLORS = [
  { value: "blue", label: "Blue", hex: "#00d4ff" },
  { value: "green", label: "Green", hex: "#00ff88" },
  { value: "purple", label: "Purple", hex: "#a855f7" },
  { value: "orange", label: "Orange", hex: "#f97316" },
  { value: "red", label: "Red", hex: "#ef4444" },
  { value: "cyan", label: "Cyan", hex: "#22d3ee" }
];
const ICONS = [
  "⚡",
  "🏃",
  "📖",
  "🧘",
  "💪",
  "🎯",
  "💻",
  "🎨",
  "🎵",
  "🌱",
  "💧",
  "🍎",
  "✍️",
  "🧪",
  "🔬"
];
const DAILY_TARGET_OPTIONS = [1, 2, 3, 4, 5];
const SUGGESTED_TAGS = [
  "health",
  "fitness",
  "productivity",
  "learning",
  "wellness",
  "focus",
  "growth",
  "mental",
  "creative",
  "social"
];
function AddEditHabit($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    const habitId = derived(() => store_get($$store_subs ??= {}, "$page", page).params.id);
    const isEdit = derived(() => Boolean(habitId()));
    const allHabits = derived(() => store_get($$store_subs ??= {}, "$habitsStore", habitsStore));
    const existing = derived(() => habitId() ? allHabits().find((h) => h.id === habitId()) : void 0);
    const isOverLimit = derived(() => !isEdit() && allHabits().length >= 3 && !allHabits().some((h) => calculateScheduledStreak(h, h.completions).current >= 14));
    const showSoftLimitWarning = derived(() => isOverLimit() && true);
    const shouldShowLoading = derived(() => isEdit() && !existing());
    const SCHEDULE_TYPE_OPTIONS = [
      { value: "daily", label: "Daily", desc: "Every day" },
      {
        value: "weekly_days",
        label: "Days of week",
        desc: "Pick weekdays"
      },
      {
        value: "weekly_quota",
        label: "Times per week",
        desc: "Hit a weekly quota"
      },
      {
        value: "monthly_weeks",
        label: "Monthly weeks",
        desc: "Weeks + weekdays"
      },
      {
        value: "monthly_quota",
        label: "Times per month",
        desc: "Monthly quota"
      }
    ];
    let name = "";
    let description = "";
    let color = "blue";
    let icon = "⚡";
    let schedule = { type: "daily" };
    let dailyTarget = 1;
    let tags = [];
    let tagInput = "";
    let reminderTime = "";
    let errors = {};
    const selectedColor = derived(() => COLORS.find((c) => c.value === color) ?? COLORS[0]);
    if (shouldShowLoading()) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="min-h-screen bg-bg-primary"><div class="max-w-lg mx-auto px-4 py-12 text-center text-sm font-mono text-muted" role="status" aria-live="polite">Loading habit...</div></div>`);
    } else if (showSoftLimitWarning()) {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-bg-primary/80 backdrop-blur-sm"><div class="w-full max-w-sm bg-bg-secondary border border-border rounded-3xl p-6 shadow-2xl"><div class="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">`);
      Plus($$renderer2, { class: "text-accent", size: 24 });
      $$renderer2.push(`<!----></div> <h3 class="text-xl font-bold text-foreground mb-2">Focus is key</h3> <p class="text-sm text-muted mb-6 leading-relaxed">Research shows that starting with more than 3 habits simultaneously reduces the success rate by 80%. <br/><br/> We recommend reaching a <span class="text-accent font-bold">14-day streak</span> with your current habits before adding more.</p> <div class="flex flex-col gap-2"><button type="button" class="w-full py-3 rounded-2xl bg-bg-primary border border-border text-sm font-semibold hover:bg-bg-card transition">Go back &amp; focus</button> <button type="button" class="w-full py-3 rounded-2xl text-[10px] font-mono uppercase tracking-widest text-muted hover:text-foreground transition">I understand, add anyway</button></div></div></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="min-h-screen bg-bg-primary"><div class="border-b border-border bg-bg-primary px-4 sticky top-0 z-10" style="top: var(--safe-area-inset-top, 0px); padding-top: calc(var(--safe-area-inset-top, 0px) + 1rem); padding-bottom: 1rem"><div class="max-w-lg mx-auto flex items-center justify-between"><div class="flex items-center gap-3"><button type="button" class="text-muted hover:text-foreground transition-colors">`);
      Arrow_left($$renderer2, { size: 16 });
      $$renderer2.push(`<!----></button> <h1 class="text-base font-semibold text-foreground">${escape_html(isEdit() ? "Edit Habit" : "New Habit")}</h1></div> <button type="button" class="px-4 py-1.5 rounded text-xs font-mono font-bold text-bg-primary transition-all duration-200"${attr_style(`background-color: ${stringify(selectedColor().hex)}; box-shadow: 0 0 16px ${stringify(selectedColor().hex)}40`)}>${escape_html(isEdit() ? "Save" : "Create")}</button></div></div> <div class="max-w-lg mx-auto px-4 py-6 space-y-5"><div class="flex gap-3"><div class="flex-shrink-0"><label class="block text-[10px] font-mono text-muted uppercase tracking-wider mb-2">Icon</label> <div class="grid grid-cols-5 gap-1 bg-bg-secondary border border-border rounded-lg p-2"><!--[-->`);
      const each_array = ensure_array_like(ICONS);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let option = each_array[$$index];
        $$renderer2.push(`<button type="button"${attr_class(`w-8 h-8 rounded flex items-center justify-center text-base transition-all ${stringify(icon === option ? "bg-border ring-1" : "hover:bg-border")}`)}${attr_style(icon === option ? `box-shadow: 0 0 0 1px ${selectedColor().hex}` : "")}>${escape_html(option)}</button>`);
      }
      $$renderer2.push(`<!--]--></div> <div class="mt-2"><input type="text"${attr("value", ICONS.includes(icon) ? "" : icon)} placeholder="Own..." class="w-full bg-bg-secondary border border-border rounded-lg px-2 py-1.5 text-xs text-center placeholder:text-[10px] focus:outline-none focus:border-accent/50 transition-all font-mono"${attr_style(!ICONS.includes(icon) && icon ? `border-color: ${selectedColor().hex}; box-shadow: 0 0 8px ${selectedColor().hex}40` : "")}/></div></div> <div class="flex-1 space-y-3"><div><label class="block text-[10px] font-mono text-muted uppercase tracking-wider mb-2">Name *</label> <input type="text"${attr("value", name)} placeholder="e.g. Deep Work"${attr("maxlength", 40)} class="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder-border-hover font-medium focus:outline-none focus:border-accent/50 focus:shadow-[0_0_12px_var(--glow)] transition-all"${attr_style(errors.name ? "border-color: var(--accent-secondary)" : "")}/> `);
      if (errors.name) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<p class="text-[10px] font-mono text-accent-secondary mt-1">${escape_html(errors.name)}</p>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div> <div><label class="block text-[10px] font-mono text-muted uppercase tracking-wider mb-2">Description</label> <textarea placeholder="Brief description..."${attr("maxlength", 400)}${attr("rows", 6)} class="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder-border-hover focus:outline-none focus:border-accent/50 focus:shadow-[0_0_12px_var(--glow)] transition-all resize-none overflow-y-auto">`);
      const $$body = escape_html(description);
      if ($$body) {
        $$renderer2.push(`${$$body}`);
      }
      $$renderer2.push(`</textarea></div></div></div> <div><label class="block text-[10px] font-mono text-muted uppercase tracking-wider mb-2">Color</label> <div class="flex gap-2"><!--[-->`);
      const each_array_1 = ensure_array_like(COLORS);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let option = each_array_1[$$index_1];
        $$renderer2.push(`<button type="button" class="w-8 h-8 rounded-full border-2 transition-all duration-200 flex items-center justify-center"${attr_style(`background-color: ${stringify(option.hex)}20; border-color: ${stringify(color === option.value ? option.hex : "transparent")}; box-shadow: ${stringify(color === option.value ? `0 0 12px ${option.hex}60` : "none")}`)}${attr("title", option.label)}><div class="w-3 h-3 rounded-full"${attr_style(`background-color: ${stringify(option.hex)}`)}></div></button>`);
      }
      $$renderer2.push(`<!--]--></div></div> <div><label class="block text-[10px] font-mono text-muted uppercase tracking-wider mb-2">Schedule</label> <div class="grid grid-cols-2 gap-2"><!--[-->`);
      const each_array_2 = ensure_array_like(SCHEDULE_TYPE_OPTIONS);
      for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
        let option = each_array_2[$$index_2];
        $$renderer2.push(`<button type="button"${attr_class(`rounded-lg border px-3 py-2 text-xs font-mono text-left transition ${stringify(schedule.type === option.value ? "border-accent text-accent bg-accent/10" : "border-border text-muted hover:border-border-hover")}`)}><div class="font-semibold uppercase tracking-[0.2em]">${escape_html(option.label)}</div> <div class="text-[9px] text-muted">${escape_html(option.desc)}</div></button>`);
      }
      $$renderer2.push(`<!--]--></div> <div class="mt-3 space-y-3">`);
      {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div> <p class="text-[11px] font-mono text-muted mt-2">${escape_html(describeSchedule(schedule))}</p></div> <div><label class="block text-[10px] font-mono text-muted uppercase tracking-wider mb-2">Daily target</label> <div class="flex items-center gap-2"><!--[-->`);
      const each_array_6 = ensure_array_like(DAILY_TARGET_OPTIONS);
      for (let $$index_6 = 0, $$length = each_array_6.length; $$index_6 < $$length; $$index_6++) {
        let value = each_array_6[$$index_6];
        $$renderer2.push(`<button type="button"${attr_class(`px-3 py-1.5 rounded-lg border text-[11px] font-mono transition ${stringify(dailyTarget === value ? "border-accent/50 bg-accent/10 text-accent" : "border-border bg-bg-secondary text-muted hover:border-border-hover")}`)}>${escape_html(value)}x/day</button>`);
      }
      $$renderer2.push(`<!--]--></div> <p class="text-[9px] font-mono text-muted mt-1">Habit counts as done only when today's completions reach this target.</p></div> <div><label class="block text-[10px] font-mono text-muted uppercase tracking-wider mb-2">Habit Type</label> <div class="flex gap-2 p-1 bg-bg-secondary rounded-xl border border-border"><button type="button"${attr_class(`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${stringify(
        "bg-bg-primary shadow-sm text-foreground"
      )}`)}${attr_style(`border-left: 2px solid ${selectedColor().hex}`)}>I want to <span${attr_style(`color: ${stringify(selectedColor().hex)}`)}>DO</span> this</button> <button type="button"${attr_class(`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${stringify("text-muted hover:text-foreground")}`)}${attr_style("")}>I want to <span class="text-red-500">STOP</span> this</button></div></div> <div><label class="block text-[10px] font-mono text-muted uppercase tracking-wider mb-2">Tags <span class="text-border-hover">(${escape_html(tags.length)}/5)</span></label> <div class="flex flex-wrap gap-1.5 mb-2"><!--[-->`);
      const each_array_7 = ensure_array_like(tags);
      for (let $$index_7 = 0, $$length = each_array_7.length; $$index_7 < $$length; $$index_7++) {
        let tag = each_array_7[$$index_7];
        $$renderer2.push(`<span class="flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded border"${attr_style(`color: ${stringify(selectedColor().hex)}; border-color: ${stringify(selectedColor().hex)}40; background-color: ${stringify(selectedColor().hex)}10`)}>#${escape_html(tag)} <button type="button" class="opacity-60 hover:opacity-100">`);
        X($$renderer2, { size: 9 });
        $$renderer2.push(`<!----></button></span>`);
      }
      $$renderer2.push(`<!--]--></div> <div class="flex gap-2"><input type="text"${attr("value", tagInput)} placeholder="Add tag..."${attr("maxlength", 20)}${attr("disabled", tags.length >= 5, true)} class="flex-1 bg-bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder-border-hover font-mono focus:outline-none focus:border-accent/50 transition-all disabled:opacity-40"/> <button type="button"${attr("disabled", !tagInput.trim() || tags.length >= 5, true)} class="px-3 py-2 rounded-lg border border-border text-muted hover:text-foreground hover:border-border-hover transition-colors disabled:opacity-40">`);
      Plus($$renderer2, { size: 13 });
      $$renderer2.push(`<!----></button></div> <div class="flex flex-wrap gap-1.5 mt-2"><!--[-->`);
      const each_array_8 = ensure_array_like(SUGGESTED_TAGS.filter((t) => !tags.includes(t)).slice(0, 6));
      for (let $$index_8 = 0, $$length = each_array_8.length; $$index_8 < $$length; $$index_8++) {
        let tag = each_array_8[$$index_8];
        $$renderer2.push(`<button type="button"${attr("disabled", tags.length >= 5, true)} class="text-[9px] font-mono text-muted border border-border px-2 py-0.5 rounded hover:text-foreground hover:border-border-hover transition-colors disabled:opacity-40">+${escape_html(tag)}</button>`);
      }
      $$renderer2.push(`<!--]--></div></div> <div><label class="block text-[10px] font-mono text-muted uppercase tracking-wider mb-2">Reminder</label> <div class="flex flex-wrap items-center gap-3"><input type="time"${attr("value", reminderTime)} class="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm font-mono focus:border-accent/60 focus:outline-none focus:shadow-[0_0_12px_var(--glow)] transition"/> <button type="button"${attr_class(`px-3 py-1.5 rounded-lg border text-[9px] font-mono uppercase tracking-wider transition ${stringify(
        "border-accent/40 bg-accent/10 text-accent"
      )}`)}>${escape_html("Reminders enabled")}</button> <span class="text-[11px] font-mono text-muted">${escape_html("No reminder yet")}</span></div> <p class="text-[9px] font-mono text-muted mt-1">${escape_html(
        "Reminder calls appear on the dashboard when the app is open."
      )}</p></div></div></div>`);
    }
    $$renderer2.push(`<!--]-->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  AddEditHabit as A
};
