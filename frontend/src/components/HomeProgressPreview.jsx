import { useLanguage } from "../context/LanguageContext.jsx";
import { blocksReadyLabel, nextTierLabel, tierLabel } from "../i18n/labels.js";
import { getStackProgressPercent } from "../utils/homeTiers.js";

export function HomeProgressPreview({ inventory, activeHome, onNavigate }) {
  const { t } = useLanguage();
  const level = inventory?.level ?? 0;
  const bricks = inventory?.resources.bricks ?? 0;
  const tier = activeHome?.currentTier ?? "SHACK";
  const progressPercent = getStackProgressPercent(activeHome);
  const nextTier = nextTierLabel(t, tier);

  return (
    <section className="card home-progress-preview" aria-labelledby="home-preview-title">
      <div className="home-progress-preview-header">
        <div>
          <p className="home-progress-preview-eyebrow">{t("dashboard.homePreview")}</p>
          <h2 className="home-progress-preview-title" id="home-preview-title">
            {t("dashboard.homePreviewMeta", { tier: tierLabel(t, tier), level })}
          </h2>
          <p className="home-progress-preview-meta">
            {blocksReadyLabel(t, bricks)}
            {nextTier ? ` · ${t("common.nextTier", { tier: nextTier })}` : ` · ${t("common.finalTier")}`}
          </p>
        </div>
        <span className="home-progress-preview-badge" aria-hidden>
          🏠
        </span>
      </div>

      <div className="home-progress-preview-track" aria-hidden>
        <div className="home-progress-preview-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="home-progress-preview-actions">
        <button type="button" className="btn btn-primary" onClick={() => onNavigate("home")}>
          {t("dashboard.myHome")}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => onNavigate("build")}>
          {t("dashboard.buildMode")}
        </button>
      </div>
    </section>
  );
}
