/**
 * Local persistence for Cloud features without UpSchool backend endpoints.
 * TODO: Replace with backend when /api/home/*, /api/user/* endpoints exist.
 */

import {
  applyTierDecorationUnlocks,
  createDefaultActiveHome,
  createEmptyDecorationSlots,
  getNextHomeTier,
  HOME_TIER_STACK_TARGETS,
  normalizeActiveHome,
  normalizeDecorationSlots,
} from "../shared/homeProgression.js";
import {
  clampPlacementPercent,
  findPlacementIndex,
  getDefaultPositionForCategory,
  getNextPlacementZIndex,
  normalizePlacement,
  PLACEMENT_ROTATION_STEP,
  sortPlacementsByZIndex,
} from "../shared/decorationPlacements.js";
import { getDecorationById, DECORATION_SLOT_LABELS } from "../shared/decorations.js";
import {
  createDefaultUserPreferences,
  createDefaultUserProfile,
} from "../shared/userData.js";
import { readJson, STORAGE_KEYS, writeJson } from "./localStore.js";
import { getUserId } from "./format.js";

export { DECORATION_SLOT_LABELS };

export function loadActiveHome() {
  try {
    const stored = readJson(STORAGE_KEYS.activeHome, null);
    if (!stored) {
      const fresh = createDefaultActiveHome(getUserId());
      writeJson(STORAGE_KEYS.activeHome, fresh);
      return fresh;
    }
    return normalizeActiveHome({ ...createDefaultActiveHome(getUserId()), ...stored });
  } catch {
    const fresh = createDefaultActiveHome(getUserId());
    writeJson(STORAGE_KEYS.activeHome, fresh);
    return fresh;
  }
}

export function saveActiveHome(home) {
  const normalized = normalizeActiveHome(home);
  writeJson(STORAGE_KEYS.activeHome, normalized);
  return normalized;
}

export function loadCompletedHomes() {
  return readJson(STORAGE_KEYS.completedHomes, []);
}

export function saveCompletedHomes(homes) {
  writeJson(STORAGE_KEYS.completedHomes, homes);
  return homes;
}

export function loadUserProfile() {
  const stored = readJson(STORAGE_KEYS.userProfile, null);
  if (!stored) {
    const fresh = createDefaultUserProfile(getUserId());
    writeJson(STORAGE_KEYS.userProfile, fresh);
    return fresh;
  }
  return { ...createDefaultUserProfile(getUserId()), ...stored };
}

export function saveUserProfile(profile) {
  writeJson(STORAGE_KEYS.userProfile, profile);
  return profile;
}

export function loadUserPreferences() {
  const stored = readJson(STORAGE_KEYS.userPreferences, null);
  if (!stored) {
    const fresh = createDefaultUserPreferences(getUserId());
    writeJson(STORAGE_KEYS.userPreferences, fresh);
    return fresh;
  }
  return { ...createDefaultUserPreferences(getUserId()), ...stored };
}

export function saveUserPreferences(preferences) {
  const next = { ...preferences, updatedAt: new Date().toISOString() };
  writeJson(STORAGE_KEYS.userPreferences, next);
  return next;
}

export function resetLocalHomeData() {
  const activeHome = createDefaultActiveHome(getUserId());
  writeJson(STORAGE_KEYS.activeHome, activeHome);
  writeJson(STORAGE_KEYS.completedHomes, []);
  writeJson(STORAGE_KEYS.userProfile, createDefaultUserProfile(getUserId()));
  writeJson(STORAGE_KEYS.userPreferences, createDefaultUserPreferences(getUserId()));
  return {
    activeHome,
    completedHomes: [],
    userProfile: loadUserProfile(),
    userPreferences: loadUserPreferences(),
  };
}

