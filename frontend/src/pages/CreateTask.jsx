import { useState } from "react";
import AppButton from "../components/AppButton";
import AppCard from "../components/AppCard";
import SectionHeader from "../components/SectionHeader";
import {
  BACKEND_UNAVAILABLE,
  createManualTask,
  mapAiParseToUiTask,
  mapManualTaskResponseToUi,
  nearestPresetDurationMinutes,
  parseTask,
} from "../services/api";

export default function CreateTask({ onCreateManual, onConfirmAiTask }) {
  const [nlInput, setNlInput] = useState(
    "Tomorrow at 3 PM I will study algorithms for 45 minutes.",
  );
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

  const parseWithAi = async () => {
    setParseError(null);
    setParseLoading(true);
    try {
      const data = await parseTask(nlInput, "Europe/Istanbul");
      setParsedTask(mapAiParseToUiTask(data));
      setEditTask(null);
    } catch {
      setParseError(BACKEND_UNAVAILABLE);
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
    const title = manualTask.title?.trim() || "Untitled Manual Task";
    const preset = nearestPresetDurationMinutes(manualTask.durationMinutes);
    try {
      const created = await createManualTask({
        title: title.slice(0, 50),
        preset_duration: preset,
        difficulty_level: manualTask.difficulty,
        description: manualTask.description?.trim() || undefined,
      });
      onCreateManual(mapManualTaskResponseToUi(created));
    } catch {
      setManualError(BACKEND_UNAVAILABLE);
    } finally {
      setManualSaving(false);
    }
  };

  return (
    <div className="page-grid">
      <div>
        <SectionHeader
          title="AI-Assisted Task Creation"
          subtitle="Parse runs on the FastAPI backend (see README for URL and env)."
        />
        <AppCard title="Natural Language Input">
          <div className="field">
            <label htmlFor="nl-input">Write your plan</label>
            <textarea
              id="nl-input"
              className="textarea"
              value={nlInput}
              onChange={(e) => setNlInput(e.target.value)}
              placeholder="Tomorrow at 3 PM I will study algorithms for 45 minutes."
            />
          </div>
          {parseError ? <p className="text-danger">{parseError}</p> : null}
          <AppButton onClick={parseWithAi} disabled={parseLoading}>
            {parseLoading ? "Parsing…" : "Parse with AI"}
          </AppButton>
        </AppCard>

        {parsedTask ? (
          <AppCard title="Parsed task (from backend)">
            <p><strong>Title:</strong> {parsedTask.title}</p>
            <p><strong>Start:</strong> {parsedTask.startTime}</p>
            <p><strong>End:</strong> {parsedTask.endTime}</p>
            <p><strong>Duration:</strong> {parsedTask.durationMinutes} min</p>
            <p><strong>Difficulty:</strong> {parsedTask.difficulty}</p>
            <p><strong>Description:</strong> {parsedTask.description}</p>
            {parsedTask.calendarUrl ? (
              <p className="field">
                <a href={parsedTask.calendarUrl} target="_blank" rel="noreferrer">
                  Open Google Calendar template link
                </a>
              </p>
            ) : null}
            <div className="row">
              <AppButton variant="secondary" onClick={startEditParsed}>Edit Before Confirm</AppButton>
              <AppButton onClick={() => onConfirmAiTask(parsedTask)}>Confirm</AppButton>
            </div>
          </AppCard>
        ) : null}

        {editTask ? (
          <AppCard title="Task Confirmation / Edit">
            <div className="field">
              <label>Title</label>
              <input
                className="input"
                value={editTask.title}
                onChange={(e) => setEditTask((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>Duration</label>
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
                    {minutes} minutes
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Difficulty</label>
              <select
                className="select"
                value={editTask.difficulty}
                onChange={(e) => setEditTask((prev) => ({ ...prev, difficulty: e.target.value }))}
              >
                {["EASY", "MEDIUM", "HARD"].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Description</label>
              <textarea
                className="textarea"
                value={editTask.description}
                onChange={(e) => setEditTask((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="row">
              <AppButton onClick={() => onConfirmAiTask(editTask)}>Confirm</AppButton>
              <AppButton variant="danger" onClick={() => setEditTask(null)}>Cancel</AppButton>
            </div>
          </AppCard>
        ) : null}
      </div>

      <div>
        <SectionHeader
          title="Manual Task Creation"
          subtitle="Saves to the backend (POST /api/tasks/manual). Duration is rounded to 15 / 30 / 45 / 60 minutes."
        />
        <AppCard title="Create Manual Task">
          <div className="field">
            <label>Title</label>
            <input
              className="input"
              value={manualTask.title}
              onChange={(e) => setManualTask((prev) => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Duration (hour / minute / second)</label>
            <div className="row">
              <input
                className="input"
                type="number"
                min="0"
                value={manualDuration.hours}
                onChange={(e) => updateManualDuration("hours", e.target.value)}
                placeholder="Hour"
              />
              <input
                className="input"
                type="number"
                min="0"
                value={manualDuration.minutes}
                onChange={(e) => updateManualDuration("minutes", e.target.value)}
                placeholder="Minute"
              />
              <input
                className="input"
                type="number"
                min="0"
                value={manualDuration.seconds}
                onChange={(e) => updateManualDuration("seconds", e.target.value)}
                placeholder="Second"
              />
            </div>
            <small className="muted">
              Total: {manualTask.durationSeconds} seconds ({manualTask.durationMinutes} minute view) — saved as{" "}
              {nearestPresetDurationMinutes(manualTask.durationMinutes)} min preset
            </small>
          </div>
          <div className="field">
            <label>Difficulty</label>
            <select
              className="select"
              value={manualTask.difficulty}
              onChange={(e) => setManualTask((prev) => ({ ...prev, difficulty: e.target.value }))}
            >
              {["EASY", "MEDIUM", "HARD"].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Description</label>
            <textarea
              className="textarea"
              value={manualTask.description}
              onChange={(e) => setManualTask((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
          {manualError ? <p className="text-danger">{manualError}</p> : null}
          <AppButton onClick={saveManualTask} disabled={manualSaving}>
            {manualSaving ? "Saving…" : "Save Manual Task"}
          </AppButton>
        </AppCard>
      </div>
    </div>
  );
}
