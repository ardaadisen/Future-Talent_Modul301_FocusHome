import AppButton from "./AppButton";
import AppCard from "./AppCard";
import { useLanguage } from "../context/LanguageContext.jsx";
import { statusLabel } from "../i18n/labels.js";

function formatTime(totalSeconds) {
  const min = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const sec = (totalSeconds % 60).toString().padStart(2, "0");
  return `${min}:${sec}`;
}

export default function TimerCard({
  task,
  remainingSeconds,
  onStart,
  onPause,
  onComplete,
  onCancel,
  running,
  sessionMessage,
  actionLoading,
  actionError,
}) {
  const { t } = useLanguage();
  const canClaimReward = Boolean(task) && remainingSeconds === 0;
  const completeLabel = canClaimReward ? t("scaffold.claimReward") : t("scaffold.completeWhenEnds");
  const busy = Boolean(actionLoading);

  return (
    <AppCard title={t("scaffold.timerTitle")}>
      <p className="muted">
        {task
          ? t("scaffold.selectedTask", { title: task.title })
          : t("scaffold.noTaskSelected")}
      </p>
      {task ? (
        <p className="muted">{t("scaffold.status", { status: statusLabel(t, task.status) })}</p>
      ) : null}
      <div className="timer-display">{formatTime(remainingSeconds)}</div>
      {canClaimReward ? (
        <span className="badge badge-timer-ready">{t("timer.finished")}</span>
      ) : null}
      {sessionMessage ? <p className="muted">{sessionMessage}</p> : null}
      {actionError ? <p className="text-danger">{actionError}</p> : null}
      <div className="row" style={{ marginTop: "0.8rem" }}>
        <AppButton onClick={onStart} disabled={!task || running || remainingSeconds === 0 || busy}>
          {busy ? t("scaffold.working") : running ? t("scaffold.running") : t("common.start")}
        </AppButton>
        <AppButton variant="secondary" onClick={onPause} disabled={!task || !running || busy}>
          {t("common.pause")}
        </AppButton>
        <AppButton variant="secondary" onClick={onComplete} disabled={!canClaimReward || busy}>
          {busy ? t("scaffold.working") : completeLabel}
        </AppButton>
        <AppButton variant="danger" onClick={onCancel} disabled={!task || busy}>
          {busy ? t("scaffold.working") : t("scaffold.cancel")}
        </AppButton>
      </div>
    </AppCard>
  );
}
