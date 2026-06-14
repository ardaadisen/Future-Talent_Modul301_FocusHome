import { useEffect, useMemo, useState } from "react";

import { useLanguage } from "../context/LanguageContext.jsx";
import { statusLabel as getStatusLabel } from "../i18n/labels.js";
import { formatTimer } from "../utils/format.js";

export function TimerPanel({
  task,
  isPending = false,
  pendingCount = 0,
  onStart,
  onComplete,
  onAbandon,
}) {
  const { t } = useLanguage();
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!task) {
      setRunning(false);
      setSecondsLeft(0);
      setShowSuccess(false);
      return;
    }

    setRunning(false);
    setSecondsLeft(task.durationSeconds);
    setShowSuccess(false);
  }, [task]);

  useEffect(() => {
    if (!running || secondsLeft <= 0) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running, secondsLeft]);

  useEffect(() => {
    if (!showSuccess) return;
    const timer = window.setTimeout(() => setShowSuccess(false), 2200);
    return () => window.clearTimeout(timer);
  }, [showSuccess]);

  const canControl = useMemo(
    () => Boolean(task && !isPending && task.status !== "COMPLETED" && task.status !== "ABANDONED"),
    [isPending, task]
  );

  const statusKey = task?.status.toLowerCase() ?? "";

  const handleStart = async () => {
    if (!task || !canControl) return;
    if (task.status === "PENDING" && onStart) {
      try {
        await onStart(task.id);
      } catch {
        return;
      }
    }
    setRunning(true);
  };

  const handleComplete = async () => {
    if (!task) return;
    setRunning(false);
    setShowSuccess(true);
    await onComplete(task.id);
  };

  return (
    <section className="card timer-panel" aria-label={t("timer.activeSession")}>
      <div className="timer-panel-header">
        <div>
          <h2 className="section-title">{t("timer.activeSession")}</h2>
          <p className="section-lead timer-panel-lead">
            {task ? t("timer.stayInZone") : t("timer.lead")}
          </p>
        </div>
        <span className="timer-panel-badge" aria-label={t("timer.sessionsReady", { count: pendingCount })}>
          {t("timer.readyBadge", { count: pendingCount })}
        </span>
      </div>

      {!task && (
        <div className="timer-idle-shell">
          <div className="timer-idle-ring" aria-hidden>
            <div className="timer-display timer-display-idle">25:00</div>
          </div>
          <p className="timer-idle-title">{t("timer.readyWhenYouAre")}</p>
          <p className="timer-idle-copy">{t("timer.pickSession")}</p>
          <ol className="timer-idle-steps">
            <li>
              <span className="timer-idle-step-num">1</span>
              {t("timer.createOrChoose")}
            </li>
            <li>
              <span className="timer-idle-step-num">2</span>
              {t("timer.tapFocus")}
            </li>
            <li>
              <span className="timer-idle-step-num">3</span>
              {t("timer.completeReward")}
            </li>
          </ol>
        </div>
      )}

      {task && (
        <div className={`timer-shell ${showSuccess ? "timer-shell--success" : ""}`}>
          {showSuccess && (
            <p className="timer-success-message" role="status">
              {t("timer.sessionComplete")}
            </p>
          )}
          <p className="timer-task-title">{task.title}</p>
          <p className="timer-meta">
            <span className={`badge-pill badge-status badge-status-${statusKey}`}>
              {getStatusLabel(t, task.status)}
            </span>
          </p>
          <div className="timer-display" aria-live="polite" aria-atomic="true">
            {formatTimer(secondsLeft)}
          </div>
          <div className="timer-actions">
            <button className="btn btn-primary" onClick={() => void handleStart()} disabled={!canControl || running || isPending} type="button">
              {t("common.start")}
            </button>
            <button className="btn btn-ghost" onClick={() => setRunning(false)} disabled={!canControl || !running} type="button">
              {t("common.pause")}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setRunning(false);
                setSecondsLeft(task.durationSeconds);
              }}
              disabled={!canControl}
              type="button"
            >
              {t("common.reset")}
            </button>
            <button className="btn btn-primary" onClick={() => void handleComplete()} disabled={!canControl} type="button">
              {t("common.complete")}
            </button>
            <button className="btn btn-ghost" onClick={() => void onAbandon(task.id)} disabled={!canControl} type="button">
              {t("common.abandon")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
