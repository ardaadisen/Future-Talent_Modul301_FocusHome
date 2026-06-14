import {
  nearestPresetDurationMinutes,
  fetchCalendarTemplateUrl,
} from "../services/api.js";
import { getUserId } from "./format.js";

function toIso(value) {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export function mapTaskFromApi(task) {
  const preset = Number(task.preset_duration) || 30;
  let durationSeconds = preset * 60;
  if (task.scheduled_start_at && task.scheduled_end_at) {
    const start = new Date(task.scheduled_start_at).getTime();
    const end = new Date(task.scheduled_end_at).getTime();
    if (!Number.isNaN(start) && !Number.isNaN(end) && end > start) {
      durationSeconds = Math.round((end - start) / 1000);
    }
  }
  return {
    id: task.id,
    userId: getUserId(),
    title: task.title,
    durationSeconds,
    actualDurationSeconds: Number(task.actual_duration_seconds) || 0,
    difficultyLevel: task.difficulty_level || task.difficulty || "MEDIUM",
    status: task.status || "PENDING",
    createdAt: toIso(task.created_at) || new Date().toISOString(),
    completedAt: toIso(task.completed_at),
    source: task.source || "MANUAL",
    calendarUrl: task.calendar_url || undefined,
    scheduledStartAt: toIso(task.scheduled_start_at),
    scheduledEndAt: toIso(task.scheduled_end_at),
    description: task.description || undefined,
    rewardClaimed: Boolean(task.reward_claimed),
  };
}

export function mapInventoryFromApi(inv) {
  return {
    userId: getUserId(),
    totalXp: inv.total_xp ?? 0,
    level: inv.level ?? 0,
    resources: {
      bricks: inv.resources?.bricks ?? 0,
      glass: inv.resources?.glass ?? 0,
      roofTiles: inv.resources?.roof_tiles ?? 0,
    },
    unlockedAssets: inv.unlocked_assets ?? [],
  };
}

export function mapGridFromApi(grid) {
  return {
    userId: getUserId(),
    gridId: grid.grid_id || "main_home",
    size: grid.size ?? 5,
    cells: (grid.cells ?? []).map((cell) => ({
      x: cell.x,
      y: cell.y,
      assetId: cell.asset_id,
      rotation: cell.rotation ?? 0,
      placedAt: toIso(cell.placed_at) || new Date().toISOString(),
    })),
  };
}

export function mapAiParseFromApi(api) {
  const durationSeconds = Number(api.durationSeconds) ||
    Math.max(60, (Number(api.durationMinutes) || 30) * 60);
  return {
    title: api.title || "Focus Session",
    startDateTime: toIso(api.startDateTime),
    endDateTime: toIso(api.endDateTime),
    durationSeconds,
    difficulty: api.difficulty || "MEDIUM",
    description: api.description || "",
    confidence: api.confidence,
    parseSource: api.source || "heuristic",
    fallbackReason: api.fallbackReason || undefined,
    calendarUrl: api.calendarUrl || undefined,
  };
}

export function mapManualTaskToApi(payload) {
  const minutes = nearestPresetDurationMinutes(
    Math.max(1, Math.round(payload.durationSeconds / 60)),
  );
  return {
    title: payload.title.slice(0, 50),
    preset_duration: minutes,
    difficulty_level: payload.difficulty,
    description: payload.description || undefined,
    scheduled_start_at: payload.scheduledStartAt || undefined,
    scheduled_end_at: payload.scheduledEndAt || undefined,
  };
}

export async function mapAiParsedToFromApi(parsed) {
  const minutes = Math.max(1, Math.round(parsed.durationSeconds / 60));
  const start = parsed.startDateTime
    ? new Date(parsed.startDateTime).toISOString()
    : new Date().toISOString();
  const end = parsed.endDateTime
    ? new Date(parsed.endDateTime).toISOString()
    : new Date(Date.now() + minutes * 60000).toISOString();

  let calendarUrl = parsed.calendarUrl;
  if (!calendarUrl && parsed.startDateTime) {
    try {
      calendarUrl = await fetchCalendarTemplateUrl({
        title: (parsed.title || "Focus Session").slice(0, 50),
        startDateTime: start,
        endDateTime: end,
        description: parsed.description || "",
      });
    } catch {
      calendarUrl = undefined;
    }
  }

  return {
    title: (parsed.title || "Focus Session").slice(0, 50),
    startDateTime: start,
    endDateTime: end,
    durationMinutes: minutes,
    difficulty: parsed.difficulty || "MEDIUM",
    description: parsed.description || "",
    calendarUrl,
  };
}

export async function enrichManualTaskWithCalendar(task, payload) {
  if (!payload.scheduledStartAt || !payload.scheduledEndAt) {
    return task;
  }
  try {
    const calendarUrl = await fetchCalendarTemplateUrl({
      title: task.title,
      startDateTime: payload.scheduledStartAt,
      endDateTime: payload.scheduledEndAt,
      description: payload.description || "",
    });
    return { ...task, calendarUrl };
  } catch {
    return task;
  }
}
