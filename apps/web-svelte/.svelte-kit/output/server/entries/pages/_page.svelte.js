import { s as sanitize_props, a as spread_props, b as slot, k as ensure_array_like, f as escape_html, g as derived, i as store_get, u as unsubscribe_stores } from "../../chunks/root.js";
import { s as sessionStore } from "../../chunks/sessionStore.js";
import "@sveltejs/kit/internal";
import "../../chunks/exports.js";
import "../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../chunks/state.svelte.js";
import { p as page } from "../../chunks/stores.js";
import { S as Sparkles } from "../../chunks/sparkles.js";
import { I as Icon } from "../../chunks/Icon.js";
function Arrow_right($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.468.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    ["path", { "d": "M5 12h14" }],
    ["path", { "d": "m12 5 7 7-7 7" }]
  ];
  Icon($$renderer, spread_props([
    { name: "arrow-right" },
    $$sanitized_props,
    {
      /**
       * @component @name ArrowRight
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNNSAxMmgxNCIgLz4KICA8cGF0aCBkPSJtMTIgNSA3IDctNyA3IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/arrow-right
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
function Circle_check($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.468.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    ["circle", { "cx": "12", "cy": "12", "r": "10" }],
    ["path", { "d": "m9 12 2 2 4-4" }]
  ];
  Icon($$renderer, spread_props([
    { name: "circle-check" },
    $$sanitized_props,
    {
      /**
       * @component @name CircleCheck
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgLz4KICA8cGF0aCBkPSJtOSAxMiAyIDIgNC00IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/circle-check
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
function PublicLanding($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const featureHighlights = [
      "Daily completion targets",
      "Current and longest streak analytics",
      "Sync-ready workflow across devices"
    ];
    $$renderer2.push(`<div class="min-h-screen bg-white text-slate-900"><header class="sticky top-0 z-20 border-b border-slate-200/90 bg-white/95 backdrop-blur"><div class="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6"><div class="flex items-center gap-3"><img src="/app-icon.svg" alt="Habbit Runner" class="w-9 h-9 rounded-xl flex-shrink-0 object-contain"/> <div><p class="text-sm font-semibold text-slate-900">Habbit Runner</p> <p class="text-xs text-slate-500">Habit tracking with real progress analytics</p></div></div> <button type="button" class="rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 transition-colors hover:bg-cyan-100">Continue with Google</button></div></header> <main><section class="border-b border-slate-200 bg-[radial-gradient(circle_at_top,rgba(186,230,253,0.65),transparent_58%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]"><div class="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.08fr_0.92fr] md:py-16"><div><div class="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs text-cyan-700">`);
    Sparkles($$renderer2, { size: 14 });
    $$renderer2.push(`<!----> See your progress before you even sign in</div> <h1 class="max-w-xl text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">Habit tracker app for daily routine planning and reliable streak growth.</h1> <p class="mt-4 max-w-xl text-sm text-slate-600 sm:text-base">You can see how the product looks before sign-in. Habbit Runner focuses on daily
            completion, streak integrity, and fast overview of what is done right now.</p> <div class="mt-7 flex flex-wrap items-center gap-3"><button type="button" class="inline-flex items-center gap-2 rounded-lg border border-cyan-300 bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-700 transition-all hover:bg-cyan-100">Start now `);
    Arrow_right($$renderer2, { size: 15 });
    $$renderer2.push(`<!----></button> <button type="button" class="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900">See product preview</button> <a href="/habit-tracker" class="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900">Explore habit tracker page</a></div> <div class="mt-8 grid gap-3 sm:grid-cols-3"><!--[-->`);
    const each_array = ensure_array_like(featureHighlights);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let item = each_array[$$index];
      $$renderer2.push(`<div class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">`);
      Circle_check($$renderer2, { size: 13, class: "mb-2 text-emerald-600" });
      $$renderer2.push(`<!----> <p>${escape_html(item)}</p></div>`);
    }
    $$renderer2.push(`<!--]--></div></div> <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p class="mb-3 text-xs uppercase tracking-[0.18em] text-slate-500">What you get</p> <div class="space-y-3 text-sm text-slate-700"><div class="rounded-xl border border-slate-200 bg-slate-50 p-3"><p class="font-medium text-slate-900">Daily view</p> <p class="mt-1 text-xs text-slate-600">Rate, done count, and active habits in one compact block.</p></div> <div class="rounded-xl border border-slate-200 bg-slate-50 p-3"><p class="font-medium text-slate-900">Habit rows</p> <p class="mt-1 text-xs text-slate-600">Completion checkbox, tags, streak and weekly bars on every row.</p></div> <div class="rounded-xl border border-slate-200 bg-slate-50 p-3"><p class="font-medium text-slate-900">Stats and edit flow</p> <p class="mt-1 text-xs text-slate-600">Browse dashboard, edit habits, and check detailed statistics.</p></div></div></div></div></section> <section id="product-preview" class="border-b border-slate-200 bg-[#f8fafc] px-4 py-12 sm:px-6"><div class="mx-auto w-full max-w-6xl"><p class="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">Inside the app</p> <h2 class="mb-5 text-2xl font-semibold text-slate-900">Swipe through real screens</h2> <p class="text-sm text-slate-500">Preview carousel available after page components are loaded.</p></div></section> <section class="border-b border-slate-200 bg-white px-4 py-12 sm:px-6"><div class="mx-auto grid w-full max-w-6xl gap-6 md:grid-cols-2"><article class="rounded-2xl border border-slate-200 bg-slate-50 p-5"><h2 class="text-xl font-semibold text-slate-900">What Makes Habbit Runner Different</h2> <p class="mt-3 text-sm text-slate-600">Habbit Runner is a habit tracking app focused on execution. You set daily targets, check
            progress in a clear dashboard, and monitor streaks without clutter.</p> <ul class="mt-4 space-y-2 text-sm text-slate-700"><li>Simple habit tracker for consistent daily routines.</li> <li>Streak tracker with current streak and longest streak history.</li> <li>Goal tracking with completion rates and trend visibility.</li></ul> <div class="mt-4 flex flex-wrap gap-2"><a href="/streak-tracker" class="text-xs text-cyan-700 underline">Streak tracker details</a> <a href="/daily-routine-planner" class="text-xs text-cyan-700 underline">Daily routine planner details</a></div></article> <article class="rounded-2xl border border-slate-200 bg-slate-50 p-5"><h2 class="text-xl font-semibold text-slate-900">Best For</h2> <p class="mt-3 text-sm text-slate-600">This productivity app is built for people who want clear data instead of motivational
            noise: founders, creators, athletes, students, and teams building daily discipline.</p> <ul class="mt-4 space-y-2 text-sm text-slate-700"><li>Personal habit planning and consistency tracking.</li> <li>Routine management for work, health, learning, and focus.</li> <li>Weekly and monthly performance review from one place.</li></ul></article></div></section> <section class="bg-[#f8fafc] px-4 py-12 sm:px-6"><div class="mx-auto w-full max-w-6xl"><h2 class="text-2xl font-semibold text-slate-900">Habit Tracker FAQ</h2> <div class="mt-5 space-y-3"><details class="rounded-xl border border-slate-200 bg-white p-4"><summary class="cursor-pointer text-sm font-semibold text-slate-900">Is Habbit Runner a free habit tracker app?</summary> <p class="mt-2 text-sm text-slate-600">Yes. You can start with the core habit tracking flow, streak monitoring, and dashboard
              analytics without a paid plan.</p></details> <details class="rounded-xl border border-slate-200 bg-white p-4"><summary class="cursor-pointer text-sm font-semibold text-slate-900">Does it support streak tracking and long-term progress?</summary> <p class="mt-2 text-sm text-slate-600">Yes. Each habit includes current streak, longest streak, completion rate, and trend
              views for weekly and monthly analysis.</p></details> <details class="rounded-xl border border-slate-200 bg-white p-4"><summary class="cursor-pointer text-sm font-semibold text-slate-900">Can I use it as a daily routine planner?</summary> <p class="mt-2 text-sm text-slate-600">Yes. You can define daily targets, set reminders, and track routines for fitness,
              study, work, and personal growth.</p></details></div></div></section></main> <footer class="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6"><p>Built for clarity and consistent daily execution.</p> <div class="flex items-center gap-3"><button type="button" class="rounded border border-slate-300 bg-white px-3 py-1.5 text-slate-700 transition-colors hover:border-cyan-300 hover:text-cyan-700">Sign in</button> <button type="button" class="rounded border border-slate-300 bg-white px-3 py-1.5 text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900">Sign-in not working?</button></div></footer> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
function PublicSeoPage($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { intent } = $$props;
    const CONTENT = {
      "habit-tracker": {
        title: "Habit Tracker App - Habbit Runner",
        h1: "Habit Tracker App For Real Daily Consistency",
        description: "Habbit Runner is a habit tracker app with daily targets, clean progress dashboard, and performance analytics.",
        keywords: "habit tracker app, best habit tracker, habit builder app, habit tracking dashboard, goal tracker",
        bullets: [
          "Track habits with clear daily completion targets.",
          "Review dashboard progress and habit health in seconds.",
          "Edit habit frequency, reminders, tags, and targets quickly."
        ],
        faq: [
          {
            question: "How does this habit tracker app help me stay consistent?",
            answer: "It keeps your daily targets, completion history, and progress view in one place so execution stays visible."
          },
          {
            question: "Can I manage multiple habits at once?",
            answer: "Yes. You can track multiple routines, sort priorities, and monitor each habit performance separately."
          }
        ]
      },
      "streak-tracker": {
        title: "Streak Tracker App - Habbit Runner",
        h1: "Streak Tracker App With Clear Performance Signals",
        description: "Use Habbit Runner as a streak tracker app to monitor current streak, longest streak, and completion rate trends.",
        keywords: "streak tracker app, habit streak tracker, streak counter app, productivity streak app, consistency tracker",
        bullets: [
          "See current and longest streak for each habit.",
          "Identify streak breaks quickly and recover with better planning.",
          "Compare weekly and monthly streak performance from one screen."
        ],
        faq: [
          {
            question: "Does the streak tracker show both current and best streak?",
            answer: "Yes. Every habit can display current streak and longest streak so you can track progress over time."
          },
          {
            question: "Can I review streak trends for multiple habits?",
            answer: "Yes. The stats view gives you trend context and completion rates across all active habits."
          }
        ]
      },
      "daily-routine-planner": {
        title: "Daily Routine Planner App - Habbit Runner",
        h1: "Daily Routine Planner App For Work, Health, And Focus",
        description: "Plan your daily routine with habits, reminders, and measurable targets using Habbit Runner productivity workflows.",
        keywords: "daily routine planner app, routine planner, daily planner for habits, productivity routine app, schedule habits",
        bullets: [
          "Build structured routines with daily or custom frequencies.",
          "Set reminders and completion targets for repeatable routines.",
          "Use stats to improve routine quality each week."
        ],
        faq: [
          {
            question: "Can I use this as a daily routine planner for work and personal goals?",
            answer: "Yes. You can organize habits for health, learning, focus, and personal growth in one routine flow."
          },
          {
            question: "Does it support reminders in routine planning?",
            answer: "Yes. You can set reminder time and keep routine execution visible in your dashboard."
          }
        ]
      }
    };
    const content = derived(() => CONTENT[intent]);
    $$renderer2.push(`<div class="min-h-screen bg-white text-slate-900"><header class="border-b border-slate-200 bg-white"><div class="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6"><a href="/" class="flex items-center gap-2.5 text-sm font-semibold text-slate-900"><img src="/app-icon.svg" alt="Habbit Runner" class="w-8 h-8 rounded-lg flex-shrink-0 object-contain"/> Habbit Runner</a> <button type="button" class="rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 transition-colors hover:bg-cyan-100">Continue with Google</button></div></header> <main class="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6"><div class="max-w-3xl"><h1 class="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">${escape_html(content().h1)}</h1> <p class="mt-4 text-base text-slate-600">${escape_html(content().description)}</p> <div class="mt-6 flex flex-wrap gap-2"><a href="/" class="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700">Home</a> <a href="/habit-tracker" class="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700">Habit Tracker</a> <a href="/streak-tracker" class="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700">Streak Tracker</a> <a href="/daily-routine-planner" class="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700">Daily Routine Planner</a></div> <ul class="mt-8 space-y-3"><!--[-->`);
    const each_array = ensure_array_like(content().bullets);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let bullet = each_array[$$index];
      $$renderer2.push(`<li class="flex items-start gap-2 text-sm text-slate-700">`);
      Circle_check($$renderer2, { size: 16, class: "mt-0.5 flex-shrink-0 text-emerald-600" });
      $$renderer2.push(`<!----> ${escape_html(bullet)}</li>`);
    }
    $$renderer2.push(`<!--]--></ul> <div class="mt-8"><button type="button" class="inline-flex items-center gap-2 rounded-lg border border-cyan-300 bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-700 transition-all hover:bg-cyan-100">Get started `);
    Arrow_right($$renderer2, { size: 15 });
    $$renderer2.push(`<!----></button></div> `);
    if (content().faq.length > 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="mt-12 space-y-3"><h2 class="text-lg font-semibold text-slate-900">Frequently Asked Questions</h2> <!--[-->`);
      const each_array_1 = ensure_array_like(content().faq);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let item = each_array_1[$$index_1];
        $$renderer2.push(`<details class="rounded-xl border border-slate-200 bg-slate-50 p-4"><summary class="cursor-pointer text-sm font-semibold text-slate-900">${escape_html(item.question)}</summary> <p class="mt-2 text-sm text-slate-600">${escape_html(item.answer)}</p></details>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div></main></div>`);
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    const seoIntents = {
      "/habit-tracker": "habit-tracker",
      "/streak-tracker": "streak-tracker",
      "/daily-routine-planner": "daily-routine-planner"
    };
    if (store_get($$store_subs ??= {}, "$sessionStore", sessionStore)) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<script lang="ts">
    import { onMount } from 'svelte';
    onMount(() => goto('/dashboard', { replaceState: true }));
  <\/script>`);
      $$renderer2.push(`<!---->`);
    } else {
      $$renderer2.push("<!--[-1-->");
      if (seoIntents[store_get($$store_subs ??= {}, "$page", page).url.pathname]) {
        $$renderer2.push("<!--[0-->");
        PublicSeoPage($$renderer2, {
          intent: seoIntents[store_get($$store_subs ??= {}, "$page", page).url.pathname]
        });
      } else {
        $$renderer2.push("<!--[-1-->");
        PublicLanding($$renderer2);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]-->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _page as default
};
