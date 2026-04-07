import Dexie from "dexie";
import { D as DEFAULT_USER_ID } from "./session.js";
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function normalizeWeekdays(value) {
  if (!Array.isArray(value)) {
    return void 0;
  }
  const weekdays = value.map((item) => Number(item)).filter((day) => Number.isFinite(day) && day >= 0 && day <= 6).map((day) => Math.trunc(day));
  const unique = Array.from(new Set(weekdays));
  const sorted = unique.sort((a, b) => WEEKDAY_ORDER.indexOf(a) - WEEKDAY_ORDER.indexOf(b));
  return sorted.length === 0 ? void 0 : sorted;
}
function normalizeWeeksOfMonth(value) {
  if (!Array.isArray(value)) {
    return void 0;
  }
  const allowed = [1, 2, 3, 4, "last"];
  const weeks = value.map((entry) => entry === "last" ? "last" : Number(entry)).filter((week) => allowed.includes(week));
  const unique = Array.from(new Set(weeks));
  return unique.length === 0 ? void 0 : unique;
}
const scheduleBuilders = {
  daily: () => ({ type: "daily" }),
  weekly_days: (candidate) => {
    const weekdays = normalizeWeekdays(candidate.weekdays);
    if (!weekdays) {
      return void 0;
    }
    return { type: "weekly_days", weekdays };
  },
  weekly_quota: (candidate) => {
    const timesPerWeek = Number(candidate.timesPerWeek);
    if (!Number.isFinite(timesPerWeek) || timesPerWeek <= 0) {
      return void 0;
    }
    const weekdays = normalizeWeekdays(candidate.weekdays);
    return { type: "weekly_quota", timesPerWeek: Math.trunc(timesPerWeek), weekdays: weekdays ?? void 0 };
  },
  monthly_weeks: (candidate) => {
    const weeksOfMonth = normalizeWeeksOfMonth(candidate.weeksOfMonth);
    const weekdays = normalizeWeekdays(candidate.weekdays);
    if (!weeksOfMonth || !weekdays) {
      return void 0;
    }
    return { type: "monthly_weeks", weeksOfMonth, weekdays };
  },
  monthly_quota: (candidate) => {
    const timesPerMonth = Number(candidate.timesPerMonth);
    if (!Number.isFinite(timesPerMonth) || timesPerMonth <= 0) {
      return void 0;
    }
    const weekdays = normalizeWeekdays(candidate.weekdays);
    return { type: "monthly_quota", timesPerMonth: Math.trunc(timesPerMonth), weekdays: weekdays ?? void 0 };
  }
};
function normalizeSchedule(value) {
  if (!value || typeof value !== "object") {
    return void 0;
  }
  const candidate = value;
  const builder = candidate.type ? scheduleBuilders[candidate.type] : void 0;
  return builder ? builder(candidate) : void 0;
}
const LEGACY_WEEKDAY_MAP = {
  weekdays: [1, 2, 3, 4, 5],
  weekends: [0, 6]
};
function scheduleFromLegacy(frequency, customDays) {
  if (frequency === "daily") {
    return { type: "daily" };
  }
  if (frequency === "weekdays") {
    return { type: "weekly_days", weekdays: LEGACY_WEEKDAY_MAP.weekdays };
  }
  if (frequency === "weekends") {
    return { type: "weekly_days", weekdays: LEGACY_WEEKDAY_MAP.weekends };
  }
  const weekdays = normalizeWeekdays(customDays);
  if (weekdays) {
    return { type: "weekly_days", weekdays };
  }
  return { type: "daily" };
}
function describeSchedule(schedule) {
  if (!schedule) {
    return "Daily";
  }
  switch (schedule.type) {
    case "daily":
      return "Daily";
    case "weekly_days":
      return `Every ${schedule.weekdays.map((day) => DAY_NAMES[day]).join(", ")}`;
    case "weekly_quota":
      return `${schedule.timesPerWeek}x a week` + (schedule.weekdays ? ` on ${schedule.weekdays.map((day) => DAY_NAMES[day]).join(", ")}` : "");
    case "monthly_weeks":
      return `${schedule.weeksOfMonth.map((week) => week === "last" ? "Last" : week + "th").join(", ")} week${schedule.weekdays.length > 1 ? "s" : ""} on ${schedule.weekdays.map((day) => DAY_NAMES[day]).join(", ")}`;
    case "monthly_quota":
      return `${schedule.timesPerMonth}x a month` + (schedule.weekdays ? ` on ${schedule.weekdays.map((day) => DAY_NAMES[day]).join(", ")}` : "");
  }
}
function toSyncISO(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return (/* @__PURE__ */ new Date()).toISOString().replace(/\.\d+Z$/, "Z");
  }
  return d.toISOString().replace(/\.\d+Z$/, "Z");
}
function nowSyncISO() {
  return toSyncISO(/* @__PURE__ */ new Date());
}
const DEFAULT_TIMEZONE = "UTC";
function getFormatter(timeZone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}
function toZonedDateParts(date, timeZone) {
  const value = new Date(date);
  const formatter = getFormatter(normalizeTimeZone(timeZone));
  const parts = formatter.formatToParts(value);
  const partMap = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(partMap.year),
    month: Number(partMap.month),
    day: Number(partMap.day)
  };
}
function normalizeTimeZone(value, fallback = DEFAULT_TIMEZONE) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return fallback;
  }
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: value }).resolvedOptions().timeZone;
  } catch {
    return fallback;
  }
}
function formatCalendarDateInTimeZone(date, timeZone) {
  const parts = toZonedDateParts(date, timeZone);
  return `${parts.year.toString().padStart(4, "0")}-${parts.month.toString().padStart(2, "0")}-${parts.day.toString().padStart(2, "0")}`;
}
function extractCalendarDate(value) {
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}
function calendarDateToDate(value) {
  const [year, month, day] = value.split("-").map((segment) => Number(segment));
  return new Date(Date.UTC(year, month - 1, day));
}
function toCalendarDateKey(date, timeZone) {
  return `${formatCalendarDateInTimeZone(date, timeZone)}T00:00:00Z`;
}
function addDaysToCalendarDate(value, days) {
  const date = calendarDateToDate(value);
  date.setUTCDate(date.getUTCDate() + Math.trunc(days));
  return toSyncISO(date).slice(0, 10);
}
function getWeekdayFromCalendarDate(value) {
  return calendarDateToDate(value).getUTCDay();
}
const STORAGE_KEY = "habit-user-timezone";
function readStoredUserTimeZone() {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
function getBrowserTimeZone() {
  if (typeof Intl === "undefined") {
    return DEFAULT_TIMEZONE;
  }
  const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return normalizeTimeZone(resolved, DEFAULT_TIMEZONE);
}
let currentUserTimeZone = normalizeTimeZone(readStoredUserTimeZone(), getBrowserTimeZone());
function getCurrentUserTimeZone() {
  return currentUserTimeZone;
}
function setCurrentUserTimeZone(value) {
  const nextValue = normalizeTimeZone(value ?? null, getBrowserTimeZone());
  currentUserTimeZone = nextValue;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, nextValue);
    } catch {
    }
  }
  return nextValue;
}
function clearCurrentUserTimeZone() {
  currentUserTimeZone = getBrowserTimeZone();
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
    }
  }
}
function toCompletionKey(date, timeZone = getCurrentUserTimeZone()) {
  return toCalendarDateKey(date, timeZone);
}
function calendarDateToCompletionKey(calendarDate) {
  return `${calendarDate}T00:00:00Z`;
}
function completionKeyToCalendarDate(key) {
  return extractCalendarDate(key) ?? key.slice(0, 10);
}
function normalizeToCompletionKey(rawDate) {
  const calendarDate = extractCalendarDate(rawDate);
  return calendarDate ? `${calendarDate}T00:00:00Z` : rawDate;
}
function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
let currentUserId = DEFAULT_USER_ID;
function setCurrentUserId(userId) {
  currentUserId = DEFAULT_USER_ID;
}
function getCurrentUserId() {
  return currentUserId;
}
const normalizeCheckinDateKey = normalizeToCompletionKey;
class HabbitRunnerDb extends Dexie {
  habits;
  checkins;
  tombstones;
  sync_meta;
  outbox;
  pending_reminders;
  constructor() {
    super("habbitRunner");
    this.version(1).stores({
      habits: "id, userId, updatedAt, version",
      checkins: "id, userId, habitId, date, updatedAt, version",
      tombstones: "id, userId, entity, entityId, deletedAt",
      sync_meta: "id, status",
      outbox: "id, userId, entity, type, status"
    });
    this.version(2).stores({
      habits: "id, userId, updatedAt, version, sortOrder",
      checkins: "id, userId, habitId, date, updatedAt, version",
      tombstones: "id, userId, entity, entityId, deletedAt",
      sync_meta: "id, status",
      outbox: "id, userId, entity, type, status"
    }).upgrade(
      (transaction) => transaction.habits.toCollection().modify((record) => {
        if (record.sortOrder === void 0 || record.sortOrder === null) {
          record.sortOrder = Date.parse(record.createdAt) || Date.now();
        }
        if (!Object.prototype.hasOwnProperty.call(record, "reminderTime")) {
          record.reminderTime = null;
        }
        if (!Object.prototype.hasOwnProperty.call(record, "reminderEnabled")) {
          record.reminderEnabled = true;
        }
        if (!Object.prototype.hasOwnProperty.call(record, "dailyTarget")) {
          record.dailyTarget = 1;
        }
      })
    );
    this.version(3).stores({
      habits: "id, userId, updatedAt, version, sortOrder",
      checkins: "id, userId, habitId, date, updatedAt, version",
      tombstones: "id, userId, entity, entityId, deletedAt",
      sync_meta: "id, status",
      outbox: "id, userId, entity, type, status"
    }).upgrade(
      (transaction) => transaction.checkins.toCollection().modify((record) => {
        if (!Object.prototype.hasOwnProperty.call(record, "count")) {
          record.count = 1;
        }
      })
    );
    this.version(4).stores({
      habits: "id, userId, updatedAt, version, sortOrder",
      checkins: "id, userId, habitId, date, updatedAt, version",
      tombstones: "id, userId, entity, entityId, deletedAt",
      sync_meta: "id, status",
      outbox: "id, userId, entity, type, status"
    }).upgrade(
      (transaction) => transaction.habits.toCollection().modify((record) => {
        if (!Object.prototype.hasOwnProperty.call(record, "dailyTarget")) {
          record.dailyTarget = 1;
        }
      })
    );
    this.version(5).stores({
      habits: "id, userId, updatedAt, version, sortOrder",
      checkins: "id, userId, habitId, date, updatedAt, version",
      tombstones: "id, userId, entity, entityId, deletedAt",
      sync_meta: "id, status",
      outbox: "id, userId, entity, type, status",
      pending_reminders: "id, userId, habitId, createdAt"
    }).upgrade(async (transaction) => {
      const checkinsTable = transaction.table("checkins");
      const habitsTable = transaction.table("habits");
      await checkinsTable.toCollection().modify((record) => {
        if (record.date && record.date.length === 10) {
          record.date = `${record.date}T00:00:00Z`;
        }
      });
      await habitsTable.toCollection().modify((record) => {
        if (record.type === void 0) {
          record.type = "positive";
        }
      });
    });
    this.version(6).stores({
      habits: "id, userId, updatedAt, version, sortOrder",
      checkins: "id, userId, habitId, date, updatedAt, version",
      tombstones: "id, userId, entity, entityId, deletedAt",
      sync_meta: "id, status",
      outbox: "id, userId, entity, type, status",
      pending_reminders: "id, userId, habitId, createdAt"
    }).upgrade(async (transaction) => {
      const checkinsTable = transaction.table("checkins");
      await checkinsTable.toCollection().modify((record) => {
        if (record.date) {
          record.date = normalizeCheckinDateKey(record.date);
        }
      });
    });
  }
}
const db = new HabbitRunnerDb();
function habitEntityToDomain(entity) {
  return {
    id: entity.id,
    name: entity.name,
    description: entity.description ?? "",
    color: entity.color,
    icon: entity.icon,
    frequency: entity.frequency,
    customDays: entity.customDays,
    targetStreak: entity.targetStreak,
    dailyTarget: Math.max(1, Math.trunc(entity.dailyTarget ?? 1)),
    tags: entity.tags,
    completions: { ...entity.completions },
    freezeDays: entity.freezeDays ?? [],
    sortOrder: entity.sortOrder ?? Date.parse(entity.createdAt),
    reminderTime: entity.reminderTime ?? void 0,
    reminderEnabled: entity.reminderEnabled ?? true,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    version: entity.version,
    archived: entity.archived,
    type: entity.type ?? "positive",
    schedule: normalizeSchedule(entity.schedule) ?? scheduleFromLegacy(entity.frequency, entity.customDays)
  };
}
function domainToHabitEntity(habit) {
  const userId = getCurrentUserId();
  return {
    id: habit.id,
    userId,
    name: habit.name,
    description: habit.description,
    color: habit.color,
    icon: habit.icon,
    frequency: habit.frequency,
    targetStreak: habit.targetStreak,
    dailyTarget: Math.max(1, Math.trunc(habit.dailyTarget ?? 1)),
    tags: habit.tags,
    customDays: habit.customDays,
    schedule: habit.schedule,
    archived: habit.archived,
    completions: {},
    createdAt: habit.createdAt,
    updatedAt: habit.updatedAt ?? habit.createdAt,
    version: habit.version ?? 1,
    sortOrder: habit.sortOrder ?? Date.parse(habit.createdAt),
    reminderTime: habit.reminderTime ?? null,
    reminderEnabled: habit.reminderEnabled ?? true,
    freezeDays: habit.freezeDays ?? [],
    type: habit.type ?? "positive"
  };
}
async function persistHabitInDb(habit) {
  await db.habits.put(domainToHabitEntity(habit));
}
async function removeHabitFromDb(id) {
  const userId = getCurrentUserId();
  const target = await db.habits.get(id);
  if (target?.userId === userId) {
    await db.habits.delete(id);
  }
  await db.checkins.where({ habitId: id, userId }).delete();
}
async function upsertCheckinInDb(habitId, date, done, count = 1, updatedAt) {
  const userId = getCurrentUserId();
  const normalized = normalizeCheckinDateKey(date);
  const ts = updatedAt ?? nowSyncISO();
  const existing = await db.checkins.where("habitId").equals(habitId).filter(
    (record) => record.date === normalized && record.userId === userId
  ).first();
  if (existing) {
    const normalizedCount2 = Math.max(1, Math.trunc(count));
    await db.checkins.update(existing.id, {
      done,
      count: normalizedCount2,
      updatedAt: ts,
      version: Math.max(existing.version, 1) + 1
    });
    return ts;
  }
  const normalizedCount = Math.max(1, Math.trunc(count));
  await db.checkins.add({
    id: generateId(),
    userId,
    habitId,
    date: normalized,
    done,
    count: normalizedCount,
    updatedAt: ts,
    version: 1
  });
  return ts;
}
async function deleteCheckinInDb(habitId, date) {
  const userId = getCurrentUserId();
  const normalized = normalizeCheckinDateKey(date);
  const existing = await db.checkins.where("habitId").equals(habitId).filter(
    (record) => record.date === normalized && record.userId === userId
  ).first();
  if (existing) {
    await db.checkins.delete(existing.id);
    return existing;
  }
  return void 0;
}
async function enqueueOutboxEntry(entry) {
  await db.outbox.put(entry);
}
function createOutboxEntry(entity, type, payload) {
  const userId = getCurrentUserId();
  return {
    id: generateId(),
    userId,
    entity,
    type,
    payload,
    clientTime: nowSyncISO(),
    status: "pending",
    retryCount: 0,
    nextRetryAt: null,
    createdAt: nowSyncISO()
  };
}
function syncMetaId(userId) {
  return `meta:${userId}`;
}
async function ensureSyncMeta() {
  const userId = getCurrentUserId();
  const id = syncMetaId(userId);
  const existing = await db.sync_meta.get(id);
  if (existing) {
    return existing;
  }
  const meta = {
    id,
    status: "idle"
  };
  await db.sync_meta.put(meta);
  return meta;
}
async function updateSyncMeta(data) {
  const current = await ensureSyncMeta();
  await db.sync_meta.put({ ...current, ...data });
}
async function countPendingOutboxEntries() {
  const userId = getCurrentUserId();
  return await db.outbox.filter((entry) => entry.userId === userId && entry.status !== "inflight").count();
}
const ISO_NOW = () => (/* @__PURE__ */ new Date()).toISOString();
async function getReadyOutboxEntries(limit = 32) {
  const userId = getCurrentUserId();
  const now = ISO_NOW();
  return await db.outbox.filter(
    (entry) => entry.userId === userId && entry.status !== "inflight" && (!entry.nextRetryAt || entry.nextRetryAt <= now)
  ).sortBy("createdAt").then((entries) => entries.slice(0, limit));
}
async function markOutboxEntriesInflight(ids) {
  const userId = getCurrentUserId();
  await Promise.all(
    ids.map(async (id) => {
      const entry = await db.outbox.get(id);
      if (!entry || entry.userId !== userId) {
        return;
      }
      await db.outbox.update(id, {
        status: "inflight",
        lastError: void 0
      });
    })
  );
}
async function deleteOutboxEntries(ids) {
  if (ids.length === 0) {
    return;
  }
  await db.outbox.bulkDelete(ids);
}
async function updateOutboxEntryFailure(entry, reason, nextRetryAt) {
  await db.outbox.update(entry.id, {
    status: "failed",
    lastError: reason,
    retryCount: entry.retryCount + 1,
    nextRetryAt: nextRetryAt ?? (/* @__PURE__ */ new Date()).toISOString()
  });
}
export {
  db as A,
  getCurrentUserId as B,
  habitEntityToDomain as C,
  nowSyncISO as D,
  upsertCheckinInDb as E,
  deleteCheckinInDb as F,
  persistHabitInDb as G,
  createOutboxEntry as H,
  removeHabitFromDb as I,
  updateOutboxEntryFailure as a,
  clearCurrentUserTimeZone as b,
  countPendingOutboxEntries as c,
  deleteOutboxEntries as d,
  ensureSyncMeta as e,
  setCurrentUserTimeZone as f,
  getReadyOutboxEntries as g,
  getBrowserTimeZone as h,
  getCurrentUserTimeZone as i,
  completionKeyToCalendarDate as j,
  describeSchedule as k,
  enqueueOutboxEntry as l,
  markOutboxEntriesInflight as m,
  normalizeToCompletionKey as n,
  calendarDateToDate as o,
  addDaysToCalendarDate as p,
  extractCalendarDate as q,
  formatCalendarDateInTimeZone as r,
  setCurrentUserId as s,
  toCompletionKey as t,
  updateSyncMeta as u,
  calendarDateToCompletionKey as v,
  normalizeSchedule as w,
  scheduleFromLegacy as x,
  getWeekdayFromCalendarDate as y,
  toCalendarDateKey as z
};
