import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  enrichManualTaskWithCalendar,
  mapAiParseFromApi,
  mapAiParsedToFromApi,
  mapGridFromApi,
  mapInventoryFromApi,
  mapTaskFromApi,
} from "../utils/apiMappers.js";
import { getDataProvider } from "../services/dataProvider.js";
import { useAuth } from "../context/AuthContext.jsx";
import { getDataSyncMode, SYNC_MODE } from "../utils/syncMode.js";
import { normalizeApiError } from "../utils/apiError.js";
import { slotLabel, tierLabel } from "../i18n/labels.js";
import { getStoredLanguage, translate } from "../i18n/translations.js";
import { getUserId } from "../utils/format.js";
import {
  defaultGrid,
  defaultInventory,
  loadLocalGrid,
  loadLocalInventory,
  loadLocalTasks,
} from "../utils/localGameState.js";
import {
  bringPlacementForwardLocal,
  createDecorationPlacementLocal,
  deleteDecorationPlacementLocal,
  loadActiveHome,
  loadCompletedHomes,
  loadUserPreferences,
  loadUserProfile,
  moveDecorationPlacementLocal,
  placeStackBlockLocal,
  resetLocalHomeData,
  rotateDecorationPlacementLocal,
  saveCompletedHomes,
  saveUserPreferences,
  saveUserProfile,
  sendPlacementBackwardLocal,
  updateHomeDecorationLocal,
} from "../utils/localHomeStore.js";
import { computeSessionProgressStats } from "../utils/sessionStats.js";
import { applyUserPreferences } from "../utils/userPreferences.js";

function bootstrapLocalSnapshot() {
  try {
    const tasks = loadLocalTasks().map(mapTaskFromApi);
    const inventory = mapInventoryFromApi(loadLocalInventory());
    const grid = mapGridFromApi(loadLocalGrid());
    const home = loadActiveHome();
    const homes = loadCompletedHomes();
    const profile = loadUserProfile();
    const preferences = loadUserPreferences();
    if (preferences) applyUserPreferences(preferences);
    return { tasks, inventory, grid, home, homes, profile, preferences };
  } catch {
    const home = loadActiveHome();
    return {
      tasks: [],
      inventory: mapInventoryFromApi(defaultInventory()),
      grid: mapGridFromApi(defaultGrid()),
      home,
      homes: [],
      profile: null,
      preferences: null,
    };
  }
}

const initialLocal = bootstrapLocalSnapshot();
const startsInCloudMode = getDataSyncMode(false) === SYNC_MODE.CLOUD;

