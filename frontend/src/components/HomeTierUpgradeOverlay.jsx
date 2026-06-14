import { useLanguage } from "../context/LanguageContext.jsx";
import { tierLabel } from "../i18n/labels.js";

export function HomeTierUpgradeOverlay({ upgrade, onDismiss }) {
  const { t } = useLanguage();

  if (!upgrade) return null;

  const completedLabel = tierLabel(t, upgrade.completedHome.tier);
  const nextLabel = tierLabel(t, upgrade.activeHome.currentTier);

  return (
    <div className="tier-upgrade-overlay" role="dialog" aria-modal="true" aria-labelledby="tier-upgrade-title">
      <div className="tier-upgrade-card tier-upgrade-card--celebrate">
        <p className="tier-upgrade-eyebrow">{t("upgrade.title")}</p>
        <h2 className="tier-upgrade-title" id="tier-upgrade-title">
          {t("upgrade.archived", { tier: completedLabel })}
        </h2>
        <p className="tier-upgrade-lead">
          {t("upgrade.message", { completed: completedLabel, next: nextLabel })}
        </p>
        <div className="tier-upgrade-badges" aria-hidden>
          <span className="tier-upgrade-badge tier-upgrade-badge--from">{completedLabel}</span>
          <span className="tier-upgrade-arrow">→</span>
          <span className="tier-upgrade-badge tier-upgrade-badge--to">{nextLabel}</span>
        </div>
        <button type="button" className="btn btn-primary" onClick={onDismiss}>
          {t("upgrade.keepBuilding")}
        </button>
      </div>
    </div>
  );
}
