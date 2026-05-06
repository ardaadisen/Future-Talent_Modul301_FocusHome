import AppCard from "../components/AppCard";
import SectionHeader from "../components/SectionHeader";
import TimerCard from "../components/TimerCard";
import { getRewardForDifficulty } from "../utils/rewards";

export default function FocusTimer({
  selectedTask,
  remainingSeconds,
  running,
  sessionMessage,
  onStart,
  onPause,
  onComplete,
  onCancel,
}) {
  const reward = selectedTask ? getRewardForDifficulty(selectedTask.difficulty) : null;

  return (
    <div className="page-grid">
      <div>
        <SectionHeader title="Focus Session" subtitle="Visual timer with local state controls." />
        <TimerCard
          task={selectedTask}
          remainingSeconds={remainingSeconds}
          sessionMessage={sessionMessage}
          onStart={onStart}
          onPause={onPause}
          onComplete={onComplete}
          onCancel={onCancel}
          running={running}
        />
      </div>
      <div>
        <AppCard title="Reward Preview">
          <p className="muted">Reward logic shown in UI (mocked).</p>
          <p className="muted">
            Note: In future daily/deadline task flows, manual completion may be allowed without full timer completion.
          </p>
          <p>EASY - 2 bricks + 20 XP</p>
          <p>MEDIUM - 5 bricks + 50 XP</p>
          <p>HARD - 10 bricks + 100 XP</p>
          {reward ? <p><strong>Selected reward:</strong> +{reward.bricks} bricks, +{reward.xp} XP</p> : null}
        </AppCard>
      </div>
    </div>
  );
}
