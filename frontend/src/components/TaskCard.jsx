import { formatDateTime, formatDuration } from "../utils/format.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { difficultyLabel, sourceLabel, statusLabel } from "../i18n/labels.js";
import { CalendarLinkButton, shouldShowCalendarLink } from "./CalendarLinkButton.jsx";

export function TaskCard({
  task,
  selected,
  isPending = false,
  celebrate = false,
  calendarEnabled = true,
  onSelect,
  onComplete,
  onAbandon,
  onDelete,
}) {
  const { t } = useLanguage();
  const statusKey = task.status.toLowerCase();
  const scheduledRange = task.scheduledStartAt
    ? `${formatDateTime(task.scheduledStartAt)}${task.scheduledEndAt ? ` – ${formatDateTime(task.scheduledEndAt)}` : ""}`
    : null;
  const description = task.description?.trim();
  const canFocus = !isPending && task.status !== "COMPLETED" && task.status !== "ABANDONED";
  const canComplete = canFocus;
  const canAbandon = canFocus;
  const canDelete = !isPending && (task.status === "PENDING" || task.status === "ABANDONED");
  const sourceClass = task.source === "AI" ? "badge-source-ai" : "badge-source-manual";

  return (
    <article
      className={[
        "focus-session-card",
        `focus-session-card--${statusKey}`,
        selected ? "focus-session-card--selected" : "",
        celebrate ? "focus-session-card--celebrate" : ""
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <header className="focus-session-header">
        <div className="focus-session-title-wrap">
          <h4 className="focus-session-title">{task.title}</h4>
          <p className="focus-session-duration">
            <span className="focus-session-duration-icon" aria-hidden>
              ⏱
            </span>
            {formatDuration(task.durationSeconds)}
          </p>
        </div>
        <span className={`badge-pill badge-status badge-status-${statusKey}`}>
          {statusLabel(t, task.status)}
        </span>
      </header>

      <div className="focus-session-badges">
        <span className={`badge-pill badge-difficulty-${task.difficultyLevel.toLowerCase()}`}>
          {difficultyLabel(t, task.difficultyLevel)}
        </span>
        <span className={`badge-pill ${sourceClass}`}>{sourceLabel(t, task.source)}</span>
      </div>

      {scheduledRange && (
        <p className="focus-session-schedule">
          <span className="focus-session-meta-label">{t("common.scheduled")}</span>
          {scheduledRange}
        </p>
      )}

      {description && (
        <p className="focus-session-description">{description}</p>
      )}

      <div className="focus-session-actions">
        <button
          className={`btn btn-focus ${selected ? "btn-focus-active" : ""}`}
          onClick={() => onSelect(task)}
          type="button"
          disabled={isPending || !canFocus}
        >
          {selected ? t("task.focused") : t("common.focus")}
        </button>
        <button
          className="btn btn-primary"
          onClick={() => void onComplete(task.id)}
          disabled={!canComplete}
          type="button"
        >
          {t("common.complete")}
        </button>
        <button className="btn btn-ghost" onClick={() => void onAbandon(task.id)} disabled={!canAbandon} type="button">
          {t("common.abandon")}
        </button>
        {canDelete && onDelete ? (
          <button className="btn btn-ghost" onClick={() => void onDelete(task.id)} type="button">
            {t("common.delete")}
          </button>
        ) : null}
        {shouldShowCalendarLink(calendarEnabled, task.calendarUrl) && (
            <CalendarLinkButton calendarUrl={task.calendarUrl} />
        )}
      </div>
    </article>
  );
}