export function useAppData() {
  const { user, syncMode } = useAuth();
  const provider = useMemo(() => getDataProvider(syncMode), [syncMode]);
  const [tasks, setTasks] = useState(initialLocal.tasks);
  const [inventory, setInventory] = useState(initialLocal.inventory);
  const [grid, setGrid] = useState(initialLocal.grid);
  const [activeHome, setActiveHome] = useState(initialLocal.home);
  const [completedHomes, setCompletedHomes] = useState(initialLocal.homes);
  const [userProfile, setUserProfile] = useState(initialLocal.profile);
  const [userPreferences, setUserPreferences] = useState(initialLocal.preferences);
  const [selectedTask, setSelectedTask] = useState(null);
  const [error, setError] = useState(null);
  const [offline, setOffline] = useState(false);
  const [reward, setReward] = useState(null);
  const [loading, setLoading] = useState(startsInCloudMode);
  const [localReady, setLocalReady] = useState(!startsInCloudMode);
  const [mutating, setMutating] = useState(false);
  const [recentlyCompletedTaskId, setRecentlyCompletedTaskId] = useState(null);
  const [highlightBuildArea, setHighlightBuildArea] = useState(false);
  const [cloudSyncConfigured, setCloudSyncConfigured] = useState(syncMode === SYNC_MODE.CLOUD);
  const syncModeRef = useRef(syncMode);
  syncModeRef.current = syncMode;

  const uiT = useCallback((key, params) => translate(getStoredLanguage(), key, params), []);

  const loadLocalState = useCallback(() => {
    try {
      const home = loadActiveHome();
      const homes = loadCompletedHomes();
      const profile = loadUserProfile();
      const preferences = loadUserPreferences();
      setActiveHome(home);
      setCompletedHomes(Array.isArray(homes) ? homes : []);
      setUserProfile(profile);
      setUserPreferences(preferences);
      applyUserPreferences(preferences);
      return { home, homes, profile, preferences };
    } catch {
      const home = loadActiveHome();
      setActiveHome(home);
      setCompletedHomes([]);
      return { home, homes: [], profile: null, preferences: null };
    }
  }, []);

  const loadAll = useCallback(async (showLoading = false) => {
    const mode = syncModeRef.current;
    const isCloud = mode === SYNC_MODE.CLOUD;
    if (showLoading) setLoading(true);
    try {
      setError(null);
      setOffline(false);
      const data = await provider.loadAll();
      setTasks(data.tasks);
      setInventory(data.inventory);
      setGrid(data.grid);
      loadLocalState();
      setSelectedTask((current) => {
        if (!current) return current;
        return data.tasks.find((t) => t.id === current.id) ?? null;
      });
      setCloudSyncConfigured(isCloud);
    } catch (errorValue) {
      const normalized = normalizeApiError(errorValue);
      setError(normalized.message || translate(getStoredLanguage(), "error.loadData"));
      setOffline(normalized.code === "API_UNREACHABLE");
      if (!isCloud) {
        loadLocalState();
      }
    } finally {
      if (showLoading) setLoading(false);
      if (!isCloud) setLocalReady(true);
    }
  }, [loadLocalState, provider]);

  useEffect(() => {
    const isCloud = syncMode === SYNC_MODE.CLOUD;
    if (!isCloud) {
      setLocalReady(true);
      setLoading(false);
    }
    void loadAll(isCloud);
  }, [syncMode, user?.userId, loadAll]);

  useEffect(() => {
    if (!reward) return;
    const duration = reward.type === "session-complete" ? 6500 : 4000;
    const timer = window.setTimeout(() => setReward(null), duration);
    return () => window.clearTimeout(timer);
  }, [reward]);

  useEffect(() => {
    if (!highlightBuildArea) return;
    const timer = window.setTimeout(() => setHighlightBuildArea(false), 5000);
    return () => window.clearTimeout(timer);
  }, [highlightBuildArea]);

  useEffect(() => {
    if (!recentlyCompletedTaskId) return;
    const timer = window.setTimeout(() => setRecentlyCompletedTaskId(null), 1200);
    return () => window.clearTimeout(timer);
  }, [recentlyCompletedTaskId]);

  const showReward = (messageKey, kind = "success", params) => {
    setReward({ type: "simple", messageKey, params, kind });
  };

  const showSessionCompleteReward = (xpGained, bricksGained) => {
    setReward({ type: "session-complete", xpGained, bricksGained });
    setHighlightBuildArea(true);
  };

  const sortedTasks = useMemo(
    () => [...tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [tasks],
  );

  const activeTasks = useMemo(
    () => sortedTasks.filter((t) => t.status === "PENDING" || t.status === "ACTIVE"),
    [sortedTasks],
  );

  const historyTasks = useMemo(
    () => sortedTasks.filter((t) => t.status === "COMPLETED" || t.status === "ABANDONED"),
    [sortedTasks],
  );

  const sessionStats = useMemo(() => computeSessionProgressStats(tasks), [tasks]);

  const createManualTask = async (payload) => {
    setMutating(true);
    try {
      setError(null);
      setOffline(false);
      const created = await provider.createManualTask(payload);
      let task = created;
      task = await enrichManualTaskWithCalendar(task, payload);
      await loadAll();
      showReward("reward.sessionReady", "info");
      return task;
    } catch (errorValue) {
      const normalized = normalizeApiError(errorValue);
      setError(normalized.message);
      setOffline(normalized.code === "API_UNREACHABLE");
      throw errorValue;
    } finally {
      setMutating(false);
    }
  };

  const parseAiTask = async (input) => {
    setError(null);
    setOffline(false);
    try {
      return await provider.parseAiTask(input);
    } catch (errorValue) {
      const normalized = normalizeApiError(errorValue);
      setError(normalized.message);
      setOffline(normalized.code === "API_UNREACHABLE");
      throw errorValue;
    }
  };

  const confirmAiTask = async (parsedTask) => {
    setMutating(true);
    try {
      setError(null);
      setOffline(false);
      const body = await mapAiParsedToFromApi(parsedTask);
      const task = await provider.createFromAiTask(body);
      await loadAll();
      showReward("reward.aiSessionAdded", "info");
      return task;
    } catch (errorValue) {
      const normalized = normalizeApiError(errorValue);
      setError(normalized.message);
      setOffline(normalized.code === "API_UNREACHABLE");
      throw errorValue;
    } finally {
      setMutating(false);
    }
  };

  const startTaskById = async (taskId) => {
    setMutating(true);
    try {
      setError(null);
      setOffline(false);
      const mapped = await provider.startTask(taskId);
      setTasks((prev) => prev.map((t) => (t.id === mapped.id ? mapped : t)));
      setSelectedTask((current) => (current?.id === taskId ? mapped : current));
      return mapped;
    } catch (errorValue) {
      const normalized = normalizeApiError(errorValue);
      setError(normalized.message);
      setOffline(normalized.code === "API_UNREACHABLE");
      throw errorValue;
    } finally {
      setMutating(false);
    }
  };

  const deleteTaskById = async (taskId) => {
    setMutating(true);
    try {
      setError(null);
      setOffline(false);
      await provider.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setSelectedTask((current) => (current?.id === taskId ? null : current));
      showReward("reward.sessionDeleted", "info");
    } catch (errorValue) {
      const normalized = normalizeApiError(errorValue);
      setError(normalized.message);
      setOffline(normalized.code === "API_UNREACHABLE");
      throw errorValue;
    } finally {
      setMutating(false);
    }
  };

  const completeTask = async (taskId) => {
    setMutating(true);
    try {
      setError(null);
      setOffline(false);
      const beforeXp = inventory?.totalXp ?? 0;
      const beforeBricks = inventory?.resources?.bricks ?? 0;
      const result = await provider.completeTask(taskId);
      const mappedTask = result.task;
      const mappedInventory = result.inventory;
      setTasks((prev) => prev.map((t) => (t.id === mappedTask.id ? mappedTask : t)));
      setInventory(mappedInventory);
      setSelectedTask((current) => (current?.id === taskId ? mappedTask : current));
      const gridData = await provider.fetchGrid();
      setGrid(gridData);
      loadLocalState();
      const xpGained = Math.max(0, (mappedInventory.totalXp ?? 0) - beforeXp);
      const bricksGained = Math.max(0, (mappedInventory.resources.bricks ?? 0) - beforeBricks);
      setRecentlyCompletedTaskId(taskId);
      showSessionCompleteReward(xpGained, bricksGained);
    } catch (errorValue) {
      const normalized = normalizeApiError(errorValue);
      setError(normalized.message);
      setOffline(normalized.code === "API_UNREACHABLE");
    } finally {
      setMutating(false);
    }
  };

  const abandonTask = async (taskId) => {
    setMutating(true);
    try {
      setError(null);
      setOffline(false);
      await provider.abandonTask(taskId);
      await loadAll();
      showReward("reward.sessionAbandoned", "info");
    } catch (errorValue) {
      const normalized = normalizeApiError(errorValue);
      setError(normalized.message);
      setOffline(normalized.code === "API_UNREACHABLE");
    } finally {
      setMutating(false);
    }
  };

  const placeBrick = async (x, y) => {
    setMutating(true);
    try {
      setError(null);
      setOffline(false);
      const gridData = await provider.placeGridAsset({
        x,
        y,
        assetId: "wall_v1",
        resourceCost: { bricks: 1, glass: 0, roofTiles: 0 },
      });
      setGrid(gridData);
      const inventoryData = await provider.fetchInventory();
      setInventory(inventoryData);
      showReward("reward.brickPlaced", "brick");
    } catch (errorValue) {
      const normalized = normalizeApiError(errorValue);
      setError(normalized.message);
      setOffline(normalized.code === "API_UNREACHABLE");
      throw errorValue;
    } finally {
      setMutating(false);
    }
  };

  const removeBrick = async (x, y) => {
    setMutating(true);
    try {
      setError(null);
      setOffline(false);
      const gridData = await provider.removeGridCell(x, y);
      setGrid(gridData);
      showReward("reward.blockRemoved", "info");
    } catch (errorValue) {
      const normalized = normalizeApiError(errorValue);
      setError(normalized.message);
      setOffline(normalized.code === "API_UNREACHABLE");
      throw errorValue;
    } finally {
      setMutating(false);
    }
  };

  const placeStackBlock = async () => {
    setMutating(true);
    try {
      setError(null);
      setOffline(false);
      if (!inventory || !activeHome) {
        throw new Error(uiT("error.buildNotReady"));
      }
      // TODO: POST /api/home/stack/place when backend endpoint exists.
      const result = placeStackBlockLocal(activeHome, inventory);
      setActiveHome(result.activeHome);
      setInventory(result.inventory);
      if (result.tierUpgraded && result.completedHome) {
        setCompletedHomes((current) => {
          const next = [result.completedHome, ...current].sort((a, b) =>
            b.completedAt.localeCompare(a.completedAt),
          );
          saveCompletedHomes(next);
          return next;
        });
        showReward("reward.tierUpgraded", "success", {
          completed: tierLabel(uiT, result.completedHome.tier),
          next: tierLabel(uiT, result.activeHome.currentTier),
        });
      } else {
        showReward("reward.blockStacked", "brick");
      }
      return result;
    } catch (errorValue) {
      const normalized = normalizeApiError(errorValue);
      setError(normalized.message);
      setOffline(normalized.code === "API_UNREACHABLE");
      throw errorValue;
    } finally {
      setMutating(false);
    }
  };

  const updateDecoration = async (slot, decorationId) => {
    setMutating(true);
    try {
      setError(null);
      setOffline(false);
      if (!activeHome) throw new Error(uiT("error.noActiveHome"));
      // TODO: POST /api/home/decoration when backend endpoint exists.
      const updatedHome = updateHomeDecorationLocal(activeHome, slot, decorationId);
      setActiveHome(updatedHome);
      showReward(
        decorationId ? "reward.decorationSlotUpdated" : "reward.decorationSlotCleared",
        "success",
        { slot: slotLabel(uiT, slot) },
      );
    } catch (errorValue) {
      const normalized = normalizeApiError(errorValue);
      setError(normalized.message);
      setOffline(normalized.code === "API_UNREACHABLE");
    } finally {
      setMutating(false);
    }
  };

  const createDecorationPlacement = async (decorationId, x, y) => {
    setMutating(true);
    try {
      setError(null);
      setOffline(false);
      const homeState = activeHome ?? loadActiveHome();
      // TODO: POST /api/home/decoration/placement when backend endpoint exists.
      const beforeIds = new Set(homeState.decorationPlacements.map((p) => p.placementId));
      const updatedHome = createDecorationPlacementLocal(homeState, decorationId, x, y);
      setActiveHome(updatedHome);
      const created = updatedHome.decorationPlacements.find((p) => !beforeIds.has(p.placementId));
      showReward("reward.decorationPlaced", "success");
      return created?.placementId ?? null;
    } catch (errorValue) {
      const normalized = normalizeApiError(errorValue);
      setError(normalized.message);
      setOffline(normalized.code === "API_UNREACHABLE");
      return null;
    } finally {
      setMutating(false);
    }
  };

  const moveDecorationPlacement = async (placementId, x, y) => {
    try {
      setError(null);
      setOffline(false);
      if (!activeHome) return;
      const updatedHome = moveDecorationPlacementLocal(activeHome, placementId, x, y);
      setActiveHome(updatedHome);
    } catch (errorValue) {
      const normalized = normalizeApiError(errorValue);
      setError(normalized.message);
      setOffline(normalized.code === "API_UNREACHABLE");
    }
  };

  const deleteDecorationPlacement = async (placementId) => {
    setMutating(true);
    try {
      setError(null);
      setOffline(false);
      if (!activeHome) return;
      const updatedHome = deleteDecorationPlacementLocal(activeHome, placementId);
      setActiveHome(updatedHome);
      showReward("reward.decorationRemoved", "info");
    } catch (errorValue) {
      const normalized = normalizeApiError(errorValue);
      setError(normalized.message);
      setOffline(normalized.code === "API_UNREACHABLE");
    } finally {
      setMutating(false);
    }
  };

  const rotateDecorationPlacement = async (placementId) => {
    setMutating(true);
    try {
      setError(null);
      setOffline(false);
      if (!activeHome) return;
      const updatedHome = rotateDecorationPlacementLocal(activeHome, placementId);
      setActiveHome(updatedHome);
    } catch (errorValue) {
      const normalized = normalizeApiError(errorValue);
      setError(normalized.message);
      setOffline(normalized.code === "API_UNREACHABLE");
    } finally {
      setMutating(false);
    }
  };

  const bringPlacementForward = async (placementId) => {
    setMutating(true);
    try {
      setError(null);
      setOffline(false);
      if (!activeHome) return;
      const updatedHome = bringPlacementForwardLocal(activeHome, placementId);
      setActiveHome(updatedHome);
    } catch (errorValue) {
      const normalized = normalizeApiError(errorValue);
      setError(normalized.message);
      setOffline(normalized.code === "API_UNREACHABLE");
    } finally {
      setMutating(false);
    }
  };

  const sendPlacementBackward = async (placementId) => {
    setMutating(true);
    try {
      setError(null);
      setOffline(false);
      if (!activeHome) return;
      const updatedHome = sendPlacementBackwardLocal(activeHome, placementId);
      setActiveHome(updatedHome);
    } catch (errorValue) {
      const normalized = normalizeApiError(errorValue);
      setError(normalized.message);
      setOffline(normalized.code === "API_UNREACHABLE");
    } finally {
      setMutating(false);
    }
  };

  const resetAllData = async () => {
    setMutating(true);
    try {
      setError(null);
      setOffline(false);
      // TODO: POST /api/dev/reset when backend endpoint exists.
      await provider.resetGameData?.();
      resetLocalHomeData();
      await loadAll();
      showReward("reward.homeCleared", "info");
      setSelectedTask(null);
    } catch (errorValue) {
      const normalized = normalizeApiError(errorValue);
      setError(normalized.message);
      setOffline(normalized.code === "API_UNREACHABLE");
    } finally {
      setMutating(false);
    }
  };

  const loadStarterContent = async () => {
    setMutating(true);
    try {
      setError(null);
      setOffline(false);
      // TODO: POST /api/dev/seed when backend endpoint exists.
      showReward("reward.starterContent", "info");
      setSelectedTask(null);
    } catch (errorValue) {
      const normalized = normalizeApiError(errorValue);
      setError(normalized.message);
      setOffline(normalized.code === "API_UNREACHABLE");
    } finally {
      setMutating(false);
    }
  };

  const saveUserSettings = async (payload) => {
    setMutating(true);
    try {
      setError(null);
      setOffline(false);
      // TODO: PATCH /api/user/profile and /api/user/preferences when backend endpoints exist.
      const profile = saveUserProfile({
        ...loadUserProfile(),
        userId: getUserId(),
        displayName: payload.displayName,
      });
      const preferences = saveUserPreferences({
        ...loadUserPreferences(),
        userId: getUserId(),
        ...payload.preferences,
      });
      setUserProfile(profile);
      setUserPreferences(preferences);
      applyUserPreferences(preferences);
      showReward("reward.settingsSaved", "success");
    } catch (errorValue) {
      const normalized = normalizeApiError(errorValue);
      setError(normalized.message);
      setOffline(normalized.code === "API_UNREACHABLE");
      throw errorValue;
    } finally {
      setMutating(false);
    }
  };

  return {
    tasks,
    sortedTasks,
    activeTasks,
    historyTasks,
    inventory,
    grid,
    activeHome,
    completedHomes,
    userProfile,
    userPreferences,
    selectedTask,
    setSelectedTask,
    error,
    offline,
    reward,
    loading,
    localReady,
    mutating,
    recentlyCompletedTaskId,
    highlightBuildArea,
    sessionStats,
    loadAll,
    createManualTask,
    parseAiTask,
    confirmAiTask,
    startTask: startTaskById,
    deleteTask: deleteTaskById,
    completeTask,
    abandonTask,
    placeBrick,
    removeBrick,
    placeStackBlock,
    updateDecoration,
    createDecorationPlacement,
    moveDecorationPlacement,
    deleteDecorationPlacement,
    rotateDecorationPlacement,
    bringPlacementForward,
    sendPlacementBackward,
    resetAllData,
    loadStarterContent,
    saveUserSettings,
    cloudSyncConfigured,
    syncMode,
  };
}
