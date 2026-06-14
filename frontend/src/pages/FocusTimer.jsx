import AppCard from "../components/AppCard";
import SectionHeader from "../components/SectionHeader";
import TimerCard from "../components/TimerCard";
import { useLanguage } from "../context/LanguageContext.jsx";
import { getRewardForDifficulty } from "../utils/rewards";

export default function FocusTimer({
  task,
  remainingSeconds,
  running,
  sessionMessage,
  actionLoading,
  actionError,
  onStart,
  onPause,
  onComplete,
  onCancel,
}) {
  const { t } = useLanguage();
  const reward = task ? getRewardForDifficulty(task.difficultyLevel || task.difficulty) : null;

  return (
    <div>
      <SectionHeader
        title={t("scaffold.focusSession")}
        subtitle={t("scaffold.focusSessionLead")}
      />

      <TimerCard
        task={task}
        remainingSeconds={remainingSeconds}
        running={running}
        sessionMessage={sessionMessage}
        actionLoading={actionLoading}
        actionError={actionError}
        onStart={onStart}
        onPause={onPause}
        onComplete={onComplete}
        onCancel={onCancel}
      />

      {reward && (
        <AppCard title={t("scaffold.rewardPreview")}>
          <p className="muted">{t("scaffold.rewardPreviewLead")}</p>
          <p>{t("scaffold.rewardEasy")}</p>
          <p>{t("scaffold.rewardMedium")}</p>
          <p>{t("scaffold.rewardHard")}</p>
          <p>
            <strong>
              {t("scaffold.expectedReward", { bricks: reward.bricks, xp: reward.xp })}
            </strong>
          </p>
        </AppCard>
      )}
    </div>
  );
}
