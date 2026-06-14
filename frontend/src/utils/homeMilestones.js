export const TOTAL_BUILD_SLOTS = 25;



export const HOME_MILESTONES= [
  {
    id: "foundation",
    label: "Foundation",
    icon: "🪨",
    bricksRequired: 5,
    tagline: "Lay the groundwork for your cozy home."
  },
  {
    id: "walls",
    label: "Walls",
    icon: "🧱",
    bricksRequired: 12,
    tagline: "Raise sturdy walls, one brick at a time."
  },
  {
    id: "windows",
    label: "Windows",
    icon: "🪟",
    bricksRequired: 18,
    tagline: "Open up your home to warm sunlight."
  },
  {
    id: "roof",
    label: "Roof",
    icon: "🏠",
    bricksRequired: 25,
    tagline: "Finish the roof and call it home."
  }
];


export const getMilestoneProgress = (placedCount) => {
  const safeCount = Math.max(0, Math.floor(placedCount));
  const completed = HOME_MILESTONES.filter((milestone) => safeCount >= milestone.bricksRequired);
  const next = HOME_MILESTONES.find((milestone) => safeCount < milestone.bricksRequired) ?? null;
  const previousThreshold = completed.length > 0 ? completed[completed.length - 1].bricksRequired : 0;
  const nextThreshold = next?.bricksRequired ?? TOTAL_BUILD_SLOTS;
  const segmentSpan = Math.max(1, nextThreshold - previousThreshold);
  const segmentProgress = next ? Math.min(1, (safeCount - previousThreshold) / segmentSpan) : 1;

  return {
    completed,
    next,
    previousThreshold,
    segmentProgress,
    overallPercent: Math.min(100, Math.round((safeCount / TOTAL_BUILD_SLOTS) * 100)),
    isComplete: safeCount >= TOTAL_BUILD_SLOTS
  };
};

export const isMilestoneUnlocked = (milestoneId, placedCount) => {
  const milestone = HOME_MILESTONES.find((item) => item.id === milestoneId);
  return milestone ? placedCount >= milestone.bricksRequired : false;
};

export const shouldShowWindowOnCell = (x, y, placedCount, occupied) =>
  occupied && isMilestoneUnlocked("windows", placedCount) && y >= 1 && y <= 2 && x >= 1 && x <= 3;

export const shouldShowRoofCapOnCell = (x, y, placedCount, occupied) =>
  occupied && y === 0 && isMilestoneUnlocked("windows", placedCount);
