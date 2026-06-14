/**
 * Local-first data provider — all game state in localStorage.
 */

import {
  applyCompletionReward,
  defaultGrid,
  loadLocalGrid,
  loadLocalInventory,
  loadLocalTasks,
  saveLocalGrid,
  saveLocalInventory,
  saveLocalTasks,
} from "../utils/localGameState.js";
import {
  mapGridFromApi,
  mapInventoryFromApi,
  mapManualTaskToApi,
  mapTaskFromApi,
} from "../utils/apiMappers.js";
import { createEmptyGridMatrix, mapGridToUiMatrix, mapInventoryToUi, nearestPresetDurationMinutes } from "./api.js";

function newId() {
  return crypto.randomUUID();
}

function nowIso() {
  return new Date().toISOString();
}

function findTaskIndex(tasks, id) {
  return tasks.findIndex((t) => t.id === id);
}

export const LocalDataProvider = {
  async loadAll() {
    const tasks = loadLocalTasks().map(mapTaskFromApi);
    const inventory = mapInventoryFromApi(loadLocalInventory());
    const grid = mapGridFromApi(loadLocalGrid());
    return { tasks, inventory, grid };
  },

  async createManualTask(payload) {
    const apiPayload = mapManualTaskToApi(payload);
    const row = {
      id: newId(),
      title: (apiPayload.title || "Focus Session").slice(0, 50),
      preset_duration: apiPayload.preset_duration,
      actual_duration_seconds: 0,
      difficulty_level: apiPayload.difficulty_level,
      status: "PENDING",
      created_at: nowIso(),
      completed_at: null,
      source: "MANUAL",
      calendar_url: apiPayload.calendar_url ?? null,
      scheduled_start_at: apiPayload.scheduled_start_at ?? null,
      scheduled_end_at: apiPayload.scheduled_end_at ?? null,
      description: apiPayload.description ?? null,
      reward_claimed: false,
    };
    const tasks = loadLocalTasks();
    tasks.push(row);
    saveLocalTasks(tasks);
    return mapTaskFromApi(row);
  },

  async createFromAiTask(body) {
    const preset = nearestPresetDurationMinutes(body.durationMinutes || 30);
    const row = {
      id: newId(),
      title: (body.title || "Focus Session").slice(0, 50),
      preset_duration: preset,
      actual_duration_seconds: 0,
      difficulty_level: body.difficulty || "MEDIUM",
      status: "PENDING",
      created_at: nowIso(),
      completed_at: null,
      source: "AI",
      calendar_url: body.calendarUrl ?? null,
      scheduled_start_at: body.startDateTime,
      scheduled_end_at: body.endDateTime,
      description: body.description ?? null,
      reward_claimed: false,
    };
    const tasks = loadLocalTasks();
    tasks.push(row);
    saveLocalTasks(tasks);
    return mapTaskFromApi(row);
  },

  async parseAiTask(text, timezone = "Europe/Istanbul") {
    const { parseTaskResilient } = await import("./taskParseService.js");
    return parseTaskResilient(text, timezone);
  },

  async startTask(taskId) {
    const tasks = loadLocalTasks();
    const idx = findTaskIndex(tasks, taskId);
    if (idx < 0) throw new Error("Task not found");
    if (tasks[idx].status !== "PENDING") throw new Error("Only PENDING tasks can be started");
    tasks[idx].status = "ACTIVE";
    saveLocalTasks(tasks);
    return mapTaskFromApi(tasks[idx]);
  },

  async completeTask(taskId) {
    const tasks = loadLocalTasks();
    const idx = findTaskIndex(tasks, taskId);
    if (idx < 0) throw new Error("Task not found");
    const t = tasks[idx];
    let inv = loadLocalInventory();

    if (t.status === "COMPLETED") {
      return { task: mapTaskFromApi(t), inventory: mapInventoryFromApi(inv) };
    }
    if (t.status !== "PENDING" && t.status !== "ACTIVE") {
      throw new Error("Task cannot be completed from this status");
    }

    t.status = "COMPLETED";
    t.completed_at = nowIso();
    t.actual_duration_seconds = (t.preset_duration || 30) * 60;
    if (!t.reward_claimed) {
      inv = applyCompletionReward(inv, t.difficulty_level);
      t.reward_claimed = true;
      saveLocalInventory(inv);
    }
    tasks[idx] = t;
    saveLocalTasks(tasks);
    return { task: mapTaskFromApi(t), inventory: mapInventoryFromApi(inv) };
  },

  async abandonTask(taskId) {
    const tasks = loadLocalTasks();
    const idx = findTaskIndex(tasks, taskId);
    if (idx < 0) throw new Error("Task not found");
    tasks[idx].status = "ABANDONED";
    saveLocalTasks(tasks);
    return mapTaskFromApi(tasks[idx]);
  },

  async deleteTask(taskId) {
    const tasks = loadLocalTasks().filter((t) => t.id !== taskId);
    saveLocalTasks(tasks);
  },

  async placeGridAsset({ x, y, assetId = "wall_v1", resourceCost }) {
    const grid = loadLocalGrid();
    const cells = grid.cells || [];
    if (cells.some((c) => c.x === x && c.y === y)) {
      throw new Error("Cell already occupied");
    }
    let inv = loadLocalInventory();
    if (resourceCost) {
      const need = {
        bricks: resourceCost.bricks ?? 0,
        glass: resourceCost.glass ?? 0,
        roof_tiles: resourceCost.roofTiles ?? resourceCost.roof_tiles ?? 0,
      };
      for (const key of ["bricks", "glass", "roof_tiles"]) {
        if ((inv.resources?.[key] ?? 0) < need[key]) {
          throw new Error(`Not enough ${key}`);
        }
      }
      inv.resources.bricks -= need.bricks;
      inv.resources.glass -= need.glass;
      inv.resources.roof_tiles -= need.roof_tiles;
      saveLocalInventory(inv);
    }
    cells.push({ x, y, asset_id: assetId, rotation: 0, placed_at: nowIso() });
    grid.cells = cells;
    saveLocalGrid(grid);
    return mapGridFromApi(grid);
  },

  async removeGridCell(x, y) {
    const grid = loadLocalGrid();
    grid.cells = (grid.cells || []).filter((c) => !(c.x === x && c.y === y));
    saveLocalGrid(grid);
    return mapGridFromApi(grid);
  },

  async fetchInventory() {
    return mapInventoryFromApi(loadLocalInventory());
  },

  async fetchGrid() {
    return mapGridFromApi(loadLocalGrid());
  },

  async resetGameData() {
    saveLocalTasks([]);
    saveLocalInventory({ total_xp: 0, level: 0, resources: { bricks: 0, glass: 0, roof_tiles: 0 }, unlocked_assets: [] });
    saveLocalGrid(defaultGrid());
  },
};

export function mapLocalGridToMatrix() {
  return mapGridToUiMatrix(loadLocalGrid());
}

export function mapLocalInventoryToUi() {
  return mapInventoryToUi(loadLocalInventory());
}

export function createEmptyLocalGrid() {
  return createEmptyGridMatrix(5);
}
