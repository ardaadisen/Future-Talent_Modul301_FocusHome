import { getNewUnlockIdsForTier, getStarterUnlockedDecorationIds } from "./decorations.js";
import { normalizeDecorationPlacements } from "./decorationPlacements.js";

export const HOME_TIER_ORDER = [
  "SHACK",
  "CABIN",
  "APARTMENT",
  "VILLA",
  "PLAZA",
  "RESIDENCE",
];

export const HOME_TIER_STACK_TARGETS = {
  SHACK: 8,
  CABIN: 12,
  APARTMENT: 16,
  VILLA: 20,
  PLAZA: 24,
  RESIDENCE: 30,
};

export const createEmptyDecorationSlots = () => ({
  bed: null,
  desk: null,
  plant: null,
  lamp: null,
  wallDecor: null,
});

export const normalizeDecorationSlots = (slots) => {
  const empty = createEmptyDecorationSlots();
  if (!slots) {
    return empty;
  }
  for (const key of Object.keys(empty)) {
    if (key in slots) {
      empty[key] = slots[key] ?? null;
    }
  }
  return empty;
};

export const normalizeActiveHome = (home) => ({
  ...home,
  decorations: normalizeDecorationSlots(home.decorations),
  decorationPlacements: normalizeDecorationPlacements(
    home.decorationPlacements,
    home.decorations,
  ),
  unlockedDecorations:
    Array.isArray(home.unlockedDecorations) && home.unlockedDecorations.length > 0
      ? home.unlockedDecorations
      : getStarterUnlockedDecorationIds(),
});

export const getNextHomeTier = (tier) => {
  const index = HOME_TIER_ORDER.indexOf(tier);
  if (index === -1 || index >= HOME_TIER_ORDER.length - 1) {
    return null;
  }
  return HOME_TIER_ORDER[index + 1] ?? null;
};

export const createDefaultActiveHome = (userId) => ({
  userId,
  currentTier: "SHACK",
  stackProgress: 0,
  stackTarget: HOME_TIER_STACK_TARGETS.SHACK,
  decorations: createEmptyDecorationSlots(),
  decorationPlacements: [],
  unlockedDecorations: getStarterUnlockedDecorationIds(),
  updatedAt: new Date().toISOString(),
});

export const applyTierDecorationUnlocks = (activeHome) => {
  const newUnlocks = getNewUnlockIdsForTier(
    activeHome.currentTier,
    activeHome.unlockedDecorations,
  );
  if (newUnlocks.length === 0) {
    return activeHome;
  }
  return {
    ...activeHome,
    unlockedDecorations: [...activeHome.unlockedDecorations, ...newUnlocks],
  };
};

export const HOME_TIER_LABELS = {
  SHACK: "Shack",
  CABIN: "Cabin",
  APARTMENT: "Apartment",
  VILLA: "Villa",
  PLAZA: "Plaza",
  RESIDENCE: "Residence",
};

export const formatHomeTierLabel = (tier) => HOME_TIER_LABELS[tier];
