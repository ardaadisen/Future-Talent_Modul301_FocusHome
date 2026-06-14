import { createDefaultActiveHome, normalizeActiveHome } from "../shared/homeProgression.js";
import { getUserId } from "./format.js";

/** Safe activeHome for My Home — never throws. TODO: replace with GET /api/home/active. */
export function ensureActiveHome(activeHome) {
  try {
    if (!activeHome || typeof activeHome !== "object") {
      return createDefaultActiveHome(getUserId());
    }
    return normalizeActiveHome({
      ...createDefaultActiveHome(getUserId()),
      ...activeHome,
      decorationPlacements: Array.isArray(activeHome.decorationPlacements)
        ? activeHome.decorationPlacements
        : [],
      unlockedDecorations: Array.isArray(activeHome.unlockedDecorations)
        ? activeHome.unlockedDecorations
        : undefined,
    });
  } catch {
    return createDefaultActiveHome(getUserId());
  }
}

export const HOME_DEMO_BANNER = null;
