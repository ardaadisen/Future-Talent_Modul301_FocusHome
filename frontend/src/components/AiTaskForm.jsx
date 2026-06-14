import { useMemo, useState } from "react";
import { parseSourceBadgeClass, parseSourceBadgeLabel, useLanguage } from "../context/LanguageContext.jsx";
import { difficultyLabel } from "../i18n/labels.js";
import { resolveScheduledEndDateTime } from "../shared/index.js";
import { normalizeApiError } from "../utils/apiError.js";

import { formatDateTime, formatDuration } from "../utils/format.js";
import { shouldShowAiBusyHint } from "../utils/parseFallbackHint.js";
import { CalendarLinkButton, hasScheduledCalendarSupport } from "./CalendarLinkButton.jsx";


const difficultyLabelFor = (t, value) => difficultyLabel(t, value || "MEDIUM");

export function AiTaskForm({ isPending = false, calendarEnabled = true, onParse, onConfirm }) {
  const { t } = useLanguage();
  const [input, setInput] = useState("");
  const [parsed, setParsed] = useState(null);
  const [savedCalendarUrl, setSavedCalendarUrl] = useState(null);
  const [durationHours, setDurationHours] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [parsing, setParsing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [parseError, setParseError] = useState(null);
  const [confirmError, setConfirmError] = useState(null);
  const [durationError, setDurationError] = useState(null);

  const busy = parsing || confirming || isPending;

  const editedDurationSeconds = durationHours * 3600 + durationMinutes * 60 + durationSeconds;

  const resolvedSchedule = useMemo(() => {
    if (!parsed?.startDateTime) {
      return { startDateTime: parsed?.startDateTime, endDateTime: parsed?.endDateTime };
    }

    return resolveScheduledEndDateTime(
      parsed.startDateTime,
      parsed.endDateTime,
      editedDurationSeconds,
    );
  }, [parsed, editedDurationSeconds]);

  const parseSourceLabel = parsed?.parseSource
    ? parseSourceBadgeLabel(parsed.parseSource, t)
    : t("parse_badge_smart");
  const parseSourceClass = parsed?.parseSource
    ? parseSourceBadgeClass(parsed.parseSource)
    : "badge-source-heuristic";

  const parse = async () => {
    if (!input.trim()) return;
    setParsing(true);
    setParseError(null);
    setParsed(null);
    try {
      const response = await onParse(input);
      setParsed(response);
      const total = Math.max(0, Math.floor(response.durationSeconds));
      setDurationHours(Math.floor(total / 3600));
      setDurationMinutes(Math.floor((total % 3600) / 60));
      setDurationSeconds(total % 60);
      setDurationError(null);
    } catch (errorValue) {
      const normalized = normalizeApiError(errorValue);
      setParseError(
        normalized.message || t("ai.parseError")
      );
    } finally {
      setParsing(false);
    }
  };

  const confirm = async () => {
    if (!parsed) return;
    if (editedDurationSeconds < 10) {
      setDurationError(t("manual.errorDuration"));
      return;
    }

    setConfirming(true);
    setConfirmError(null);
    try {
      const savedTask = await onConfirm({
        ...parsed,
        durationSeconds: editedDurationSeconds,
        startDateTime: resolvedSchedule.startDateTime,
        endDateTime: resolvedSchedule.endDateTime,
      });
      setInput("");
      setParsed(null);
      setDurationHours(0);
      setDurationMinutes(0);
      setDurationSeconds(0);
      setDurationError(null);
      setParseError(null);
      if (calendarEnabled && savedTask.calendarUrl) {
        setSavedCalendarUrl(savedTask.calendarUrl);
      } else {
        setSavedCalendarUrl(null);
      }
    } catch (errorValue) {
      const normalized = normalizeApiError(errorValue);
      setConfirmError(normalized.message || t("ai.saveError"));
    } finally {
      setConfirming(false);
    }
  };

  const editedPreview = `${durationHours > 0 ? `${durationHours}h ` : ""}${durationMinutes}m ${durationSeconds}s`;
  const showCalendarHint =
    parsed && hasScheduledCalendarSupport(calendarEnabled, resolvedSchedule.startDateTime);

  const showAiBusyHint = parsed && shouldShowAiBusyHint(parsed.fallbackReason);

  return (
    <section className="card form creation-card">
      <div className="creation-card-header">
        <p className="creation-card-eyebrow">{t("dashboard.aiPlan")}</p>
        <h2 className="section-title">{t("ai_plan_assistant")}</h2>
        <p className="section-lead">{t("ai.hint")}</p>
      </div>
      <div className="creation-card-body">
        <div className="field">
          <label htmlFor="ai-plan-input">{t("your_plan")}</label>
          <textarea
            id="ai-plan-input"
            value={input}
            disabled={busy}
            onChange={(e) => {
              setInput(e.target.value);
              if (parseError) {
                setParseError(null);
              }
            }}
            placeholder={t("ai.placeholder")}
            rows={3}
          />
        </div>

        {parsing && (
          <p className="ai-status ai-status-loading" role="status">
            {t("reading_plan")}
          </p>
        )}
        {parseError && (
          <p className="ai-status ai-status-error" role="alert">
            {parseError}
          </p>
        )}
      </div>

      <div className="creation-card-footer">
        <button
          className="btn btn-primary btn-block"
          disabled={busy || !input.trim()}
          onClick={parse}
          type="button"
          aria-busy={parsing}
        >
          {parsing ? t("reading_plan") : t("parse_plan")}
        </button>
      </div>

      {parsed && (
        <div className="ai-review">
          <div className="ai-review-header">
            <div>
              <p className="ai-review-label">{t("suggested_session")}</p>
              <h3 className="ai-review-title">{parsed.title}</h3>
            </div>
            {parsed.confidence != null && (
              <span className="confidence-pill">{t("ai.confidence", { confidence: Math.round(parsed.confidence * 100) })}</span>
            )}
          </div>

          <div className="ai-review-meta">
            <span className={`badge-pill badge-difficulty-${parsed.difficulty.toLowerCase()}`}>
              {difficultyLabelFor(t, parsed.difficulty)}
            </span>
            <span className={`badge-pill ${parseSourceClass}`}>{parseSourceLabel}</span>
          </div>

          {showAiBusyHint && (
            <p className="ai-status ai-status-info" role="status">
              {t("ai.fallbackBusy")}
            </p>
          )}

          <div className="ai-review-grid">
            {resolvedSchedule.startDateTime && (
              <div className="ai-review-row">
                <span className="ai-review-label">{t("scheduled")}</span>
                <p className="ai-review-value">
                  {formatDateTime(resolvedSchedule.startDateTime)}
                  {resolvedSchedule.endDateTime
                    ? ` → ${formatDateTime(resolvedSchedule.endDateTime)}`
                    : ""}
                </p>
              </div>
            )}
            <div className="ai-review-row">
              <span className="ai-review-label">{t("detected_duration")}</span>
              <p className="ai-review-value">{formatDuration(editedDurationSeconds)}</p>
            </div>
          </div>

          <fieldset className="duration-fieldset">
            <legend>{t("manual.adjustDuration")}</legend>
            <div className="duration-inputs">
              <label htmlFor="ai-duration-hours">
                {t("common.hours")}
                <input
                  id="ai-duration-hours"
                  disabled={busy}
                  type="number"
                  min={0}
                  max={8}
                  value={durationHours}
                  onChange={(e) => setDurationHours(Math.max(0, Math.min(8, Number(e.target.value) || 0)))}
                />
              </label>
              <label htmlFor="ai-duration-minutes">
                {t("common.minutes")}
                <input
                  id="ai-duration-minutes"
                  disabled={busy}
                  type="number"
                  min={0}
                  max={59}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Math.max(0, Math.min(59, Number(e.target.value) || 0)))}
                />
              </label>
              <label htmlFor="ai-duration-seconds">
                {t("common.seconds")}
                <input
                  id="ai-duration-seconds"
                  disabled={busy}
                  type="number"
                  min={0}
                  max={59}
                  value={durationSeconds}
                  onChange={(e) => setDurationSeconds(Math.max(0, Math.min(59, Number(e.target.value) || 0)))}
                />
              </label>
            </div>
          </fieldset>

          <p className="duration-preview">
            {t("ai.sessionLength", { duration: editedPreview })}
          </p>
          {durationError && <p className="field-error">{durationError}</p>}
          {confirmError && (
            <p className="ai-status ai-status-error" role="alert">
              {confirmError}
            </p>
          )}

          {showCalendarHint && (
            <p className="calendar-hint">{t("ai.addCalendarAfterSave")}</p>
          )}

          <button
            className="btn btn-primary btn-block"
            disabled={busy}
            onClick={confirm}
            type="button"
            aria-busy={confirming}
          >
            {confirming ? t("ai.addingSession") : t("confirm_focus_session")}
          </button>
        </div>
      )}

      {savedCalendarUrl && (
        <div className="calendar-save-success">
          <p className="calendar-save-success-text">{t("ai.savedPrompt")}</p>
          <div className="calendar-save-success-actions">
            <CalendarLinkButton calendarUrl={savedCalendarUrl} />
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setSavedCalendarUrl(null)}
            >
              {t("common.dismiss")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
