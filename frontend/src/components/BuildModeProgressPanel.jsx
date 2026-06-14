import { useLanguage } from "../context/LanguageContext.jsx";
import { nextTierLabel, tierLabel } from "../i18n/labels.js";
import { getStackProgressPercent } from "../utils/homeTiers.js";

export function BuildModeProgressPanel({ activeHome, bricks }) {
  const { t } = useLanguage();
  const tier = activeHome?.currentTier ?? "SHACK";
  const stackProgress = activeHome?.stackProgress ?? 0;
  const stackTarget = activeHome?.stackTarget ?? 0;
  const progressPercent = getStackProgressPercent(activeHome);
  const nextTier = nextTierLabel(t, tier);
  const remaining = Math.max(0, stackTarget - stackProgress);

  return (
    <aside className="build-mode-progress card" aria-labelledby="build-progress-title">
      <p className="build-mode-progress-eyebrow">{t("build.currentHome")}</p>
      <h2 className="build-mode-progress-title" id="build-progress-title">
        {tierLabel(t, tier)}
      </h2>

      <div className="build-mode-progress-track" role="progressbar" aria-valuenow={stackProgress} aria-valuemin={0} aria-valuemax={stackTarget}>
        <div className="build-mode-progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      <dl className="build-mode-progress-stats">
        <div>
          <dt>{t("build.stackProgress")}</dt>
          <dd>
            {stackProgress} / {stackTarget}
          </dd>
        </div>
        <div>
          <dt>{t("build.blocksAvailable")}</dt>
          <dd>{bricks}</dd>
        </div>
        <div>
          <dt>{t("build.nextUnlock")}</dt>
          <dd>{nextTier ? t("build.nextUnlockDetail", { remaining, tier: nextTier }) : t("common.finalTier")}</dd>
        </div>
      </dl>
    </aside>
  );
}
