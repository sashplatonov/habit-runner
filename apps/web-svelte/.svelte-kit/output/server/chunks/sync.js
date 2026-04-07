import { A as db, n as normalizeToCompletionKey, I as removeHabitFromDb, F as deleteCheckinInDb, B as getCurrentUserId } from "./db.js";
import { A as API_BASE_URL, g as getValidAccessToken } from "./session.js";
function shouldApplyRemoteRecord(existing, incomingUpdatedAt, incomingVersion) {
  if (!existing) {
    return true;
  }
  const existingTs = Date.parse(existing.updatedAt);
  const incomingTs = Date.parse(incomingUpdatedAt);
  if (!Number.isNaN(existingTs) && !Number.isNaN(incomingTs) && existingTs !== incomingTs) {
    return incomingTs > existingTs;
  }
  return incomingVersion >= existing.version;
}
function normalizeRemoteType(value) {
  return value === "negative" ? "negative" : "positive";
}
function mapRemoteHabitToEntity(habit, userId) {
  return {
    id: habit.id,
    userId,
    name: habit.name,
    description: habit.description ?? null,
    color: habit.color,
    icon: habit.icon,
    frequency: habit.frequency,
    targetStreak: habit.targetStreak,
    dailyTarget: Math.max(1, Math.trunc(habit.dailyTarget ?? 1)),
    tags: habit.tags ?? [],
    customDays: Array.isArray(habit.customDays) ? habit.customDays.filter((day) => typeof day === "number") : void 0,
    schedule: habit.schedule,
    archived: habit.archived,
    createdAt: habit.createdAt,
    updatedAt: habit.updatedAt,
    version: habit.version,
    sortOrder: typeof habit.sortOrder === "number" ? habit.sortOrder : Date.parse(habit.createdAt) || Date.now(),
    reminderTime: typeof habit.reminderTime === "string" ? habit.reminderTime : null,
    reminderEnabled: habit.reminderEnabled ?? true,
    freezeDays: Array.isArray(habit.freezeDays) ? habit.freezeDays : [],
    completions: {},
    type: normalizeRemoteType(habit.type)
  };
}
async function applyCheckinUpsert(checkin, userId) {
  const normalizedDate = normalizeToCompletionKey(checkin.date);
  const existingCheckin = await db.checkins.get(checkin.id);
  if (!shouldApplyRemoteRecord(existingCheckin, checkin.updatedAt, checkin.version)) {
    return;
  }
  await db.checkins.where("habitId").equals(checkin.habitId).filter(
    (record) => record.date === normalizedDate && record.userId === userId && record.id !== checkin.id
  ).delete();
  await db.checkins.put({
    id: checkin.id,
    userId,
    habitId: checkin.habitId,
    date: normalizedDate,
    done: checkin.done,
    count: Math.max(1, Math.trunc(checkin.count ?? 1)),
    updatedAt: checkin.updatedAt,
    version: checkin.version
  });
}
async function applyHabitTombstone(tombstone) {
  const existingHabit = await db.habits.get(tombstone.entityId);
  if (existingHabit && !shouldApplyRemoteRecord(
    existingHabit,
    tombstone.deletedAt,
    Math.max(tombstone.version, existingHabit.version)
  )) {
    return;
  }
  await removeHabitFromDb(tombstone.entityId);
}
async function applySimpleCheckinTombstone(tombstone) {
  const existingCheckin = await db.checkins.get(tombstone.entityId);
  if (existingCheckin && !shouldApplyRemoteRecord(
    existingCheckin,
    tombstone.deletedAt,
    Math.max(tombstone.version, existingCheckin.version)
  )) {
    return;
  }
  await db.checkins.delete(tombstone.entityId);
}
async function applyDatedCheckinTombstone(tombstone, userId) {
  const [habitId, date] = tombstone.entityId.split(":");
  if (!habitId || !date) {
    return;
  }
  const normalizedDate = normalizeToCompletionKey(date);
  const existingCheckin = await db.checkins.where("habitId").equals(habitId).filter((record) => record.date === normalizedDate && record.userId === userId).first();
  if (existingCheckin && !shouldApplyRemoteRecord(
    existingCheckin,
    tombstone.deletedAt,
    Math.max(tombstone.version, existingCheckin.version)
  )) {
    return;
  }
  await deleteCheckinInDb(habitId, date);
}
async function applyTombstone(tombstone, userId) {
  if (tombstone.entity === "habit") {
    await applyHabitTombstone(tombstone);
    return;
  }
  if (tombstone.entity !== "checkin") {
    return;
  }
  if (!tombstone.entityId.includes(":")) {
    await applySimpleCheckinTombstone(tombstone);
    return;
  }
  await applyDatedCheckinTombstone(tombstone, userId);
}
async function applyPullResponse(response) {
  const userId = getCurrentUserId();
  const habitPromises = response.habits.map(async (habit) => {
    const existingHabit = await db.habits.get(habit.id);
    if (!shouldApplyRemoteRecord(existingHabit, habit.updatedAt, habit.version)) {
      return;
    }
    await db.habits.put(mapRemoteHabitToEntity(habit, userId));
  });
  const checkinPromises = response.checkins.map((checkin) => applyCheckinUpsert(checkin, userId));
  const tombstonePromises = response.tombstones.map((tombstone) => applyTombstone(tombstone, userId));
  await Promise.all([...habitPromises, ...checkinPromises, ...tombstonePromises]);
}
function getBackoffMs(retries) {
  const attempt = Math.min(retries, 6);
  return (attempt + 1) * 1e3;
}
function normalizePath(base) {
  return base.replace(/\/+$/, "");
}
function ensureAbsolute(base) {
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(base)) {
    return base;
  }
  const origin = window.location.origin;
  return `${origin}${base.startsWith("/") ? "" : "/"}${base}`;
}
function buildApiUrl(path) {
  const normalizedBase = normalizePath(API_BASE_URL);
  const fullBase = ensureAbsolute(normalizedBase);
  return `${fullBase}${path.startsWith("/") ? path : `/${path}`}`;
}
const buildUrl = buildApiUrl;
async function fetchJson(url, init = {}) {
  const headers = new Headers(init.headers);
  const accessToken = await getValidAccessToken();
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  } else {
    throw new Error("Authentication required");
  }
  if (init.method && init.method !== "GET") {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(url, {
    ...init,
    headers,
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error(
      `Sync request failed: ${response.status} ${response.statusText}`
    );
  }
  return response;
}
async function pullChanges(since) {
  const url = new URL(buildUrl("/sync/pull"));
  if (since) {
    url.searchParams.set("since", since);
  }
  const response = await fetchJson(url.toString(), { method: "GET" });
  return await response.json();
}
async function pushChanges(entries) {
  const payload = {
    ops: entries.map((entry) => ({
      id: entry.id,
      entity: entry.entity,
      type: entry.type,
      payload: entry.payload,
      clientTime: entry.clientTime
    }))
  };
  const response = await fetchJson(buildUrl("/sync/push"), {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return await response.json();
}
export {
  applyPullResponse as a,
  pushChanges as b,
  getBackoffMs as g,
  pullChanges as p
};
