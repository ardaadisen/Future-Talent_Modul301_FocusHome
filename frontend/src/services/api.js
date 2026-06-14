/**
 * FocusHome backend client (Vite: VITE_API_BASE_URL).
 * Backend is the single source of truth for tasks, inventory, and grid.
 */

import { getAuthHeaders } from "./authSession.js";

const DEFAULT_BASE = "http://127.0.0.1:8000";

export function getApiBaseUrl() {
  const raw = import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE;
  return String(raw).replace(/\/$/, "");
}

export const BACKEND_UNAVAILABLE = "__FOCUSHOME_SERVICE_UNAVAILABLE__";

const PRESETS = [15, 30, 45, 60];

const ASSET_ID_MAP = {
  wall: "wall_v1",
  window: "window_v1",
  roof: "roof_v1",
};

const ASSET_LABEL_MAP = {
  wall_v1: "wall",
  window_v1: "window",
  roof_v1: "roof",
};

function buildUrl(path) {
  const base = getApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

async function parseErrorDetail(res) {
  try {
    const body = await res.json();
    if (typeof body.detail === "string") {
      return body.detail;
    }
    if (Array.isArray(body.detail)) {
      return body.detail.map((d) => d.msg || JSON.stringify(d)).join("; ");
    }
  } catch {
    /* ignore */
  }
  return `Request failed (${res.status})`;
}

async function fetchJson(path, { method = "GET", body, headers = {} } = {}) {
  const init = {
    method,
    headers: getAuthHeaders(headers),
  };
  if (body !== undefined) {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
    init.headers["Content-Type"] = "application/json";
  }
  let res;
  try {
    res = await fetch(buildUrl(path), init);
  } catch {
    throw new Error(BACKEND_UNAVAILABLE);
  }
  if (!res.ok) {
    throw new Error(await parseErrorDetail(res));
  }
  if (res.status === 204) {
    return null;
  }
  return res.json();
}

export function nearestPresetDurationMinutes(minutes) {
  const m = Math.max(1, Math.round(Number(minutes)) || 30);
  return PRESETS.reduce((best, v) => (Math.abs(v - m) < Math.abs(best - m) ? v : best));
}

export function createEmptyGridMatrix(size = 5) {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => "empty"));
}

export function mapInventoryToUi(inv) {
  return {
    xp: inv.total_xp ?? 0,
    level: inv.level ?? 0,
    bricks: inv.resources?.bricks ?? 0,
    glass: inv.resources?.glass ?? 0,
    roofTiles: inv.resources?.roof_tiles ?? 0,
    unlockedAssets: inv.unlocked_assets ?? [],
  };
}

export function mapGridToUiMatrix(gridApi) {
  const size = gridApi?.size ?? 5;
  const matrix = createEmptyGridMatrix(size);
  for (const cell of gridApi?.cells ?? []) {
    const y = Number(cell.y);
    const x = Number(cell.x);
    if (y >= 0 && y < size && x >= 0 && x < size) {
      matrix[y][x] = ASSET_LABEL_MAP[cell.asset_id] || cell.asset_id.replace("_v1", "") || "wall";
    }
  }
  return matrix;
}

export function mapTaskResponseToUi(task) {
  const preset = Number(task.preset_duration) || 30;
  return {
    id: task.id,
    title: task.title,
    durationMinutes: preset,
    durationSeconds: preset * 60,
    difficulty: task.difficulty_level || task.difficulty || "MEDIUM",
    description: task.description || "",
    status: task.status || "PENDING",
    source: task.source,
    startTime: task.scheduled_start_at || undefined,
    endTime: task.scheduled_end_at || undefined,
    calendarUrl: task.calendar_url || null,
  };
}

/** @deprecated use mapTaskResponseToUi */
export function mapManualTaskResponseToUi(task) {
  return mapTaskResponseToUi(task);
}

