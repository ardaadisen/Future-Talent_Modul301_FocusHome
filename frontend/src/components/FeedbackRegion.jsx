import { useLanguage } from "../context/LanguageContext.jsx";
import { SessionRewardToast } from "./SessionRewardToast.jsx";

const rewardIcon = (kind) => {
  if (kind === "brick") return "🧱";
  if (kind === "xp") return "✨";
  if (kind === "info") return "💡";
  return "🎉";
};

export function FeedbackRegion({
  error,
  offline,
  reward,
  loading,
  mutating,
  activeView,
  onNavigate
}) {
  const { t } = useLanguage();

  return (
    <div className="feedback-region" aria-live="polite" aria-atomic="true">
      {error && !offline && (
        <p key={error} className="banner banner-error" role="alert">
          {error}
        </p>
      )}
      {offline && (
        <p key="offline" className="banner banner-error" role="alert">
          {t("feedback.loadError")}
        </p>
      )}
      {reward?.type === "session-complete" && (
        <SessionRewardToast
          key={`session-${reward.xpGained}-${reward.bricksGained}`}
          xpGained={reward.xpGained}
          bricksGained={reward.bricksGained}
          isOnBuildPage={activeView === "build"}
          onGoToBuild={onNavigate ? () => onNavigate("build") : undefined}
        />
      )}
      {reward?.type === "simple" && (
        <p key={`${reward.kind}-${reward.messageKey ?? reward.message}`} className={`reward-toast reward-toast-${reward.kind} motion-toast`} role="status">
          <span className="reward-toast-icon" aria-hidden>
            {rewardIcon(reward.kind)}
          </span>
          {reward.messageKey ? t(reward.messageKey, reward.params) : reward.message}
        </p>
      )}
      {loading && (
        <p key="loading" className="banner banner-info" role="status">
          {t("feedback.loading")}
        </p>
      )}
      {!loading && mutating && (
        <p key="mutating" className="banner banner-info" role="status">
          {t("feedback.saving")}
        </p>
      )}
    </div>
  );
}
