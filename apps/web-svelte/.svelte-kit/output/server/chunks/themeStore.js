import { j as ssr_context } from "./root.js";
import "clsx";
import { w as writable, d as derived, g as get } from "./index.js";
import { A as API_BASE_URL, g as getValidAccessToken } from "./session.js";
import { f as setCurrentUserTimeZone, h as getBrowserTimeZone, i as getCurrentUserTimeZone } from "./db.js";
import "./sessionStore.js";
function onDestroy(fn) {
  /** @type {SSRContext} */
  ssr_context.r.on_destroy(fn);
}
async function withAuthHeaders(init = {}) {
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    throw new Error("Authentication required");
  }
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  headers.set("Content-Type", "application/json");
  return { ...init, headers };
}
async function fetchUserPreferences() {
  const response = await fetch(
    `${API_BASE_URL}/auth/preferences`,
    await withAuthHeaders({ method: "GET" })
  );
  if (!response.ok) {
    throw new Error(`Preferences fetch failed: ${response.status}`);
  }
  const payload = await response.json();
  return {
    theme: payload.theme,
    timezone: payload.timezone ?? null
  };
}
async function saveUserPreferences(preferences) {
  const response = await fetch(
    `${API_BASE_URL}/auth/preferences`,
    await withAuthHeaders({
      method: "PUT",
      body: JSON.stringify(preferences)
    })
  );
  if (!response.ok) {
    throw new Error(`Preferences save failed: ${response.status}`);
  }
}
const THEMES = [
  {
    id: "midnight",
    name: "Midnight",
    accent: "#00d4ff",
    accentSecondary: "#00ff88",
    group: "dark"
  },
  {
    id: "ember",
    name: "Ember",
    accent: "#ff8c42",
    accentSecondary: "#ff4d6a",
    group: "dark"
  },
  {
    id: "violet",
    name: "Violet",
    accent: "#bf6bff",
    accentSecondary: "#ff6bb5",
    group: "dark"
  },
  {
    id: "matrix",
    name: "Matrix",
    accent: "#33ff33",
    accentSecondary: "#00cc66",
    group: "dark"
  },
  {
    id: "arctic",
    name: "Arctic",
    accent: "#64b5f6",
    accentSecondary: "#e0e0e0",
    group: "dark"
  },
  {
    id: "sakura",
    name: "Sakura",
    accent: "#e8457a",
    accentSecondary: "#c44dbb",
    group: "light"
  },
  {
    id: "lavender",
    name: "Lavender",
    accent: "#7c5cbf",
    accentSecondary: "#5b8def",
    group: "light"
  },
  {
    id: "mint",
    name: "Mint",
    accent: "#2eaa6e",
    accentSecondary: "#1a8fb8",
    group: "light"
  },
  {
    id: "peach",
    name: "Peach",
    accent: "#e07830",
    accentSecondary: "#d04880",
    group: "light"
  },
  {
    id: "cloud",
    name: "Cloud",
    accent: "#4a7aef",
    accentSecondary: "#3abba0",
    group: "light"
  }
];
const STORAGE_KEY = "habit-theme";
function readStoredTheme() {
  if (typeof window === "undefined") return "cloud";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && THEMES.some((t) => t.id === stored)) {
      return stored;
    }
  } catch {
  }
  return "cloud";
}
function createThemeStore() {
  const theme = writable(readStoredTheme());
  const timezone = writable(getCurrentUserTimeZone());
  let serverSyncReady = false;
  const currentTheme = derived(
    theme,
    ($theme) => THEMES.find((t) => t.id === $theme) ?? THEMES[0]
  );
  function applyTheme(id) {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", id);
    }
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
    }
  }
  theme.subscribe((value) => {
    applyTheme(value);
  });
  timezone.subscribe((value) => {
    setCurrentUserTimeZone(value);
  });
  async function hydrateFromServer() {
    serverSyncReady = false;
    try {
      const remotePreferences = await fetchUserPreferences();
      if (remotePreferences.theme && THEMES.some((candidate) => candidate.id === remotePreferences.theme)) {
        theme.set(remotePreferences.theme);
      }
      if (remotePreferences.timezone) {
        timezone.set(setCurrentUserTimeZone(remotePreferences.timezone));
      }
    } catch {
    } finally {
      serverSyncReady = true;
    }
  }
  async function persistToServer() {
    if (!serverSyncReady) return;
    try {
      const currentThemeId = get(theme);
      const currentTz = get(timezone);
      await saveUserPreferences({ theme: currentThemeId, timezone: currentTz });
    } catch {
    }
  }
  return {
    theme,
    timezone,
    currentTheme,
    setTheme(id) {
      theme.set(id);
      persistToServer();
    },
    hydrateFromServer,
    resetToDefaults() {
      timezone.set(getBrowserTimeZone());
      serverSyncReady = false;
    }
  };
}
const themeStore = createThemeStore();
export {
  THEMES as T,
  onDestroy as o,
  themeStore as t
};