export function mapAiParseToUiTask(api) {
  const dm = Number(api.durationMinutes) || 30;
  const preset = PRESETS.includes(dm) ? dm : nearestPresetDurationMinutes(dm);
  return {
    title: api.title || "Focus Session",
    startTime: api.startDateTime,
    endTime: api.endDateTime,
    durationMinutes: preset,
    durationSeconds: preset * 60,
    difficulty: api.difficulty || "MEDIUM",
    description: api.description || "",
    calendarUrl: api.calendarUrl || null,
  };
}

export function mapUiTaskToFromAiPayload(task) {
  const preset = nearestPresetDurationMinutes(task.durationMinutes);
  const start = task.startTime ? new Date(task.startTime).toISOString() : new Date().toISOString();
  const end = task.endTime
    ? new Date(task.endTime).toISOString()
    : new Date(Date.now() + preset * 60000).toISOString();
  return {
    title: (task.title || "Focus Session").slice(0, 50),
    startDateTime: start,
    endDateTime: end,
    durationMinutes: preset,
    difficulty: task.difficulty || "MEDIUM",
    description: task.description || "",
    calendarUrl: task.calendarUrl || undefined,
  };
}

export async function fetchHealth() {
  return fetchJson("/health", { method: "GET" });
}

export async function fetchTasks() {
  return fetchJson("/api/tasks", { method: "GET" });
}

export async function fetchInventory() {
  return fetchJson("/api/inventory", { method: "GET" });
}

export async function fetchGrid() {
  return fetchJson("/api/grid", { method: "GET" });
}

export async function parseTask(text, timezone = "Europe/Istanbul") {
  return fetchJson("/api/ai/parse-task", {
    method: "POST",
    body: { text, timezone },
  });
}

export async function createManualTask(payload) {
  return fetchJson("/api/tasks/manual", {
    method: "POST",
    body: payload,
  });
}

export async function createFromAiTask(payload) {
  return fetchJson("/api/tasks/from-ai", {
    method: "POST",
    body: payload,
  });
}

export async function startTask(taskId) {
  return fetchJson(`/api/tasks/${taskId}/start`, { method: "PATCH" });
}

export async function completeTask(taskId) {
  return fetchJson(`/api/tasks/${taskId}/complete`, { method: "PATCH" });
}

export async function abandonTask(taskId) {
  return fetchJson(`/api/tasks/${taskId}/abandon`, { method: "PATCH" });
}

export async function deleteTask(taskId) {
  return fetchJson(`/api/tasks/${taskId}`, { method: "DELETE" });
}

export async function placeGridAsset({ x, y, assetId = "wall_v1", rotation = 0, resourceCost }) {
  const body = {
    x,
    y,
    asset_id: ASSET_ID_MAP[assetId] || assetId,
    rotation,
  };
  if (resourceCost) {
    body.resource_cost = {
      bricks: resourceCost.bricks ?? 0,
      glass: resourceCost.glass ?? 0,
      roof_tiles: resourceCost.roofTiles ?? resourceCost.roof_tiles ?? 0,
    };
  }
  return fetchJson("/api/grid/place", { method: "POST", body });
}

export async function removeGridCell(x, y) {
  return fetchJson(`/api/grid/cells/${x}/${y}`, { method: "DELETE" });
}

export async function fetchCalendarTemplateUrl({ title, startDateTime, endDateTime, description = "" }) {
  const data = await fetchJson("/api/calendar/template-url", {
    method: "POST",
    body: { title, startDateTime, endDateTime, description },
  });
  return data.calendarUrl;
}

export async function loadAppState() {
  const [tasks, inventory, grid] = await Promise.all([
    fetchTasks(),
    fetchInventory(),
    fetchGrid(),
  ]);
  return {
    tasks: tasks.map(mapTaskResponseToUi),
    inventory: mapInventoryToUi(inventory),
    grid: mapGridToUiMatrix(grid),
  };
}