export function placeStackBlockLocal(activeHome, inventory) {
  if ((inventory.resources?.bricks ?? 0) < 1) {
    throw new Error("Not enough bricks to stack a block.");
  }

  const updatedInventory = {
    ...inventory,
    resources: {
      ...inventory.resources,
      bricks: inventory.resources.bricks - 1,
    },
  };

  const stackProgress = activeHome.stackProgress + 1;
  let tierUpgraded = false;
  let completedHome = null;
  let nextHome = { ...activeHome, stackProgress, updatedAt: new Date().toISOString() };

  if (stackProgress >= activeHome.stackTarget) {
    tierUpgraded = true;
    completedHome = {
      id: crypto.randomUUID(),
      userId: getUserId(),
      tier: activeHome.currentTier,
      completedAt: new Date().toISOString(),
      finalStackCount: stackProgress,
      decorations: normalizeDecorationSlots(activeHome.decorations),
      decorationPlacements: activeHome.decorationPlacements,
    };

    const nextTier = getNextHomeTier(activeHome.currentTier);
    if (nextTier) {
      nextHome = applyTierDecorationUnlocks({
        ...createDefaultActiveHome(getUserId()),
        currentTier: nextTier,
        stackTarget: HOME_TIER_STACK_TARGETS[nextTier],
        unlockedDecorations: activeHome.unlockedDecorations,
      });
    } else {
      nextHome = { ...activeHome, stackProgress: activeHome.stackTarget };
    }
  }

  return {
    activeHome: saveActiveHome(nextHome),
    inventory: updatedInventory,
    completedHome,
    tierUpgraded,
  };
}

export function updateHomeDecorationLocal(activeHome, slot, decorationId) {
  const decorations = { ...createEmptyDecorationSlots(), ...activeHome.decorations };
  decorations[slot] = decorationId;
  return saveActiveHome({
    ...activeHome,
    decorations,
    updatedAt: new Date().toISOString(),
  });
}

export function createDecorationPlacementLocal(activeHome, decorationId, x, y) {
  const decoration = getDecorationById(decorationId);
  if (!decoration) throw new Error("Unknown decoration.");
  const defaults = getDefaultPositionForCategory(decoration.category);
  const placement = normalizePlacement({
    placementId: crypto.randomUUID(),
    decorationId,
    category: decoration.category,
    x: x ?? defaults.x,
    y: y ?? defaults.y,
    rotation: 0,
    zIndex: getNextPlacementZIndex(activeHome.decorationPlacements),
  });
  return saveActiveHome({
    ...activeHome,
    decorationPlacements: [...activeHome.decorationPlacements, placement],
    updatedAt: new Date().toISOString(),
  });
}

function patchPlacement(activeHome, placementId, patch) {
  const placements = [...activeHome.decorationPlacements];
  const idx = findPlacementIndex(placements, placementId);
  if (idx < 0) return activeHome;
  placements[idx] = normalizePlacement({ ...placements[idx], ...patch });
  return saveActiveHome({
    ...activeHome,
    decorationPlacements: placements,
    updatedAt: new Date().toISOString(),
  });
}

export function updateDecorationPlacementLocal(activeHome, placementId, patch) {
  return patchPlacement(activeHome, placementId, patch);
}

export function deleteDecorationPlacementLocal(activeHome, placementId) {
  return saveActiveHome({
    ...activeHome,
    decorationPlacements: activeHome.decorationPlacements.filter(
      (p) => p.placementId !== placementId,
    ),
    updatedAt: new Date().toISOString(),
  });
}

export function rotateDecorationPlacementLocal(activeHome, placementId) {
  const placements = [...activeHome.decorationPlacements];
  const idx = findPlacementIndex(placements, placementId);
  if (idx < 0) return activeHome;
  return patchPlacement(activeHome, placementId, {
    rotation: placements[idx].rotation + PLACEMENT_ROTATION_STEP,
  });
}

function reorderPlacement(activeHome, placementId, direction) {
  const sorted = sortPlacementsByZIndex(activeHome.decorationPlacements);
  const idx = sorted.findIndex((p) => p.placementId === placementId);
  if (idx < 0) return activeHome;
  const swapIdx = direction === "front" ? idx + 1 : idx - 1;
  if (swapIdx < 0 || swapIdx >= sorted.length) return activeHome;
  const a = sorted[idx];
  const b = sorted[swapIdx];
  const placements = activeHome.decorationPlacements.map((p) => {
    if (p.placementId === a.placementId) return { ...p, zIndex: b.zIndex };
    if (p.placementId === b.placementId) return { ...p, zIndex: a.zIndex };
    return p;
  });
  return saveActiveHome({
    ...activeHome,
    decorationPlacements: placements,
    updatedAt: new Date().toISOString(),
  });
}

export function bringPlacementForwardLocal(activeHome, placementId) {
  return reorderPlacement(activeHome, placementId, "front");
}

export function sendPlacementBackwardLocal(activeHome, placementId) {
  return reorderPlacement(activeHome, placementId, "back");
}

export function moveDecorationPlacementLocal(activeHome, placementId, x, y) {
  return patchPlacement(activeHome, placementId, {
    x: clampPlacementPercent(x),
    y: clampPlacementPercent(y),
  });
}
