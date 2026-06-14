export const DEMO_USER_ID = "anonymous";

/** Active user id — cloud user when signed in, otherwise anonymous local id. */
export function getUserId() {
  try {
    const stored = localStorage.getItem("focushome_user_id");
    if (stored) return stored;
    return DEMO_USER_ID;
  } catch {
    return DEMO_USER_ID;
  }
}

/** @deprecated Use getUserId() for runtime user id. */
export const USER_ID = DEMO_USER_ID;

export const formatDateTime = (iso) => {
  if (!iso) {
    return "-";
  }

  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
};

export const formatArchiveDate = (iso) => {
  if (!iso) return "Unknown date";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

export const formatDuration = (seconds) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const mins = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;
  if (hours > 0 && mins > 0 && secs > 0) return `${hours}h ${mins}m ${secs}s`;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0 && secs > 0) return `${hours}h ${secs}s`;
  if (hours > 0) return `${hours}h`;
  if (mins > 0 && secs > 0) return `${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m`;
  return `${secs}s`;
};

export const formatTimer = (seconds) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const mins = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};
