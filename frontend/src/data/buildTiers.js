/** Stack build tiers — tier UI is local; grid placement uses backend API. */

export const BUILD_TIERS = [
  { id: 1, name: "Foundation", requiredBricks: 5, icon: "🧱", description: "Lay the ground floor" },
  { id: 2, name: "Walls", requiredBricks: 10, icon: "🏠", description: "Raise the frame" },
  { id: 3, name: "Roof", requiredBricks: 8, icon: "🏡", description: "Cap the structure" },
  { id: 4, name: "Garden", requiredBricks: 6, icon: "🌳", description: "Add outdoor charm" },
  { id: 5, name: "Cozy Home", requiredBricks: 12, icon: "✨", description: "Finish your dream home" },
];

export function getTierProgress(spentBricks) {
  let accumulated = 0;
  let currentTier = 0;
  for (const tier of BUILD_TIERS) {
    accumulated += tier.requiredBricks;
    if (spentBricks >= accumulated) {
      currentTier = tier.id;
    }
  }
  const nextTier = BUILD_TIERS.find((t) => t.id === currentTier + 1);
  const prevAccumulated = BUILD_TIERS.filter((t) => t.id <= currentTier).reduce((s, t) => s + t.requiredBricks, 0);
  const nextTarget = nextTier ? prevAccumulated + nextTier.requiredBricks : accumulated;
  const progress = nextTier
    ? Math.min(100, Math.round(((spentBricks - prevAccumulated) / (nextTarget - prevAccumulated)) * 100))
    : 100;
  return { currentTier, nextTier, progress, isComplete: !nextTier };
}
