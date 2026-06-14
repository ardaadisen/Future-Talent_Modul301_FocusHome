/**
 * Cloud data provider — authenticated backend API.
 */

import {
  abandonTask,
  completeTask,
  createFromAiTask,
  createManualTask,
  deleteTask,
  fetchGrid,
  fetchInventory,
  fetchTasks,
  placeGridAsset,
  removeGridCell,
  startTask,
} from "./api.js";
import {
  mapGridFromApi,
  mapInventoryFromApi,
  mapManualTaskToApi,
  mapTaskFromApi,
} from "../utils/apiMappers.js";

export function createCloudDataProvider() {
  return {
    async loadAll() {
      const [taskData, inventoryData, gridData] = await Promise.all([
        fetchTasks(),
        fetchInventory(),
        fetchGrid(),
      ]);
      return {
        tasks: taskData.map(mapTaskFromApi),
        inventory: mapInventoryFromApi(inventoryData),
        grid: mapGridFromApi(gridData),
      };
    },

    async createManualTask(payload) {
      const created = await createManualTask(mapManualTaskToApi(payload));
      return mapTaskFromApi(created);
    },

    async createFromAiTask(body) {
      const created = await createFromAiTask(body);
      return mapTaskFromApi(created);
    },

    async parseAiTask(text, timezone = "Europe/Istanbul") {
      const { parseTaskResilient } = await import("./taskParseService.js");
      return parseTaskResilient(text, timezone);
    },

    async startTask(taskId) {
      const updated = await startTask(taskId);
      return mapTaskFromApi(updated);
    },

    async completeTask(taskId) {
      const result = await completeTask(taskId);
      return {
        task: mapTaskFromApi(result.task),
        inventory: mapInventoryFromApi(result.inventory),
      };
    },

    async abandonTask(taskId) {
      const updated = await abandonTask(taskId);
      return mapTaskFromApi(updated);
    },

    async deleteTask(taskId) {
      await deleteTask(taskId);
    },

    async placeGridAsset(payload) {
      const gridData = await placeGridAsset(payload);
      return mapGridFromApi(gridData);
    },

    async removeGridCell(x, y) {
      const gridData = await removeGridCell(x, y);
      return mapGridFromApi(gridData);
    },

    async fetchInventory() {
      return mapInventoryFromApi(await fetchInventory());
    },

    async fetchGrid() {
      return mapGridFromApi(await fetchGrid());
    },

    async resetGameData() {
      /* no cloud reset endpoint in MVP */
    },
  };
}
