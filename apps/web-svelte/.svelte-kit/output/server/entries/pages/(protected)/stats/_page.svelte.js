import "clsx";
import { k as ensure_array_like, c as attr_class, f as escape_html, a as spread_props, d as stringify, e as attr_style, g as derived, i as store_get, u as unsubscribe_stores } from "../../../../chunks/root.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/state.svelte.js";
import { d as getHabitStats, h as habitsStore } from "../../../../chunks/habitsStore.js";
import { t as toCompletionKey } from "../../../../chunks/db.js";
import { O as OVERVIEW_SIGNALS_TOOLTIP, Y as YOUR_INVESTMENT_TOOLTIP, I as INSIGHTS_TOOLTIP } from "../../../../chunks/blockGuideTooltips.js";
import { f as formatHabitLabel, C as ChartGuideTooltip } from "../../../../chunks/ChartGuideTooltip.js";
const APP_LOCALE = "en-US";
function formatAppDate(date, options) {
  return date.toLocaleDateString(APP_LOCALE, options);
}
const PERIOD_DAY_RANGES = {
  week: 7,
  month: 30,
  quarter: 90,
  year: 365
};
const PERIOD_DISPLAY_NAMES = {
  week: "week",
  month: "month",
  quarter: "quarter",
  year: "year"
};
const STREAK_THRESHOLDS = {
  AUTOMATISM_MIN: 66,
  MOMENTUM_MIN: 21
};
const WEEKDAY_NA = "N/A";
const STREAK_MESSAGES = {
  AUTOMATISM: (label, days) => `${label} reached automatism level — ${days} consecutive days. This habit is wired in.`,
  MOMENTUM_ENCOURAGEMENT: (days, label) => `${days}-day streak on ${label}! Research suggests 66 days to reach automatism.`,
  EARLY_STAGE: (days) => `${days}-day streak so far. Keep going — consistency compounds.`,
  NO_STREAK: "No streaks yet. Complete any habit 3 days in a row to start building a chain."
};
function filterStatsHabits(habits, statusFilter, searchQuery, selectedTags) {
  return habits.filter((habit) => {
    if (selectedTags.length > 0 && !(habit.tags || []).some((tag) => selectedTags.includes(tag))) return false;
    return true;
  });
}
function buildStatsSummary(allStats) {
  const sorted = [...allStats].sort((a, b) => b.stats.completionRate - a.stats.completionRate);
  const totalCompletions = allStats.reduce((sum, { stats }) => sum + stats.completedDays, 0);
  const avgRate = allStats.length > 0 ? Math.round(allStats.reduce((sum, { stats }) => sum + stats.completionRate, 0) / allStats.length) : 0;
  return {
    sorted,
    totalCompletions,
    avgRate,
    bestStreak: Math.max(...allStats.map(({ stats }) => stats.longestStreak), 0),
    currentStreaks: allStats.reduce((sum, { stats }) => sum + (stats.currentStreak > 0 ? 1 : 0), 0)
  };
}
function buildStreakInsight(allStats) {
  const streakLeader = allStats.length > 0 ? allStats.reduce((best, next) => next.stats.longestStreak > best.stats.longestStreak ? next : best, allStats[0]) : null;
  let streakBody;
  let streakIcon = "lightbulb";
  if (streakLeader) {
    const days = streakLeader.stats.longestStreak;
    if (days >= STREAK_THRESHOLDS.AUTOMATISM_MIN) {
      streakIcon = "flame";
      streakBody = STREAK_MESSAGES.AUTOMATISM(formatHabitLabel(streakLeader.habit), days);
    } else if (days >= STREAK_THRESHOLDS.MOMENTUM_MIN) {
      streakIcon = "dumbbell";
      streakBody = STREAK_MESSAGES.MOMENTUM_ENCOURAGEMENT(days, formatHabitLabel(streakLeader.habit));
    } else if (days > 0) {
      streakIcon = "sprout";
      streakBody = STREAK_MESSAGES.EARLY_STAGE(days);
    } else {
      streakBody = "No streaks yet. Complete any habit 3 days in a row to start building a chain.";
    }
  } else {
    streakBody = STREAK_MESSAGES.NO_STREAK;
  }
  return { id: "streak", title: "Best streak", body: streakBody, iconName: streakIcon };
}
function buildWeekdayInsight(weekdayStats) {
  const bestCount = weekdayStats.counts[weekdayStats.bestIndex] ?? 0;
  const worstCount = weekdayStats.counts[weekdayStats.worstIndex] ?? 0;
  const weekdayDiffPercent = worstCount === 0 ? bestCount * 100 : Math.round((bestCount - worstCount) / Math.max(1, worstCount) * 100);
  const hasWeekdayShift = weekdayStats.bestWeekday !== WEEKDAY_NA && weekdayStats.worstWeekday !== WEEKDAY_NA;
  let weekdayBody;
  let weekdayIcon = "bar-chart-2";
  if (hasWeekdayShift) {
    if (weekdayDiffPercent > 50) {
      weekdayIcon = "alert-triangle";
      weekdayBody = `${weekdayStats.worstWeekday} is your weakest day — try a shorter goal or reminder that day.`;
    } else {
      weekdayBody = `${weekdayDiffPercent}% more completions on ${weekdayStats.bestWeekday} vs ${weekdayStats.worstWeekday}.`;
    }
  } else {
    weekdayBody = "Check back after a few active days to see your weekday patterns.";
  }
  return { id: "weekday", title: "Weekday shift", body: weekdayBody, iconName: weekdayIcon };
}
function buildMomentumInsight(habitPeriodData, filteredHabits, period) {
  const improvedCount = habitPeriodData.length > 1 ? filteredHabits.reduce((sum, habit) => {
    const lastEntry = habitPeriodData[habitPeriodData.length - 1];
    const prevEntry = habitPeriodData[habitPeriodData.length - 2];
    const current = Number(lastEntry?.[habit.name] ?? 0);
    const previous = Number(prevEntry?.[habit.name] ?? 0);
    return current > previous ? sum + 1 : sum;
  }, 0) : 0;
  const total = filteredHabits.length;
  let momentumBody;
  let momentumIcon = "lightbulb";
  if (total === 0) {
    momentumBody = "No habits to measure yet.";
  } else if (improvedCount === total) {
    momentumIcon = "zap";
    momentumBody = `All ${total} habits improving this ${PERIOD_DISPLAY_NAMES[period]} — excellent momentum!`;
  } else if (improvedCount === 0) {
    momentumIcon = "trending-down";
    momentumBody = `No habits improved this ${PERIOD_DISPLAY_NAMES[period]}. Focus on one habit to break the trend.`;
  } else {
    momentumIcon = "trending-up";
    momentumBody = `${improvedCount} of ${total} habits improved. Push the other ${total - improvedCount} forward.`;
  }
  return { id: "momentum", title: "Momentum", body: momentumBody, iconName: momentumIcon };
}
function buildStatsInsights(allStats, weekdayStats, habitPeriodData, filteredHabits, period) {
  return [
    buildStreakInsight(allStats),
    buildWeekdayInsight(weekdayStats),
    buildMomentumInsight(habitPeriodData, filteredHabits, period)
  ];
}
function getInvestmentColor(percent) {
  if (percent >= 80) return "var(--accent)";
  if (percent >= 50) return "var(--accent-secondary)";
  return "var(--text-muted)";
}
function getInvestmentMessage(percent, worstDay) {
  if (percent >= 80) return "Outstanding commitment — keep this pace.";
  if (percent >= 50) return `Good momentum. Try to cover ${worstDay} more consistently.`;
  if (percent >= 20) return "Room to grow — aim for one more active day each week.";
  return "Just getting started. Focus on one habit to build the base.";
}
function Stats($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    const TABS = [
      { id: "overview", label: "Overview" },
      { id: "charts", label: "Charts" },
      { id: "habits", label: "Habits" },
      { id: "activity", label: "Activity" }
    ];
    const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    let activeTab = "overview";
    let statusFilter = "all";
    let searchQuery = "";
    let selectedTags = [];
    let period = "month";
    let hiddenHabits = [];
    const allHabits = derived(() => store_get($$store_subs ??= {}, "$habitsStore", habitsStore));
    const allHabitsRaw = derived(() => allHabits() ?? []);
    const filteredHabits = derived(() => filterStatsHabits(allHabitsRaw(), statusFilter, searchQuery, selectedTags));
    const visibleHabits = derived(() => filteredHabits().filter((h) => !hiddenHabits.includes(h.name)));
    const allStats = derived(() => filteredHabits().map((habit) => ({ habit, stats: getHabitStats(habit.id, allHabitsRaw()) })));
    const summary = derived(() => buildStatsSummary(allStats()));
    function getWindowRange(p) {
      const days = PERIOD_DAY_RANGES[p];
      const end = /* @__PURE__ */ new Date();
      end.setHours(23, 59, 59, 999);
      const start = new Date(end);
      start.setDate(start.getDate() - days + 1);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    const windowRange = derived(() => getWindowRange(period));
    function formatSegmentLabel(date, p) {
      switch (p) {
        case "week":
          return formatAppDate(date, { weekday: "short" });
        case "month":
          return formatAppDate(date, { month: "short", day: "numeric" });
        case "quarter":
          return formatAppDate(date, { month: "short", day: "numeric" });
        case "year":
          return formatAppDate(date, { month: "short", day: "numeric", year: "2-digit" });
        default:
          return formatAppDate(date, { month: "short", day: "numeric" });
      }
    }
    function buildDailySegments(p, days) {
      const segments = [];
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      for (let offset = days - 1; offset >= 0; offset--) {
        const start = new Date(today);
        start.setDate(start.getDate() - offset);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        segments.push({ start, end, label: formatSegmentLabel(start, p) });
      }
      return segments;
    }
    function buildPeriodSegments(p, days) {
      const dailySegments = buildDailySegments(p, days);
      return dailySegments;
    }
    const periodSegments = derived(() => buildPeriodSegments(period, PERIOD_DAY_RANGES[period]));
    function differenceInDays(later, earlier) {
      return Math.round((later.getTime() - earlier.getTime()) / 864e5);
    }
    function getCompletionThreshold(habit) {
      return Math.max(1, habit.dailyTarget ?? 1);
    }
    const habitPeriodData = derived(() => {
      return periodSegments().map((segment) => {
        const entry = { period: segment.label };
        const spanDays = Math.max(1, differenceInDays(segment.end, segment.start));
        visibleHabits().forEach((habit) => {
          let completed = 0;
          for (let cursor = new Date(segment.start); cursor < segment.end; cursor.setDate(cursor.getDate() + 1)) {
            const key = toCompletionKey(cursor);
            if ((habit.completions[key] ?? 0) >= getCompletionThreshold(habit)) completed++;
          }
          entry[habit.name] = Math.round(completed / spanDays * 100);
        });
        return entry;
      });
    });
    const weekdayStats = derived(() => {
      const { start, end } = windowRange();
      const habits = visibleHabits();
      const counts = Array(7).fill(0);
      const activeDays = /* @__PURE__ */ new Set();
      const spanDays = differenceInDays(end, start) + 1;
      for (let offset = 0; offset < spanDays; offset++) {
        const date = new Date(start);
        date.setDate(start.getDate() + offset);
        const key = toCompletionKey(date);
        const isCompleted = habits.some((h) => (h.completions[key] ?? 0) >= getCompletionThreshold(h));
        if (isCompleted) {
          counts[date.getDay()] += 1;
          activeDays.add(key);
        }
      }
      let bestIndex = 0;
      let worstIndex = -1;
      for (let i = 0; i < 7; i++) {
        if (counts[i] > counts[bestIndex]) bestIndex = i;
        if (counts[i] > 0 && (worstIndex === -1 || counts[i] < counts[worstIndex])) worstIndex = i;
      }
      const totalActiveDays = activeDays.size;
      const investmentPercent = Math.round(totalActiveDays / Math.max(1, spanDays) * 100);
      const resolvedWorstIndex = worstIndex >= 0 ? worstIndex : bestIndex;
      return {
        bestWeekday: counts[bestIndex] > 0 ? WEEKDAY_NAMES[bestIndex] : "N/A",
        worstWeekday: worstIndex >= 0 ? WEEKDAY_NAMES[worstIndex] : "N/A",
        bestIndex,
        worstIndex: resolvedWorstIndex,
        counts,
        investmentPercent,
        totalActiveDays
      };
    });
    const insights = derived(() => buildStatsInsights(allStats(), weekdayStats(), habitPeriodData(), filteredHabits(), period));
    $$renderer2.push(`<div class="min-h-screen bg-bg-primary"><div class="border-b border-border px-4 py-4"><div class="max-w-6xl mx-auto"><p class="text-[10px] font-mono text-muted uppercase tracking-widest mb-1">Overview</p> <h1 class="text-xl font-semibold text-foreground">Statistics</h1></div></div> <div class="sticky top-0 z-30 border-b border-border bg-bg-primary/95 backdrop-blur-sm"><div class="max-w-6xl mx-auto px-4"><div class="flex items-center gap-2 overflow-hidden"><div class="flex min-w-0 flex-1 items-center overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&amp;::-webkit-scrollbar]:hidden"><!--[-->`);
    const each_array = ensure_array_like(TABS);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let tab = each_array[$$index];
      const isActive = activeTab === tab.id;
      $$renderer2.push(`<button${attr_class(`relative shrink-0 px-3 py-3 text-[11px] font-mono transition-colors whitespace-nowrap sm:px-4 sm:text-xs ${stringify(isActive ? "text-foreground" : "text-muted hover:text-foreground/70")}`)}>${escape_html(tab.label)} `);
      if (isActive) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<span class="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-accent" style="box-shadow: 0 0 6px var(--glow)"></span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></button>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="flex shrink-0 items-center justify-end py-2 pl-1"><button aria-label="Toggle filters"${attr_class(`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-mono transition-colors sm:px-3 sm:text-xs ${stringify("border-border text-muted hover:text-foreground")}`)}><svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"></path></svg> <span class="hidden sm:inline">Filters</span></button></div></div></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> <div class="max-w-6xl mx-auto px-4 py-4">`);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="space-y-4"><div class="grid gap-4 md:grid-cols-[2fr,1fr]"><div class="space-y-2"><div class="flex items-center gap-2"><h2 class="text-xs font-mono text-muted uppercase tracking-wider">Overview signals</h2> `);
      ChartGuideTooltip($$renderer2, spread_props([OVERVIEW_SIGNALS_TOOLTIP]));
      $$renderer2.push(`<!----></div> <div class="grid grid-cols-2 gap-3 md:grid-cols-4"><div class="bg-bg-secondary border border-border rounded-lg p-3"><div class="flex items-center gap-1 mb-2"><svg class="w-2.5 h-2.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> <span class="text-[9px] font-mono text-muted uppercase tracking-wider">Avg Rate</span></div> <div class="text-2xl font-mono font-bold text-accent" style="text-shadow: 0 0 12px var(--glow)">${escape_html(summary().avgRate)}%</div></div> <div class="bg-bg-secondary border border-border rounded-lg p-3"><div class="flex items-center gap-1 mb-2"><svg class="w-2.5 h-2.5 text-accent-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"></path></svg> <span class="text-[9px] font-mono text-muted uppercase tracking-wider">Best</span></div> <div class="text-2xl font-mono font-bold text-accent-secondary">${escape_html(summary().bestStreak)}d</div></div> <div class="bg-bg-secondary border border-border rounded-lg p-3"><div class="flex items-center gap-1 mb-2"><svg class="w-2.5 h-2.5 text-accent-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg> <span class="text-[9px] font-mono text-muted uppercase tracking-wider">Total</span></div> <div class="text-2xl font-mono font-bold text-accent-secondary" style="text-shadow: 0 0 12px var(--glow-secondary)">${escape_html(summary().totalCompletions)}</div></div> <div class="bg-bg-secondary border border-border rounded-lg p-3"><div class="flex items-center gap-1 mb-2"><svg class="w-2.5 h-2.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> <span class="text-[9px] font-mono text-muted uppercase tracking-wider">Active</span></div> <div class="text-2xl font-mono font-bold text-foreground">${escape_html(summary().currentStreaks)}</div></div></div></div> <div class="bg-bg-secondary border border-border rounded-lg p-4 space-y-4"><div class="flex items-center justify-between"><div><div class="flex items-center gap-2"><h2 class="text-xs font-mono text-muted uppercase tracking-wider">Your Investment</h2> `);
      ChartGuideTooltip($$renderer2, spread_props([YOUR_INVESTMENT_TOOLTIP]));
      $$renderer2.push(`<!----></div> <p class="text-[10px] text-muted mt-1 italic">Progress across habits this window</p></div> <div class="text-2xl font-mono font-bold text-accent">${escape_html(weekdayStats().investmentPercent)}%</div></div> <div class="grid grid-cols-3 gap-2"><div class="p-2 bg-bg-card border border-border rounded-lg text-center"><p class="text-[8px] font-mono text-muted uppercase">Best Day</p> <p${attr_class(`text-xs font-mono font-bold ${stringify(weekdayStats().bestWeekday !== "N/A" ? "text-accent-secondary" : "text-muted")}`)}>${escape_html(weekdayStats().bestWeekday !== "N/A" ? weekdayStats().bestWeekday : "—")}</p></div> <div class="p-2 bg-bg-card border border-border rounded-lg text-center"><p class="text-[8px] font-mono text-muted uppercase">Worst Day</p> <p${attr_class(`text-xs font-mono font-bold ${stringify(weekdayStats().worstWeekday !== "N/A" ? "text-muted" : "text-muted/70")}`)}>${escape_html(weekdayStats().worstWeekday !== "N/A" ? weekdayStats().worstWeekday : "—")}</p></div> <div class="p-2 bg-bg-card border border-border rounded-lg text-center"><p class="text-[8px] font-mono text-muted uppercase">Active Days</p> <p class="text-xs font-mono font-bold text-foreground">${escape_html(weekdayStats().totalActiveDays)}d</p></div></div> <div class="h-1.5 bg-border rounded-full overflow-hidden"><div class="h-full bg-accent transition-all duration-1000"${attr_style(`width: ${stringify(weekdayStats().investmentPercent)}%; box-shadow: 0 0 10px var(--glow)`)}></div></div> <p class="text-[10px] font-mono text-center"${attr_style(`color: ${stringify(getInvestmentColor(weekdayStats().investmentPercent))}`)}>${escape_html(getInvestmentMessage(weekdayStats().investmentPercent, weekdayStats().worstWeekday))}</p></div></div> <div class="space-y-2"><div class="flex items-center gap-2"><h2 class="text-xs font-mono text-muted uppercase tracking-wider">Insights</h2> `);
      ChartGuideTooltip($$renderer2, spread_props([INSIGHTS_TOOLTIP]));
      $$renderer2.push(`<!----></div> <div class="grid gap-4 md:grid-cols-3"><!--[-->`);
      const each_array_3 = ensure_array_like(insights());
      for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
        let insight = each_array_3[$$index_3];
        $$renderer2.push(`<div class="bg-bg-secondary border border-border rounded-lg p-4 space-y-2"><div class="flex items-center gap-2"><svg class="w-4 h-4 text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 2v1m0 18v1m-9-10H2m20 0h-1m-2.636-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l.707.707M6.343 6.343l-.707-.707"></path><circle cx="12" cy="12" r="4"></circle></svg> <p class="text-[10px] font-mono text-muted uppercase tracking-[0.2em]">${escape_html(insight.title)}</p></div> <p class="text-sm text-foreground">${escape_html(insight.body)}</p></div>`);
      }
      $$renderer2.push(`<!--]--></div></div></div>`);
    }
    $$renderer2.push(`<!--]--></div></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
function _page($$renderer) {
  Stats($$renderer);
}
export {
  _page as default
};
