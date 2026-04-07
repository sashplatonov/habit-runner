const API_BASE_URL = "http://localhost:3000";
const DEFAULT_USER_ID = "demo-user";
const AUTH_SESSION_KEY = "habbitRunner.auth.session";
const EXPIRY_SKEW_SECONDS = 30;
const AUTH_SESSION_CLEARED_EVENT = "habbitRunner.auth.session-cleared";
function toSession(payload) {
  return {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    expiresIn: payload.expiresIn,
    expiresAt: Date.now() + payload.expiresIn * 1e3,
    email: payload.email
  };
}
function readAuthSession() {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed.accessToken || !parsed.refreshToken || !parsed.expiresAt) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
function saveAuthSession(payload) {
  const session = toSession(payload);
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  return session;
}
function clearAuthSession() {
  localStorage.removeItem(AUTH_SESSION_KEY);
  window.dispatchEvent(new Event(AUTH_SESSION_CLEARED_EVENT));
}
function isTokenExpiring(session) {
  return Date.now() >= session.expiresAt - EXPIRY_SKEW_SECONDS * 1e3;
}
async function refreshSession(session) {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: session.refreshToken })
  });
  if (!response.ok) {
    throw new Error("Unable to refresh authentication token");
  }
  const data = await response.json();
  return saveAuthSession({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresIn: data.expiresIn,
    email: session.email
  });
}
async function getValidAccessToken() {
  const session = readAuthSession();
  if (!session) {
    return null;
  }
  if (!isTokenExpiring(session)) {
    return session.accessToken;
  }
  try {
    const refreshed = await refreshSession(session);
    return refreshed.accessToken;
  } catch {
    clearAuthSession();
    return null;
  }
}
export {
  API_BASE_URL as A,
  DEFAULT_USER_ID as D,
  clearAuthSession as c,
  getValidAccessToken as g,
  readAuthSession as r
};
