
import { getNextHomeTier } from "../shared/index.js";
import { getTierTheme, TIER_THEMES } from "./tierThemes.js";

export { getTierTheme, TIER_THEMES, getTierThemeStyles } from "./tierThemes.js";

export const formatTierLabel = (tier) => getTierTheme(tier).displayName;

export const getTierDescription = (tier) => getTierTheme(tier).shortDescription;

export const getNextTierLabel = (tier) => {
  const next = getNextHomeTier(tier);
  return next ? getTierTheme(next).displayName : null;
};

export const getStackProgressPercent = (activeHome) => {
  if (!activeHome || activeHome.stackTarget <= 0) return 0;
  return Math.min(100, Math.round((activeHome.stackProgress / activeHome.stackTarget) * 100));
};

/** Build-mode block colors derived from tier accent */
export const TIER_THEME= {
  SHACK: { accent: "#a16207", blockTop: "#d97706", blockBottom: "#92400e", sky: "#b8ddf4" },
  CABIN: { accent: "#b45309", blockTop: "#f59e0b", blockBottom: "#78350f", sky: "#a8d4f0" },
  APARTMENT: { accent: "#0369a1", blockTop: "#38bdf8", blockBottom: "#075985", sky: "#93c5fd" },
  VILLA: { accent: "#047857", blockTop: "#34d399", blockBottom: "#065f46", sky: "#a7f3d0" },
  PLAZA: { accent: "#6d28d9", blockTop: "#a78bfa", blockBottom: "#5b21b6", sky: "#c4b5fd" },
  RESIDENCE: { accent: "#be123c", blockTop: "#fb7185", blockBottom: "#9f1239", sky: "#1e293b" }
};

