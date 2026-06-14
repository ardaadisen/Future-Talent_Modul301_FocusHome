/** Default game state and reward rules for local (offline) mode. */

import { readJson, writeJson, STORAGE_KEYS } from "./localStore.js";

const REWARDS = {
  EASY: { bricks: 2, xp: 20 },
  MEDIUM: { bricks: 5, xp: 50 },
  HARD: { bricks: 10, xp: 100 },
};

export function defaultInventory() {
  return {
    total_xp: 0,
    level: 0,
    resources: { bricks: 0, glass: 0, roof_tiles: 0 },
    unlocked_assets: [],
  };
}

export function defaultGrid() {
  return { grid_id: "main_home", size: 5, cells: [] };
}

export function computeLevel(totalXp) {
  return Math.floor(Math.sqrt(Math.max(0, totalXp) / 100));
}

export function loadLocalTasks() {
  return readJson(STORAGE_KEYS.tasks, []);
}

export function saveLocalTasks(tasks) {
  writeJson(STORAGE_KEYS.tasks, tasks);
}

export function loadLocalInventory() {
  return readJson(STORAGE_KEYS.inventory, defaultInventory());
}

export function saveLocalInventory(inventory) {
  const inv = { ...inventory, level: computeLevel(inventory.total_xp ?? 0) };
  writeJson(STORAGE_KEYS.inventory, inv);
  return inv;
}

export function loadLocalGrid() {
  return readJson(STORAGE_KEYS.grid, defaultGrid());
}

export function saveLocalGrid(grid) {
  writeJson(STORAGE_KEYS.grid, grid);
}

export function applyCompletionReward(inventory, difficulty) {
  const reward = REWARDS[difficulty] || REWARDS.MEDIUM;
  const inv = { ...inventory };
  inv.resources = { ...inv.resources };
  inv.resources.bricks = (inv.resources.bricks ?? 0) + reward.bricks;
  inv.total_xp = (inv.total_xp ?? 0) + reward.xp;
  inv.level = computeLevel(inv.total_xp);
  return inv;
}

export function exportAnonymousLocalSnapshot() {
  return {
    tasks: loadLocalTasks(),
    inventory: loadLocalInventory(),
    grid: loadLocalGrid(),
    activeHome: readJson(STORAGE_KEYS.activeHome, null),
    completedHomes: readJson(STORAGE_KEYS.completedHomes, []),
    userProfile: readJson(STORAGE_KEYS.userProfile, null),
    userPreferences: readJson(STORAGE_KEYS.userPreferences, null),
    activityHistory: readJson(STORAGE_KEYS.activityHistory, []),
    unlockedItems: readJson(STORAGE_KEYS.unlockedItems, []),
    decorationPlacements: readJson(STORAGE_KEYS.decorations, []),
  };
}

export function hasAnonymousLocalData() {
  const snap = exportAnonymousLocalSnapshot();
  return (
    (snap.tasks?.length ?? 0) > 0 ||
    (snap.inventory?.total_xp ?? 0) > 0 ||
    (snap.inventory?.resources?.bricks ?? 0) > 0 ||
    (snap.grid?.cells?.length ?? 0) > 0 ||
    snap.activeHome != null ||
    (snap.completedHomes?.length ?? 0) > 0
  );
}

export function migrationKeyForUser(userId) {
  return `focushome_migrated_${userId}`;
}

export function isMigratedForUser(userId) {
  try {
    return localStorage.getItem(migrationKeyForUser(userId)) === "true";
  } catch {
    return false;
  }
}

export function markMigratedForUser(userId) {
  try {
    localStorage.setItem(migrationKeyForUser(userId), "true");
  } catch {
    /* ignore */
  }
}
