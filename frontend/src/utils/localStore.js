/** Local persistence helpers — TODO: replace with backend when endpoints exist. */

export function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const STORAGE_KEYS = {
  settings: "focushome_settings",
  decorations: "focushome_decorations",
  archive: "focushome_archive",
  buildProgress: "focushome_build_progress",
  activeHome: "focushome_active_home",
  completedHomes: "focushome_completed_homes",
  userProfile: "focushome_user_profile",
  userPreferences: "focushome_user_preferences",
  tasks: "focushome_tasks",
  inventory: "focushome_inventory",
  grid: "focushome_grid",
  activityHistory: "focushome_activity_history",
  unlockedItems: "focushome_unlocked_items",
};
