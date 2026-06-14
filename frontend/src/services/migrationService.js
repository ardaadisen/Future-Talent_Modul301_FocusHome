/**
 * Upload anonymous local progress to the signed-in user's cloud account (single snapshot).
 */

import { saveUserState } from "./userSyncApi.js";
import {
  exportAnonymousLocalSnapshot,
  hasAnonymousLocalData,
  isMigratedForUser,
  markMigratedForUser,
} from "../utils/localGameState.js";

export function shouldOfferMigration(userId) {
  if (!userId || isMigratedForUser(userId)) return false;
  return hasAnonymousLocalData();
}

export async function migrateLocalToCloud(userId) {
  if (!userId) return { ok: false, reason: "no_user" };
  if (isMigratedForUser(userId)) return { ok: true, skipped: true, reason: "already_migrated" };
  if (!hasAnonymousLocalData()) {
    markMigratedForUser(userId);
    return { ok: true, skipped: true, reason: "no_local_data" };
  }

  const snap = exportAnonymousLocalSnapshot();

  try {
    await saveUserState({
      profile: snap.userProfile,
      preferences: snap.userPreferences,
      activeHome: snap.activeHome,
      completedHomes: snap.completedHomes,
      unlockedItems: snap.unlockedItems,
      decorationPlacements: snap.decorationPlacements,
      activityHistory: snap.activityHistory,
      inventory: snap.inventory,
      grid: snap.grid,
      tasks: snap.tasks,
    });
    markMigratedForUser(userId);
    return { ok: true, migrated: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Migration failed",
    };
  }
}
