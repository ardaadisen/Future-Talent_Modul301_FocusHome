
export const UNLOCK_THRESHOLDS = {
  windows: { bricksPlaced: 8 },
  roof: { completedSessions: 5 }
};

export const getUnlockHints = (placedCount, completedCount, inventory) => {
  const hasGlass =
    (inventory?.resources.glass ?? 0) > 0 ||
    (inventory?.unlockedAssets.some((asset) => asset.includes("glass")) ?? false);
  const hasRoof =
    (inventory?.resources.roofTiles ?? 0) > 0 ||
    (inventory?.unlockedAssets.some((asset) => asset.includes("roof")) ?? false);

  const windowsUnlocked = hasGlass || placedCount >= UNLOCK_THRESHOLDS.windows.bricksPlaced;
  const roofUnlocked = hasRoof || completedCount >= UNLOCK_THRESHOLDS.roof.completedSessions;

  return [
    {
      id: "windows",
      icon: "🪟",
      titleKey: "unlock.windows.title",
      progressKey: windowsUnlocked ? "unlock.windows.unlocked" : "unlock.windows.progress",
      progressParams: windowsUnlocked
        ? {}
        : { count: UNLOCK_THRESHOLDS.windows.bricksPlaced },
      current: Math.min(placedCount, UNLOCK_THRESHOLDS.windows.bricksPlaced),
      required: UNLOCK_THRESHOLDS.windows.bricksPlaced,
      unlocked: windowsUnlocked
    },
    {
      id: "roof",
      icon: "🏠",
      titleKey: "unlock.roof.title",
      progressKey: roofUnlocked ? "unlock.roof.unlocked" : "unlock.roof.progress",
      progressParams: roofUnlocked
        ? {}
        : { count: UNLOCK_THRESHOLDS.roof.completedSessions },
      current: Math.min(completedCount, UNLOCK_THRESHOLDS.roof.completedSessions),
      required: UNLOCK_THRESHOLDS.roof.completedSessions,
      unlocked: roofUnlocked
    }
  ];
};
