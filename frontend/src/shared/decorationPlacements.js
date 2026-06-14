import { getDecorationById } from "./decorations.js";

export const PLACEMENT_ROTATION_STEP = 15;

export const PLACEMENT_BOUNDS = {
  min: 4,
  max: 96,
};

export const CATEGORY_DEFAULT_POSITION = {
  bed: { x: 14, y: 68 },
  desk: { x: 72, y: 66 },
  plant: { x: 8, y: 52 },
  lamp: { x: 32, y: 62 },
  wallDecor: { x: 18, y: 22 },
  clock: { x: 48, y: 16 },
};

export const clampPlacementPercent = (value) =>
  Math.max(PLACEMENT_BOUNDS.min, Math.min(PLACEMENT_BOUNDS.max, value));

export const normalizePlacement = (placement) => ({
  ...placement,
  x: clampPlacementPercent(placement.x),
  y: clampPlacementPercent(placement.y),
  rotation: Number.isFinite(placement.rotation) ? placement.rotation % 360 : 0,
  zIndex: Number.isInteger(placement.zIndex) ? placement.zIndex : 1,
});

export const getDefaultPositionForCategory = (category) =>
  CATEGORY_DEFAULT_POSITION[category];

export const getNextPlacementZIndex = (placements) => {
  if (placements.length === 0) return 1;
  return Math.max(...placements.map((p) => p.zIndex)) + 1;
};

export const migrateSlotsToPlacements = (slots) => {
  const placements = [];
  let zIndex = 1;

  for (const slot of Object.keys(slots)) {
    const decorationId = slots[slot];
    if (!decorationId) continue;

    const decoration = getDecorationById(decorationId);
    if (!decoration) continue;

    const position = getDefaultPositionForCategory(decoration.category);
    placements.push(
      normalizePlacement({
        placementId: `migrated-${slot}-${decorationId}`,
        decorationId,
        category: decoration.category,
        x: position.x,
        y: position.y,
        rotation: 0,
        zIndex: zIndex++,
      }),
    );
  }

  return placements;
};

export const normalizeDecorationPlacements = (placements, slots) => {
  if (Array.isArray(placements) && placements.length > 0) {
    return placements.map(normalizePlacement);
  }
  if (slots) {
    return migrateSlotsToPlacements(slots);
  }
  return [];
};

export const sortPlacementsByZIndex = (placements) =>
  [...placements].sort((a, b) => a.zIndex - b.zIndex);

export const findPlacementIndex = (placements, placementId) =>
  placements.findIndex((p) => p.placementId === placementId);
