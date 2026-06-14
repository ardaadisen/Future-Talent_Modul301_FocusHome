import { useState } from "react";
import AppButton from "../components/AppButton";
import AppCard from "../components/AppCard";
import SectionHeader from "../components/SectionHeader";
import { useLanguage } from "../context/LanguageContext.jsx";
import { difficultyLabel } from "../i18n/labels.js";
import {
  createFromAiTask,
  createManualTask,
  mapAiParseToUiTask,
  mapTaskResponseToUi,
  mapUiTaskToFromAiPayload,
  nearestPresetDurationMinutes,
  parseTask,
} from "../services/api";

export default function CreateTask({ onTaskCreated }) {
  const { t } = useLanguage();
  const [nlInput, setNlInput] = useState(t("scaffold.defaultPlanExample"));
  const [parsedTask, setParsedTask] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [parseLoading, setParseLoading] = useState(false);
  const [manualTask, setManualTask] = useState({
    title: "",
    durationMinutes: 30,
    durationSeconds: 30 * 60,
    difficulty: "MEDIUM",
    description: "",
  });
  const [manualDuration, setManualDuration] = useState({
    hours: 0,
    minutes: 30,
    seconds: 0,
  });
  const [editTask, setEditTask] = useState(null);
  const [manualError, setManualError] = useState(null);
  const [manualSaving, setManualSaving] = useState(false);
  const [aiConfirmLoading, setAiConfirmLoading] = useState(false);
  const [aiConfirmError, setAiConfirmError] = useState(null);

  const parseWithAi = async () => {
    setParseError(null);
    setParseLoading(true);
    try {
      const data = await parseTask(nlInput, "Europe/Istanbul");
      setParsedTask(mapAiParseToUiTask(data));
      setEditTask(null);
    } catch (err) {
      setParseError(err.message || t("error.connectFailed"));
      setParsedTask(null);
      setEditTask(null);
    } finally {
      setParseLoading(false);
    }
  };

  const startEditParsed = () => {
    if (parsedTask) {
      setEditTask({ ...parsedTask });
    }
  };

  const confirmAiTask = async (task) => {
    setAiConfirmError(null);
    setAiConfirmLoading(true);
    try {
      const created = await createFromAiTask(mapUiTaskToFromAiPayload(task));
      onTaskCreated(mapTaskResponseToUi(created));
      setParsedTask(null);
      setEditTask(null);
    } catch (err) {
      setAiConfirmError(err.message || t("error.connectFailed"));
    } finally {
      setAiConfirmLoading(false);
    }
  };

  const updateManualDuration = (field, value) => {
    const parsed = Number(value);
    const safeValue = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    setManualDuration((prev) => {
      const next = { ...prev, [field]: safeValue };
      const totalSeconds = next.hours * 3600 + next.minutes * 60 + next.seconds;
      const normalizedSeconds = Math.max(totalSeconds, 1);
      setManualTask((taskPrev) => ({
        ...taskPrev,
        durationSeconds: normalizedSeconds,
        durationMinutes: Math.max(Math.ceil(normalizedSeconds / 60), 1),
      }));
      return next;
    });
  };

  const saveManualTask = async () => {
    setManualError(null);
    setManualSaving(true);
    const title = manualTask.title?.trim() || t("scaffold.untitledManualTask");
    const preset = nearestPresetDurationMinutes(manualTask.durationMinutes);
    try {
      const created = await createManualTask({
        title: title.slice(0, 50),
        preset_duration: preset,
        difficulty_level: manualTask.difficulty,
        description: manualTask.description?.trim() || undefined,
      });
      onTaskCreated(mapTaskResponseToUi(created));
    } catch (err) {
      setManualError(err.message || t("error.connectFailed"));
    } finally {
      setManualSaving(false);
    }
  };

  return (
    <div className="page-grid">
      <div>
        <SectionHeader
          title={t("scaffold.aiTaskCreation")}
          subtitle={t("scaffold.aiTaskCreationLead")}
        />
        <AppCard title={t("scaffold.naturalLanguageInput")}>
          <div className="field">
            <label htmlFor="nl-input">{t("scaffold.writeYourPlan")}</label>
            <textarea
              id="nl-input"
              className="textarea"
              value={nlInput}
              onChange={(e) => setNlInput(e.target.value)}
              placeholder={t("scaffold.defaultPlanExample")}
            />
          </div>
          {parseError ? <p className="text-danger">{parseError}</p> : null}
          <AppButton onClick={parseWithAi} disabled={parseLoading}>
            {parseLoading ? t("scaffold.parsing") : t("scaffold.parseWithAi")}
          </AppButton>
        </AppCard>

        {parsedTask ? (
          <AppCard title={t("scaffold.parsedTask")}>
            <p><strong>{t("scaffold.fieldTitle")}:</strong> {parsedTask.title}</p>
            <p><strong>{t("scaffold.fieldStart")}:</strong> {parsedTask.startTime}</p>
            <p><strong>{t("scaffold.fieldEnd")}:</strong> {parsedTask.endTime}</p>
            <p><strong>{t("scaffold.fieldDurationMin")}:</strong> {parsedTask.durationMinutes} min</p>
            <p><strong>{t("common.difficulty")}:</strong> {difficultyLabel(t, parsedTask.difficulty)}</p>
            <p><strong>{t("common.description")}:</strong> {parsedTask.description}</p>
            {parsedTask.calendarUrl ? (
              <p className="field">
                <a href={parsedTask.calendarUrl} target="_blank" rel="noreferrer">
                  {t("scaffold.openCalendarLink")}
                </a>
              </p>
            ) : null}
            {aiConfirmError ? <p className="text-danger">{aiConfirmError}</p> : null}
            <div className="row">
              <AppButton variant="secondary" onClick={startEditParsed} disabled={aiConfirmLoading}>
                {t("scaffold.editBeforeConfirm")}
              </AppButton>
              <AppButton onClick={() => confirmAiTask(parsedTask)} disabled={aiConfirmLoading}>
                {aiConfirmLoading ? t("common.saving") : t("scaffold.confirm")}
              </AppButton>
            </div>
          </AppCard>
        ) : null}

        {editTask ? (
          <AppCard title={t("scaffold.taskConfirmation")}>
            <div className="field">
              <label>{t("scaffold.fieldTitle")}</label>
              <input
                className="input"
                value={editTask.title}
                onChange={(e) => setEditTask((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>{t("common.duration")}</label>
              <select
                className="select"
                value={editTask.durationMinutes}
                onChange={(e) =>
                  setEditTask((prev) => ({
                    ...prev,
                    durationMinutes: Number(e.target.value),
                    durationSeconds: Number(e.target.value) * 60,
                  }))
                }
              >
                {[15, 30, 45, 60].map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {t("scaffold.minutesOption", { minutes })}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>{t("common.difficulty")}</label>
              <select
                className="select"
                value={editTask.difficulty}
                onChange={(e) => setEditTask((prev) => ({ ...prev, difficulty: e.target.value }))}
              >
                {["EASY", "MEDIUM", "HARD"].map((d) => (
                  <option key={d} value={d}>{difficultyLabel(t, d)}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>{t("common.description")}</label>
              <textarea
                className="textarea"
                value={editTask.description}
                onChange={(e) => setEditTask((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            {aiConfirmError ? <p className="text-danger">{aiConfirmError}</p> : null}
            <div className="row">
              <AppButton onClick={() => confirmAiTask(editTask)} disabled={aiConfirmLoading}>
                {aiConfirmLoading ? t("common.saving") : t("scaffold.confirm")}
              </AppButton>
              <AppButton variant="danger" onClick={() => setEditTask(null)} disabled={aiConfirmLoading}>
                {t("common.cancel")}
              </AppButton>
            </div>
          </AppCard>
        ) : null}
      </div>

      <div>
        <SectionHeader
          title={t("scaffold.manualTaskCreation")}
          subtitle={t("scaffold.manualTaskCreationLead")}
        />
        <AppCard title={t("scaffold.createManualTask")}>
          <div className="field">
            <label>{t("scaffold.fieldTitle")}</label>
            <input
              className="input"
              value={manualTask.title}
              onChange={(e) => setManualTask((prev) => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>{t("scaffold.durationHms")}</label>
            <div className="row">
              <input
                className="input"
                type="number"
                min="0"
                value={manualDuration.hours}
                onChange={(e) => updateManualDuration("hours", e.target.value)}
                placeholder={t("scaffold.placeholderHour")}
              />
              <input
                className="input"
                type="number"
                min="0"
                value={manualDuration.minutes}
                onChange={(e) => updateManualDuration("minutes", e.target.value)}
                placeholder={t("scaffold.placeholderMinute")}
              />
              <input
                className="input"
                type="number"
                min="0"
                value={manualDuration.seconds}
                onChange={(e) => updateManualDuration("seconds", e.target.value)}
                placeholder={t("scaffold.placeholderSecond")}
              />
            </div>
            <small className="muted">
              {t("scaffold.totalDurationPreview", {
                seconds: manualTask.durationSeconds,
                minutes: manualTask.durationMinutes,
                preset: nearestPresetDurationMinutes(manualTask.durationMinutes),
              })}
            </small>
          </div>
          <div className="field">
            <label>{t("common.difficulty")}</label>
            <select
              className="select"
              value={manualTask.difficulty}
              onChange={(e) => setManualTask((prev) => ({ ...prev, difficulty: e.target.value }))}
            >
              {["EASY", "MEDIUM", "HARD"].map((d) => (
                <option key={d} value={d}>{difficultyLabel(t, d)}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>{t("common.description")}</label>
            <textarea
              className="textarea"
              value={manualTask.description}
              onChange={(e) => setManualTask((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
          {manualError ? <p className="text-danger">{manualError}</p> : null}
          <AppButton onClick={saveManualTask} disabled={manualSaving}>
            {manualSaving ? t("common.saving") : t("scaffold.saveManualTask")}
          </AppButton>
        </AppCard>
      </div>
    </div>
  );
}
