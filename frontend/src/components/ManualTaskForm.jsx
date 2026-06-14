import { useEffect, useState } from "react";

import { difficultyLabel } from "../i18n/labels.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { formatDuration } from "../utils/format.js";
import { splitDurationSeconds } from "../utils/userPreferences.js";
import { CalendarLinkButton } from "./CalendarLinkButton.jsx";


export function ManualTaskForm({
  isPending = false,
  defaultFocusDurationSeconds,
  calendarEnabled = true,
  createManualTask
}) {
  const { t } = useLanguage();
  const [title, setTitle] = useState("");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [description, setDescription] = useState("");
  const [scheduledStartAt, setScheduledStartAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [titleError, setTitleError] = useState(null);
  const [durationError, setDurationError] = useState(null);
  const [savedCalendarUrl, setSavedCalendarUrl] = useState(null);

  useEffect(() => {
    if (defaultFocusDurationSeconds === undefined) return;
    const duration = splitDurationSeconds(defaultFocusDurationSeconds);
    setHours(duration.hours);
    setMinutes(duration.minutes);
    setSeconds(duration.seconds);
  }, [defaultFocusDurationSeconds]);

  const totalDurationSeconds = hours * 3600 + minutes * 60 + seconds;
  const durationPreview = `${hours > 0 ? `${hours}h ` : ""}${minutes}m ${seconds}s`;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      setTitleError(t("manual.errorTitle"));
      return;
    }
    if (totalDurationSeconds < 10) {
      setDurationError(t("manual.errorDuration"));
      return;
    }

    setTitleError(null);
    setDurationError(null);
    setLoading(true);
    try {
      const payload = {
        title: normalizedTitle,
        durationSeconds: totalDurationSeconds,
        difficulty,
        description: description || undefined,
      };

      if (scheduledStartAt) {
        const start = new Date(scheduledStartAt);
        const end = new Date(start.getTime() + totalDurationSeconds * 1000);
        payload.scheduledStartAt = start.toISOString();
        payload.scheduledEndAt = end.toISOString();
      }

      const savedTask = await createManualTask(payload);
      setTitle("");
      setDescription("");
      setScheduledStartAt("");
      setHours(0);
      setMinutes(25);
      setSeconds(0);
      if (calendarEnabled && savedTask.calendarUrl) {
        setSavedCalendarUrl(savedTask.calendarUrl);
      } else {
        setSavedCalendarUrl(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (presetSeconds) => {
    setHours(Math.floor(presetSeconds / 3600));
    setMinutes(Math.floor((presetSeconds % 3600) / 60));
    setSeconds(presetSeconds % 60);
    setDurationError(null);
  };

  return (
    <form className="card form creation-card" onSubmit={handleSubmit}>
      <div className="creation-card-header">
        <p className="creation-card-eyebrow">{t("dashboard.manualPlan")}</p>
        <h2 className="section-title">{t("create_focus_session")}</h2>
        <p className="section-lead">{t("manual.lead")}</p>
      </div>

      <div className="creation-card-body">
      <div className="field">
        <label htmlFor="task-title">{t("manual.sessionTitle")}</label>
        <input
          id="task-title"
          disabled={loading || isPending}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (e.target.value.trim()) {
              setTitleError(null);
            }
          }}
          placeholder={t("manual.sessionTitlePlaceholder")}
        />
        {titleError && (
          <p className="field-error" role="alert">
            {titleError}
          </p>
        )}
      </div>

      <fieldset className="duration-fieldset">
        <legend>{t("common.duration")}</legend>
        <div className="duration-inputs">
          <label htmlFor="duration-hours">
            {t("common.hours")}
            <input
              id="duration-hours"
              disabled={loading || isPending}
              type="number"
              min={0}
              max={8}
              value={hours}
              onChange={(e) => setHours(Math.max(0, Math.min(8, Number(e.target.value) || 0)))}
            />
          </label>
          <label htmlFor="duration-minutes">
            {t("common.minutes")}
            <input
              id="duration-minutes"
              disabled={loading || isPending}
              type="number"
              min={0}
              max={59}
              value={minutes}
              onChange={(e) => setMinutes(Math.max(0, Math.min(59, Number(e.target.value) || 0)))}
            />
          </label>
          <label htmlFor="duration-seconds">
            {t("common.seconds")}
            <input
              id="duration-seconds"
              disabled={loading || isPending}
              type="number"
              min={0}
              max={59}
              value={seconds}
              onChange={(e) => setSeconds(Math.max(0, Math.min(59, Number(e.target.value) || 0)))}
            />
          </label>
        </div>
      </fieldset>

      <div className="preset-row">
        <button type="button" className="btn btn-ghost" disabled={loading || isPending} onClick={() => applyPreset(5 * 60)}>
          {t("manual.preset5")}
        </button>
        <button type="button" className="btn btn-ghost" disabled={loading || isPending} onClick={() => applyPreset(25 * 60)}>
          {t("manual.preset25")}
        </button>
        <button type="button" className="btn btn-ghost" disabled={loading || isPending} onClick={() => applyPreset(45 * 60)}>
          {t("manual.preset45")}
        </button>
        <button type="button" className="btn btn-ghost" disabled={loading || isPending} onClick={() => applyPreset(60 * 60)}>
          {t("manual.preset60")}
        </button>
      </div>

      <p className="duration-preview">
        {t("manual.selectedDuration", { duration: totalDurationSeconds > 0 ? durationPreview : formatDuration(0) })}
      </p>
      {durationError && (
        <p className="field-error" role="alert">
          {durationError}
        </p>
      )}

      <div className="field">
        <label htmlFor="task-difficulty">{t("common.difficulty")}</label>
        <select
          id="task-difficulty"
          disabled={loading || isPending}
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          <option value="EASY">{difficultyLabel(t, "EASY")}</option>
          <option value="MEDIUM">{difficultyLabel(t, "MEDIUM")}</option>
          <option value="HARD">{difficultyLabel(t, "HARD")}</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="task-description">{t("common.description")}</label>
        <textarea
          id="task-description"
          disabled={loading || isPending}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("manual.descriptionPlaceholder")}
          rows={3}
        />
      </div>

      {calendarEnabled && (
        <div className="field">
          <label htmlFor="task-scheduled">{t("manual.scheduledTime")}</label>
          <input
            id="task-scheduled"
            disabled={loading || isPending}
            type="datetime-local"
            value={scheduledStartAt}
            onChange={(e) => setScheduledStartAt(e.target.value)}
          />
          <p className="field-hint">{t("manual.scheduledHint")}</p>
        </div>
      )}
      </div>

      <div className="creation-card-footer">
        <button className="btn btn-primary btn-block" disabled={loading || isPending} type="submit">
          {loading || isPending ? t("manual.creating") : t("create_focus_session")}
        </button>
      </div>

      {savedCalendarUrl && (
        <div className="calendar-save-success">
          <p className="calendar-save-success-text">{t("manual.savedPrompt")}</p>
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
    </form>
  );
}
