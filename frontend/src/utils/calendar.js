export function createGoogleCalendarTemplateUrl(task) {
  const title = encodeURIComponent(task.title || "Focus Session");
  const details = encodeURIComponent(task.description || "FocusHome task");
  const start = task.startTime
    ? new Date(task.startTime)
    : new Date("2026-05-07T12:00:00Z");
  const end = task.endTime
    ? new Date(task.endTime)
    : new Date(start.getTime() + (task.durationMinutes || 60) * 60000);

  const fmt = (date) => date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(start)}/${fmt(end)}&details=${details}`;
}
