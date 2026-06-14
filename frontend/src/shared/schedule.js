const SCHEDULE_TOLERANCE_SECONDS = 59;

export const resolveScheduledEndDateTime = (
  startDateTime,
  endDateTime,
  durationSeconds,
) => {
  if (!startDateTime) {
    return { startDateTime: undefined, endDateTime: undefined };
  }

  const startMs = Date.parse(startDateTime);
  if (!Number.isFinite(startMs)) {
    return { startDateTime: undefined, endDateTime: undefined };
  }

  const durationBasedEnd = new Date(startMs + durationSeconds * 1000).toISOString();

  if (!endDateTime) {
    return { startDateTime, endDateTime: durationBasedEnd };
  }

  const endMs = Date.parse(endDateTime);
  if (!Number.isFinite(endMs) || endMs <= startMs) {
    return { startDateTime, endDateTime: durationBasedEnd };
  }

  const modelSpanSeconds = Math.round((endMs - startMs) / 1000);
  if (Math.abs(modelSpanSeconds - durationSeconds) > SCHEDULE_TOLERANCE_SECONDS) {
    return { startDateTime, endDateTime: durationBasedEnd };
  }

  return { startDateTime, endDateTime };
};
