import AppButton from "./AppButton";
import AppCard from "./AppCard";

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
}) {
  const canClaimReward = Boolean(task) && remainingSeconds === 0;
  const completeLabel = canClaimReward ? "Claim Reward" : "Complete when timer ends";

  return (
    <AppCard title="Focus Timer">
      <p className="muted">Selected task: {task ? task.title : "No task selected"}</p>
      <div className="timer-display">{formatTime(remainingSeconds)}</div>
      {canClaimReward ? <span className="badge badge-timer-ready">Timer finished - reward claim ready</span> : null}
      {sessionMessage ? <p className="muted">{sessionMessage}</p> : null}
      <div className="row" style={{ marginTop: "0.8rem" }}>
        <AppButton onClick={onStart} disabled={!task || running || remainingSeconds === 0}>
          {running ? "Running..." : "Start"}
        </AppButton>
        <AppButton variant="secondary" onClick={onPause} disabled={!task || !running}>
          Pause
        </AppButton>
        <AppButton variant="secondary" onClick={onComplete} disabled={!canClaimReward}>
          {completeLabel}
        </AppButton>
        <AppButton variant="danger" onClick={onCancel}>Cancel</AppButton>
      </div>
    </AppCard>
  );
}
