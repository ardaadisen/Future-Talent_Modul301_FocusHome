/**
 * FocusHome backend client (Vite: VITE_API_BASE_URL).
 */

const DEFAULT_BASE = "http://127.0.0.1:8000";

export function getApiBaseUrl() {
  const raw = import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE;
  return String(raw).replace(/\/$/, "");
}

export const BACKEND_UNAVAILABLE =
  "Backend connection failed. Please start the backend on port 8000.";

function buildUrl(path) {
  const base = getApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

async function fetchJson(path, { method = "GET", body, headers = {} } = {}) {
  const init = {
    method,
    headers: { ...headers },
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
    throw new Error(BACKEND_UNAVAILABLE);
  }
  return res.json();
}

export async function fetchHealth() {
  return fetchJson("/health", { method: "GET" });
}

export async function parseTask(text, timezone = "Europe/Istanbul") {
  return fetchJson("/api/ai/parse-task", {
    method: "POST",
    body: { text, timezone },
  });
}

const PRESETS = [15, 30, 45, 60];

export function nearestPresetDurationMinutes(minutes) {
  const m = Math.max(1, Math.round(Number(minutes)) || 30);
  return PRESETS.reduce((best, v) => (Math.abs(v - m) < Math.abs(best - m) ? v : best));
}

/**
 * @param {{ title: string, preset_duration: number, difficulty_level: string, description?: string }} payload
 */
export async function createManualTask(payload) {
  return fetchJson("/api/tasks/manual", {
    method: "POST",
    body: payload,
  });
}

/**
 * Maps POST /api/ai/parse-task JSON to the shape used by CreateTask / App.
 */
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

/**
 * Maps POST /api/tasks/manual TaskObject to UI task list item.
 */
export function mapManualTaskResponseToUi(task) {
  const preset = Number(task.preset_duration) || 30;
  return {
    id: task.id,
    title: task.title,
    durationMinutes: preset,
    durationSeconds: preset * 60,
    difficulty: task.difficulty_level || task.difficulty || "MEDIUM",
    description: task.description || "",
    status: task.status || "PENDING",
    startTime: task.scheduled_start_at || undefined,
    endTime: task.scheduled_end_at || undefined,
    calendarUrl: task.calendar_url || null,
  };
}
