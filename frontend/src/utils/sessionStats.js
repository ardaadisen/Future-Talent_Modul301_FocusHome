

export const computeSessionProgressStats = (tasks) => {
  let completedCount = 0;
  let pendingCount = 0;
  let abandonedCount = 0;
  let totalFocusSecondsCompleted = 0;

  for (const task of tasks) {
    if (task.status === "COMPLETED") {
      completedCount += 1;
      totalFocusSecondsCompleted += Math.max(0, Math.floor(task.durationSeconds));
    } else if (task.status === "PENDING") {
      pendingCount += 1;
    } else if (task.status === "ABANDONED") {
      abandonedCount += 1;
    }
  }

  return {
    completedCount,
    pendingCount,
    abandonedCount,
    totalFocusSecondsCompleted
  };
};

/** Compact hero display, e.g. "1h 25m" */
export const formatCompactFocusTime = (seconds) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return "0m";
};
