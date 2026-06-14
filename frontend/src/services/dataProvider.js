import { createCloudDataProvider } from "./CloudDataProvider.js";
import { LocalDataProvider } from "./LocalDataProvider.js";
import { SYNC_MODE } from "../utils/syncMode.js";

const ARRAY_METHODS = new Set([
  "getTasks",
  "getCompletedHomes",
  "getHistory",
  "getActivityEvents",
  "getDecorationPlacements",
]);

function safeDefaultForMethod(methodName) {
  if (ARRAY_METHODS.has(methodName)) {
    return async () => [];
  }
  if (methodName === "getInventory" || methodName === "updateInventory") {
    return async () => ({
      totalXp: 0,
      level: 0,
      resources: { bricks: 0, glass: 0, roofTiles: 0 },
      unlockedAssets: [],
    });
  }
  if (methodName === "getActiveHome" || methodName === "updateActiveHome") {
    return async () => null;
  }
  if (methodName === "getPreferences" || methodName === "savePreferences") {
    return async () => null;
  }
  return async () => null;
}

function withDevMethodWarnings(provider, label) {
  if (!import.meta.env.DEV) return provider;

  return new Proxy(provider, {
    get(target, prop) {
      if (typeof prop !== "string") return target[prop];
      const value = target[prop];
      if (value !== undefined) return value;

      console.warn(`[${label}] missing provider method "${prop}" — returning safe default`);
      return safeDefaultForMethod(prop);
    },
  });
}

export function getDataProvider(syncMode) {
  if (syncMode === SYNC_MODE.CLOUD) {
    return withDevMethodWarnings(createCloudDataProvider(), "CloudDataProvider");
  }
  return withDevMethodWarnings(LocalDataProvider, "LocalDataProvider");
}
