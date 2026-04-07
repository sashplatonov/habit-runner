import { r as readable, d as derived } from "./index.js";
import { e as ensureSyncMeta, u as updateSyncMeta, l as enqueueOutboxEntry, a as updateOutboxEntryFailure, t as toCompletionKey$1, i as getCurrentUserTimeZone, o as calendarDateToDate, p as addDaysToCalendarDate, q as extractCalendarDate, r as formatCalendarDateInTimeZone, v as calendarDateToCompletionKey, w as normalizeSchedule, x as scheduleFromLegacy, y as getWeekdayFromCalendarDate, z as toCalendarDateKey, n as normalizeToCompletionKey, A as db, B as getCurrentUserId, C as habitEntityToDomain, D as nowSyncISO, E as upsertCheckinInDb, F as deleteCheckinInDb, G as persistHabitInDb, H as createOutboxEntry } from "./db.js";
import { p as pullChanges, a as applyPullResponse, b as pushChanges, g as getBackoffMs } from "./sync.js";
import { customAlphabet } from "nanoid";
import { liveQuery } from "dexie";
function buildQueuedResult(entries, lastError, conflicts = 0) {
  return {
    status: "queued",
    applied: 0,
    queued: entries.length,
    conflicts,
    lastError
  };
}
function buildCompletionResult(pushResult, lastError) {
  return {
    status: pushResult.queuedEntries.length > 0 ? "queued" : "synced",
    applied: pushResult.appliedCount,
    queued: pushResult.queuedEntries.length,
    conflicts: pushResult.conflictCount,
    lastError
  };
}
async function queuePendingEntries(entries) {
  await Promise.all(entries.map(async (entry) => enqueueOutboxEntry(entry)));
}
async function queueRejectedEntries(entries, reasons) {
  await Promise.all(
    entries.map(async (entry) => {
      await enqueueOutboxEntry(entry);
      const reason = reasons.get(entry.id) ?? "push rejected";
      const nextRetryAt = new Date(
        Date.now() + getBackoffMs(entry.retryCount + 1)
      ).toISOString();
      await updateOutboxEntryFailure(entry, reason, nextRetryAt);
    })
  );
}
function getOfflineNavigator() {
  if (typeof navigator === "undefined") {
    return void 0;
  }
  return navigator;
}
function resolveSyncFailureStatus() {
  const currentNavigator = getOfflineNavigator();
  if (!currentNavigator?.onLine) {
    return "offline";
  }
  return "error";
}
async function queueAndMarkFailure(entries, message) {
  await queuePendingEntries(entries);
  await updateSyncMeta({
    status: resolveSyncFailureStatus(),
    lastError: message
  });
  return buildQueuedResult(entries, message);
}
async function performInitialPull(lastCursor) {
  const firstPull = await pullChanges(lastCursor);
  await applyPullResponse(firstPull);
  await updateSyncMeta({
    lastCursor: firstPull.nextCursor ?? lastCursor ?? firstPull.serverTime,
    lastSyncedAt: firstPull.serverTime,
    status: "syncing",
    lastError: void 0
  });
}
async function pushEntriesImmediately(entries) {
  const response = await pushChanges(entries);
  const appliedSet = new Set(response.applied);
  const queuedEntries = entries.filter((entry) => !appliedSet.has(entry.id));
  const reasons = new Map(
    response.conflicts.map((conflict) => [conflict.opId, conflict.reason])
  );
  await queueRejectedEntries(queuedEntries, reasons);
  await updateSyncMeta({
    lastSyncedAt: response.serverTime
  });
  return {
    appliedCount: response.applied.length,
    queuedEntries,
    conflictCount: response.conflicts.length,
    serverTime: response.serverTime
  };
}
async function finalizeSync(pushResult) {
  const secondPull = await pullChanges();
  await applyPullResponse(secondPull);
  const queuedMessage = pushResult.queuedEntries.length > 0 ? "Some changes were queued for retry" : void 0;
  await updateSyncMeta({
    lastCursor: secondPull.nextCursor ?? secondPull.serverTime,
    lastSyncedAt: secondPull.serverTime,
    status: pushResult.queuedEntries.length > 0 ? "error" : "idle",
    lastError: queuedMessage
  });
  return buildCompletionResult(pushResult, queuedMessage);
}
async function queueForOffline(entries) {
  const message = "network unavailable";
  await queuePendingEntries(entries);
  await updateSyncMeta({
    status: "offline",
    lastError: message
  });
  return buildQueuedResult(entries, message);
}
async function syncEntriesWithFallback(entries) {
  if (entries.length === 0) {
    return { status: "synced", applied: 0, queued: 0, conflicts: 0 };
  }
  if (!getOfflineNavigator()?.onLine) {
    return queueForOffline(entries);
  }
  const meta = await ensureSyncMeta();
  try {
    await performInitialPull(meta.lastCursor);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return queueAndMarkFailure(entries, message);
  }
  let pushResult;
  try {
    pushResult = await pushEntriesImmediately(entries);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return queueAndMarkFailure(entries, message);
  }
  try {
    return await finalizeSync(pushResult);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await updateSyncMeta({
      status: resolveSyncFailureStatus(),
      lastSyncedAt: pushResult.serverTime,
      lastError: message
    });
    return buildCompletionResult(pushResult, message);
  }
}
customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 4);
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function toCalendarDate$1(value, timeZone) {
  if (typeof value === "string") {
    const extracted = extractCalendarDate(value);
    if (extracted) {
      return extracted;
    }
  }
  return formatCalendarDateInTimeZone(value, timeZone);
}
function shiftCalendarMonth$1(value, delta) {
  const date = calendarDateToDate(value);
  date.setUTCMonth(date.getUTCMonth() + delta, 1);
  return date.toISOString().slice(0, 10);
}
function getDaysInCalendarMonth$1(value) {
  const date = calendarDateToDate(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
}
function formatDate(date, timeZone = getCurrentUserTimeZone()) {
  return toCompletionKey$1(date, timeZone);
}
function countCompletedDays(completions, dailyTarget = 1) {
  return Object.values(completions).filter((count) => (count ?? 0) >= dailyTarget).length;
}
function buildWeeklyCompletionData(completions, weeks = 12, referenceDate = /* @__PURE__ */ new Date(), dailyTarget = 1, timeZone = getCurrentUserTimeZone()) {
  const today = toCalendarDate$1(referenceDate, timeZone);
  const data = [];
  for (let weekOffset = weeks - 1; weekOffset >= 0; weekOffset -= 1) {
    let count = 0;
    for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
      const cursor = addDaysToCalendarDate(today, -(weekOffset * 7 + dayOffset));
      const key = calendarDateToCompletionKey(cursor);
      if ((completions[key] ?? 0) >= dailyTarget) {
        count += 1;
      }
    }
    const weekStart = addDaysToCalendarDate(today, -(weekOffset * 7));
    const labelDate = calendarDateToDate(weekStart);
    data.push({
      week: `W${labelDate.getUTCMonth() + 1}/${labelDate.getUTCDate()}`,
      count
    });
  }
  return data;
}
function buildMonthlyCompletionRates(completions, months = 6, referenceDate = /* @__PURE__ */ new Date(), dailyTarget = 1, timeZone = getCurrentUserTimeZone()) {
  const today = toCalendarDate$1(referenceDate, timeZone);
  const todayDate = calendarDateToDate(today);
  const data = [];
  for (let monthOffset = months - 1; monthOffset >= 0; monthOffset -= 1) {
    const monthStart = shiftCalendarMonth$1(`${today.slice(0, 7)}-01`, -monthOffset);
    const daysInMonth = getDaysInCalendarMonth$1(monthStart);
    let completed = 0;
    for (let day = 0; day < daysInMonth; day += 1) {
      const cursor = addDaysToCalendarDate(monthStart, day);
      if (cursor > today) {
        break;
      }
      const key = calendarDateToCompletionKey(cursor);
      if ((completions[key] ?? 0) >= dailyTarget) {
        completed += 1;
      }
    }
    const monthDate = calendarDateToDate(monthStart);
    const daysElapsed = monthDate.getUTCFullYear() === todayDate.getUTCFullYear() && monthDate.getUTCMonth() === todayDate.getUTCMonth() ? todayDate.getUTCDate() : daysInMonth;
    data.push({
      month: MONTH_NAMES[monthDate.getUTCMonth()],
      rate: Math.round(completed / Math.max(1, daysElapsed) * 100)
    });
  }
  return data;
}
const WEEKLY_RATE_WINDOW = 12;
const MONTH_LOOKBACK = 12;
const MONTHLY_RATE_WINDOW = 6;
function toCalendarDate(value, timeZone) {
  if (typeof value === "string") {
    const extracted = extractCalendarDate(value);
    if (extracted) {
      return extracted;
    }
  }
  return formatCalendarDateInTimeZone(value, timeZone);
}
function toCompletionKey(value, timeZone) {
  if (typeof value === "string") {
    const extracted = extractCalendarDate(value);
    if (extracted) {
      return `${extracted}T00:00:00Z`;
    }
  }
  return toCalendarDateKey(value, timeZone);
}
function shiftCalendarMonth(value, delta) {
  const date = calendarDateToDate(value);
  date.setUTCMonth(date.getUTCMonth() + delta, 1);
  return toCalendarDate(date, "UTC");
}
function getDaysInCalendarMonth(value) {
  const date = calendarDateToDate(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
}
function startOfWeek(date, timeZone) {
  const calendarDate = toCalendarDate(date, timeZone);
  const day = (getWeekdayFromCalendarDate(calendarDate) + 6) % 7;
  return addDaysToCalendarDate(calendarDate, -day);
}
function endOfWeek(date, timeZone) {
  return addDaysToCalendarDate(startOfWeek(date, timeZone), 6);
}
function startOfMonth(date, timeZone) {
  const calendarDate = toCalendarDate(date, timeZone);
  return `${calendarDate.slice(0, 7)}-01`;
}
function endOfMonth(date, timeZone) {
  const monthStart = startOfMonth(date, timeZone);
  return addDaysToCalendarDate(shiftCalendarMonth(monthStart, 1), -1);
}
function getWeekOfMonth(calendarDate) {
  const first = `${calendarDate.slice(0, 7)}-01`;
  const offset = (getWeekdayFromCalendarDate(first) + 6) % 7;
  const dayOfMonth = Number(calendarDate.slice(8, 10));
  const adjusted = dayOfMonth + offset;
  const week = Math.min(4, Math.ceil(adjusted / 7));
  const monthEnd = `${calendarDate.slice(0, 7)}-${getDaysInCalendarMonth(calendarDate).toString().padStart(2, "0")}`;
  const lastWeekStart = addDaysToCalendarDate(monthEnd, -((getWeekdayFromCalendarDate(monthEnd) + 6) % 7));
  return { week, isLast: calendarDate >= lastWeekStart };
}
function getMonthWeekToken(isLast, week) {
  return isLast ? "last" : Math.min(4, Math.max(1, week));
}
function dayIsCompleted(completions, value, dailyTarget, timeZone) {
  return (completions[toCompletionKey(value, timeZone)] ?? 0) >= Math.max(1, dailyTarget ?? 1);
}
function isSuccessfulCompletion(habit, completions, key, dailyTarget) {
  if (habit.type === "negative") {
    return (completions[key] ?? 0) === 0;
  }
  return (completions[key] ?? 0) >= dailyTarget;
}
function buildQuotaMatches({
  periodWindow,
  getBoundaries,
  schedule,
  habit,
  completions,
  dailyTarget,
  periodTarget,
  timeZone
}) {
  const today = toCalendarDate(/* @__PURE__ */ new Date(), timeZone);
  const meetsTarget = [];
  for (let offset = 0; offset < periodWindow; offset += 1) {
    const { start, end } = getBoundaries(offset);
    if (end > today) {
      meetsTarget.push(null);
      continue;
    }
    let frozenCount = 0;
    for (let cursor = start; cursor <= end; cursor = addDaysToCalendarDate(cursor, 1)) {
      if (isScheduledForDate(schedule, cursor, timeZone) && habit.freezeDays?.includes(cursor)) {
        frozenCount += 1;
      }
    }
    const adjustedTarget = Math.max(0, periodTarget - frozenCount);
    const completed = countCompletedDaysInRange(completions, start, end, dailyTarget, schedule, timeZone);
    meetsTarget.push(completed >= adjustedTarget);
  }
  return meetsTarget;
}
function summarizeBooleanStreak(values) {
  let current = 0;
  for (const value of values) {
    if (value !== true) {
      break;
    }
    current += 1;
  }
  let longest = 0;
  let running = 0;
  for (const value of values) {
    if (value === true) {
      running += 1;
      continue;
    }
    longest = Math.max(longest, running);
    running = 0;
  }
  return {
    current,
    longest: Math.max(longest, running),
    metCount: values.filter((value) => value === true).length
  };
}
function isSkippedStreakDay(habit, schedule, value, timeZone) {
  const freezeKey = toCalendarDate(value, timeZone);
  return !isScheduledForDate(schedule, freezeKey, timeZone) || habit.freezeDays?.includes(freezeKey) === true;
}
function findStreakStartDate(habit, completions, schedule, referenceDate, dailyTarget, timeZone) {
  const today = toCalendarDate(/* @__PURE__ */ new Date(), timeZone);
  const cursor = toCalendarDate(referenceDate, timeZone);
  const isReferenceToday = cursor === today;
  const isTodayScheduled = !isSkippedStreakDay(habit, schedule, today, timeZone);
  const isTodayCompleted = isSuccessfulCompletion(habit, completions, toCompletionKey(today, timeZone), dailyTarget);
  if (!isReferenceToday || !isTodayScheduled || isTodayCompleted) {
    return cursor;
  }
  return addDaysToCalendarDate(cursor, -1);
}
function calculateLongestDailyStreak({
  habit,
  completions,
  schedule,
  start,
  end,
  dailyTarget,
  timeZone
}) {
  let longest = 0;
  let running = 0;
  for (let cursor = start; cursor <= end; cursor = addDaysToCalendarDate(cursor, 1)) {
    if (isSkippedStreakDay(habit, schedule, cursor, timeZone)) {
      continue;
    }
    if (isSuccessfulCompletion(habit, completions, toCompletionKey(cursor, timeZone), dailyTarget)) {
      running += 1;
      continue;
    }
    longest = Math.max(longest, running);
    running = 0;
  }
  return Math.max(longest, running);
}
function calculateCurrentDailyStreak({
  habit,
  completions,
  schedule,
  start,
  end,
  dailyTarget,
  timeZone
}) {
  let current = 0;
  for (let cursor = end; cursor >= start; cursor = addDaysToCalendarDate(cursor, -1)) {
    if (isSkippedStreakDay(habit, schedule, cursor, timeZone)) {
      continue;
    }
    if (!isSuccessfulCompletion(habit, completions, toCompletionKey(cursor, timeZone), dailyTarget)) {
      break;
    }
    current += 1;
  }
  return current;
}
function isScheduledForDate(schedule, value, timeZone = getCurrentUserTimeZone()) {
  if (!schedule) {
    return true;
  }
  const calendarDate = toCalendarDate(value, timeZone);
  const weekday = getWeekdayFromCalendarDate(calendarDate);
  switch (schedule.type) {
    case "daily":
      return true;
    case "weekly_days":
      return schedule.weekdays.includes(weekday);
    case "weekly_quota":
      return schedule.weekdays ? schedule.weekdays.includes(weekday) : true;
    case "monthly_weeks": {
      if (!schedule.weekdays.includes(weekday)) {
        return false;
      }
      const { week, isLast } = getWeekOfMonth(calendarDate);
      return schedule.weeksOfMonth.includes(getMonthWeekToken(isLast, week));
    }
    case "monthly_quota":
      return schedule.weekdays ? schedule.weekdays.includes(weekday) : true;
    default:
      return true;
  }
}
function isMandatoryToday(habit, date, timeZone = getCurrentUserTimeZone()) {
  const schedule = resolveHabitSchedule(habit);
  const today = toCalendarDate(date, timeZone);
  if (!isScheduledForDate(schedule, today, timeZone)) {
    return false;
  }
  if (schedule.type === "weekly_quota") {
    const windowStart = addDaysToCalendarDate(today, -6);
    const dailyTarget = Math.max(1, habit.dailyTarget ?? 1);
    const completed = countCompletedDaysInRange(
      habit.completions,
      windowStart,
      today,
      dailyTarget,
      void 0,
      timeZone
    );
    return completed < schedule.timesPerWeek;
  }
  if (schedule.type === "monthly_quota") {
    const completed = countCompletedDaysInRange(
      habit.completions,
      addDaysToCalendarDate(today, -29),
      today,
      Math.max(1, habit.dailyTarget ?? 1),
      void 0,
      timeZone
    );
    return completed < schedule.timesPerMonth;
  }
  return true;
}
function countCompletedDaysInRange(completions, start, end, dailyTarget, schedule, timeZone = getCurrentUserTimeZone()) {
  const startDate = toCalendarDate(start, timeZone);
  const endDate = toCalendarDate(end, timeZone);
  let count = 0;
  for (let cursor = startDate; cursor <= endDate; cursor = addDaysToCalendarDate(cursor, 1)) {
    if (schedule && !isScheduledForDate(schedule, cursor, timeZone)) {
      continue;
    }
    if (dayIsCompleted(completions, cursor, dailyTarget, timeZone)) {
      count += 1;
    }
  }
  return count;
}
function resolveHabitSchedule(habit) {
  return normalizeSchedule(habit.schedule) ?? scheduleFromLegacy(habit.frequency, habit.customDays);
}
function getScheduleStatusForDate(habit, date, timeZone = getCurrentUserTimeZone()) {
  if (habit.freezeDays?.includes(toCalendarDate(date, timeZone))) {
    return "frozen";
  }
  const schedule = resolveHabitSchedule(habit);
  return isScheduledForDate(schedule, date, timeZone) ? "scheduled" : "unscheduled";
}
function getWeekRange(date, timeZone = getCurrentUserTimeZone()) {
  return { start: startOfWeek(date, timeZone), end: endOfWeek(date, timeZone) };
}
function getMonthRange(date, timeZone = getCurrentUserTimeZone()) {
  return { start: startOfMonth(date, timeZone), end: endOfMonth(date, timeZone) };
}
function countScheduledDaysInRange(habit, start, end, timeZone) {
  const schedule = resolveHabitSchedule(habit);
  let count = 0;
  for (let cursor = start; cursor <= end; cursor = addDaysToCalendarDate(cursor, 1)) {
    if (isScheduledForDate(schedule, cursor, timeZone)) {
      count += 1;
    }
  }
  return count;
}
function buildWeekBoundaries(reference, back, timeZone) {
  const base = getWeekRange(reference, timeZone);
  const shift = back * 7;
  return {
    start: addDaysToCalendarDate(base.start, -shift),
    end: addDaysToCalendarDate(base.end, -shift)
  };
}
function buildMonthBoundaries(reference, back, timeZone) {
  const start = shiftCalendarMonth(getMonthRange(reference, timeZone).start, -back);
  return {
    start,
    end: addDaysToCalendarDate(shiftCalendarMonth(start, 1), -1)
  };
}
function calculateQuotaStreak(habit, completions, referenceDate, periodWindow, periodTarget, timeZone) {
  const dailyTarget = Math.max(1, habit.dailyTarget ?? 1);
  const schedule = resolveHabitSchedule(habit);
  return summarizeBooleanStreak(
    buildQuotaMatches({
      periodWindow,
      getBoundaries: (offset) => buildWeekBoundaries(referenceDate, offset, timeZone),
      schedule,
      habit,
      completions,
      dailyTarget,
      periodTarget,
      timeZone
    })
  );
}
function calculateMonthlyQuotaStreak(habit, completions, referenceDate, timeZone) {
  const dailyTarget = Math.max(1, habit.dailyTarget ?? 1);
  const schedule = resolveHabitSchedule(habit);
  if (schedule.type !== "monthly_quota") {
    return { current: 0, longest: 0, metCount: 0 };
  }
  return summarizeBooleanStreak(
    buildQuotaMatches({
      periodWindow: MONTH_LOOKBACK,
      getBoundaries: (offset) => buildMonthBoundaries(referenceDate, offset, timeZone),
      schedule,
      habit,
      completions,
      dailyTarget,
      periodTarget: schedule.timesPerMonth,
      timeZone
    })
  );
}
function calculateDailyStreak(habit, completions, schedule, referenceDate, timeZone) {
  const dailyTarget = Math.max(1, habit.dailyTarget ?? 1);
  const streakStartDate = findStreakStartDate(habit, completions, schedule, referenceDate, dailyTarget, timeZone);
  const start = addDaysToCalendarDate(streakStartDate, -366);
  return {
    current: calculateCurrentDailyStreak({
      habit,
      completions,
      schedule,
      start,
      end: streakStartDate,
      dailyTarget,
      timeZone
    }),
    longest: calculateLongestDailyStreak({
      habit,
      completions,
      schedule,
      start,
      end: streakStartDate,
      dailyTarget,
      timeZone
    })
  };
}
function calculateScheduledStreak(habit, completions, referenceDate = /* @__PURE__ */ new Date(), timeZone = getCurrentUserTimeZone()) {
  const schedule = resolveHabitSchedule(habit);
  if (schedule.type === "weekly_quota") {
    const result = calculateQuotaStreak(habit, completions, referenceDate, WEEKLY_RATE_WINDOW, schedule.timesPerWeek, timeZone);
    return { current: result.current, longest: result.longest };
  }
  if (schedule.type === "monthly_quota") {
    const result = calculateMonthlyQuotaStreak(habit, completions, referenceDate, timeZone);
    return { current: result.current, longest: result.longest };
  }
  return calculateDailyStreak(habit, completions, schedule, referenceDate, timeZone);
}
function calculateScheduledCompletionRate(habit, completions, referenceDate = /* @__PURE__ */ new Date(), timeZone = getCurrentUserTimeZone()) {
  const schedule = resolveHabitSchedule(habit);
  if (schedule.type === "weekly_quota") {
    const result = calculateQuotaStreak(habit, completions, referenceDate, WEEKLY_RATE_WINDOW, schedule.timesPerWeek, timeZone);
    return Math.round(result.metCount / WEEKLY_RATE_WINDOW * 100);
  }
  if (schedule.type === "monthly_quota") {
    const result = calculateMonthlyQuotaStreak(habit, completions, referenceDate, timeZone);
    return Math.round(result.metCount / MONTHLY_RATE_WINDOW * 100);
  }
  const end = toCalendarDate(referenceDate, timeZone);
  const start = addDaysToCalendarDate(end, -29);
  const scheduledDays = countScheduledDaysInRange(habit, start, end, timeZone);
  if (scheduledDays === 0) {
    return 0;
  }
  const completed = countCompletedDaysInRange(completions, start, end, Math.max(1, habit.dailyTarget ?? 1), schedule, timeZone);
  return Math.round(completed / scheduledDays * 100);
}
function calculateAutomatismScore(habit, completions, referenceDate = /* @__PURE__ */ new Date(), timeZone = getCurrentUserTimeZone()) {
  const consistency30d = calculateScheduledCompletionRate(habit, completions, referenceDate, timeZone) / 100;
  const { current: streak } = calculateScheduledStreak(habit, completions, referenceDate, timeZone);
  const totalCompleted = Object.values(completions).filter(
    (count) => (count ?? 0) >= Math.max(1, habit.dailyTarget ?? 1)
  ).length;
  const streakFactor = Math.min(streak / 66, 1);
  const totalFactor = Math.min(totalCompleted / 100, 1);
  return Math.min(100, Math.round((consistency30d * 0.5 + streakFactor * 0.3 + totalFactor * 0.2) * 100));
}
function liveQueryStore(query) {
  return readable(void 0, (set) => {
    const observable = liveQuery(() => query());
    const subscription = observable.subscribe({
      next(result) {
        set(result);
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  });
}
function buildCompletionsByHabitId(checkins = []) {
  const map = {};
  for (const checkin of checkins) {
    if (!checkin.done) {
      continue;
    }
    const habitMap = map[checkin.habitId] ?? {};
    const completionKey = normalizeToCompletionKey(checkin.date);
    habitMap[completionKey] = (habitMap[completionKey] ?? 0) + Math.max(1, checkin.count ?? 1);
    map[checkin.habitId] = habitMap;
  }
  return map;
}
function applyFreezeDays(baseCompletions, freezeDays, dailyTarget) {
  (freezeDays ?? []).forEach((date) => {
    const completionKey = date.includes("T") ? date : `${date}T00:00:00Z`;
    const existing = baseCompletions[completionKey] ?? 0;
    baseCompletions[completionKey] = Math.max(dailyTarget, existing);
  });
}
function buildHabitFromEntity(entity, completionsByHabitId) {
  const domain = habitEntityToDomain(entity);
  const dailyTarget = Math.max(1, domain.dailyTarget ?? 1);
  const completions = { ...completionsByHabitId[domain.id] ?? {} };
  applyFreezeDays(completions, domain.freezeDays, dailyTarget);
  return {
    ...domain,
    completions
  };
}
function mapHabits(entities, completionsByHabitId) {
  return entities.map((entity) => buildHabitFromEntity(entity, completionsByHabitId));
}
function sortHabitsByOrder(habits) {
  const sorted = [...habits];
  return sorted.sort((a, b) => {
    const first = a.sortOrder ?? 0;
    const second = b.sortOrder ?? 0;
    if (first !== second) {
      return first - second;
    }
    return a.createdAt.localeCompare(b.createdAt);
  });
}
async function toggleCompletionImpl(habitId, date, userId) {
  const key = date || formatDate(/* @__PURE__ */ new Date());
  const existingCheckin = await db.checkins.where("habitId").equals(habitId).filter((record) => record.date === key && record.userId === userId && record.done).first();
  const currentCount = existingCheckin && existingCheckin.done ? Math.max(1, Math.trunc(existingCheckin.count ?? 1)) : 0;
  const nextCount = currentCount > 0 ? 0 : 1;
  let ts = nowSyncISO();
  let deletedEntity;
  if (nextCount > 0) {
    ts = await upsertCheckinInDb(habitId, key, true, nextCount);
  } else {
    deletedEntity = await deleteCheckinInDb(habitId, key);
  }
  const entity = await db.habits.get(habitId);
  if (entity) {
    const updatedHabit = {
      ...habitEntityToDomain(entity),
      updatedAt: ts,
      version: (entity.version ?? 0) + 1
    };
    await persistHabitInDb(updatedHabit);
  }
  const payload = nextCount === 0 ? { habitId, date: key, updatedAt: ts, id: deletedEntity?.id } : {
    habitId,
    date: key,
    done: true,
    count: nextCount,
    updatedAt: ts,
    version: entity?.version ?? 1
  };
  const entry = createOutboxEntry("checkin", nextCount === 0 ? "delete" : "upsert", payload);
  await syncEntriesWithFallback([entry]);
  return { habitId, date: key, count: nextCount };
}
function toggleCompletion(habitId, date) {
  const userId = getCurrentUserId();
  return toggleCompletionImpl(habitId, date, userId);
}
function getHabitStats(habitId, allHabits) {
  const habit = allHabits.find((item) => item.id === habitId);
  if (!habit) {
    return {
      totalDays: 0,
      completedDays: 0,
      currentStreak: 0,
      longestStreak: 0,
      completionRate: 0,
      automatismScore: 0,
      weeklyData: [],
      monthlyData: []
    };
  }
  const dailyTarget = Math.max(1, habit.dailyTarget ?? 1);
  const { current, longest } = calculateScheduledStreak(habit, habit.completions, /* @__PURE__ */ new Date());
  const completionRate = calculateScheduledCompletionRate(habit, habit.completions, /* @__PURE__ */ new Date());
  const completedDays = countCompletedDays(habit.completions, dailyTarget);
  const totalDays = Math.max(
    1,
    Math.ceil((Date.now() - new Date(habit.createdAt).getTime()) / 864e5)
  );
  return {
    totalDays,
    completedDays,
    currentStreak: current,
    longestStreak: longest,
    completionRate,
    automatismScore: calculateAutomatismScore(habit, habit.completions, /* @__PURE__ */ new Date()),
    weeklyData: buildWeeklyCompletionData(habit.completions, 12, /* @__PURE__ */ new Date(), dailyTarget),
    monthlyData: buildMonthlyCompletionRates(habit.completions, 6, /* @__PURE__ */ new Date(), dailyTarget)
  };
}
function createHabitsStore() {
  const currentUserId = getCurrentUserId();
  const habitEntities = liveQueryStore(
    () => db.habits.where({ userId: currentUserId }).toArray()
  );
  const checkinEntities = liveQueryStore(
    () => db.checkins.where({ userId: currentUserId }).toArray()
  );
  const completionsByHabitId = derived(
    checkinEntities,
    ($checkins) => buildCompletionsByHabitId($checkins ?? [])
  );
  const allHabits = derived(
    [habitEntities, completionsByHabitId],
    ([$entities, $completions]) => mapHabits($entities ?? [], $completions)
  );
  const habits = derived(
    allHabits,
    ($all) => sortHabitsByOrder($all.filter((h) => !h.archived))
  );
  const orderedAllHabits = derived(allHabits, ($all) => sortHabitsByOrder($all));
  return {
    habits,
    allHabits: orderedAllHabits
  };
}
const habitsStore = createHabitsStore();
export {
  calculateScheduledStreak as a,
  isScheduledForDate as b,
  calculateScheduledCompletionRate as c,
  getHabitStats as d,
  formatDate as f,
  getScheduleStatusForDate as g,
  habitsStore as h,
  isMandatoryToday as i,
  resolveHabitSchedule as r,
  toggleCompletion as t
};
