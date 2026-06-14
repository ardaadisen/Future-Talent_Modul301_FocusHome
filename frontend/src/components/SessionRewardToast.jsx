import { useLanguage } from "../context/LanguageContext.jsx";

export function SessionRewardToast({
  xpGained,
  bricksGained,
  isOnBuildPage = false,
  onGoToBuild
}) {
  const { t } = useLanguage();

  return (
    <div className="session-reward-toast motion-toast" role="status" aria-live="polite">
      <div className="session-reward-header">
        <span className="session-reward-icon" aria-hidden>
          🎉
        </span>
        <div>
          <p className="session-reward-title">{t("reward.sessionComplete")}</p>
          <p className="session-reward-subtitle">{t("reward.greatFocus")}</p>
        </div>
      </div>

      <div className="session-reward-chips">
        {xpGained > 0 && (
          <span className="session-reward-chip session-reward-chip-xp">
            <span className="session-reward-chip-icon" aria-hidden>
              ✨
            </span>
            {t("reward.xpGained", { xp: xpGained })}
          </span>
        )}
        {bricksGained > 0 && (
          <span className="session-reward-chip session-reward-chip-brick">
            <span className="session-reward-chip-icon" aria-hidden>
              🧱
            </span>
            {bricksGained === 1
              ? t("reward.brickGained", { count: bricksGained })
              : t("reward.bricksGained", { count: bricksGained })}
          </span>
        )}
      </div>

      {isOnBuildPage ? (
        <p className="session-reward-hint">{t("reward.buildModeReady")}</p>
      ) : (
        onGoToBuild && (
          <button type="button" className="btn btn-primary session-reward-cta" onClick={onGoToBuild}>
            {t("reward.goBuildMode")}
          </button>
        )
      )}
    </div>
  );
}
