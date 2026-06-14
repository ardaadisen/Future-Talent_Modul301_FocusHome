import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { getLevelProgress } from "../utils/progress.js";

export function XpLevelProgress({ totalXp, level }) {
  const { t } = useLanguage();
  const progress = getLevelProgress(totalXp, level);
  const previousPercent = useRef(progress.percent);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (previousPercent.current === progress.percent) return;

    previousPercent.current = progress.percent;
    setIsUpdating(true);
    const timer = window.setTimeout(() => setIsUpdating(false), 650);
    return () => window.clearTimeout(timer);
  }, [progress.percent, progress.totalXp, progress.level]);

  return (
    <div className={`xp-level-card ${isUpdating ? "xp-level-card--pulse" : ""}`}>
      <div className="xp-level-top">
        <div className="xp-level-badge" aria-hidden>
          <span className="xp-level-badge-value">{progress.level}</span>
        </div>
        <div className="xp-level-copy">
          <p className="xp-level-title">{t("home.xpLevel", { level: progress.level })}</p>
          <p className="xp-level-progress-text">
            {t("home.xpToNext", { current: progress.xpIntoCurrentLevel, target: progress.xpToNextLevel })}
          </p>
          <p className="xp-level-total">{t("home.xpTotal", { total: progress.totalXp.toLocaleString() })}</p>
        </div>
      </div>
      <div
        className="progress-track progress-track-lg"
        role="progressbar"
        aria-valuenow={progress.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t("home.xpProgressAria", { percent: progress.percent, level: progress.level + 1 })}
      >
        <div
          className={`progress-fill progress-fill-glow ${isUpdating ? "progress-fill-updating" : ""}`}
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      <div className="xp-level-markers">
        <span>{t("home.xpLevel", { level: progress.level })}</span>
        <span>{t("home.xpLevel", { level: progress.level + 1 })}</span>
      </div>
    </div>
  );
}
