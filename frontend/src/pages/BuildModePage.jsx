import { useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { FeedbackRegion } from "../components/FeedbackRegion.jsx";
import { BuildModeProgressPanel } from "../components/BuildModeProgressPanel.jsx";
import { HomeTierUpgradeOverlay } from "../components/HomeTierUpgradeOverlay.jsx";
import { StackBuildMode } from "../components/StackBuildMode.jsx";

export function BuildModePage({
  inventory,
  activeHome,
  error,
  offline,
  reward,
  loading,
  mutating,
  highlightBuildArea,
  loadAll,
  placeStackBlock,
  onNavigate,
}) {
  const { t } = useLanguage();
  const [tierUpgrade, setTierUpgrade] = useState(null);
  const bricks = inventory?.resources.bricks ?? 0;

  const handlePlace = async () => {
    const result = await placeStackBlock();
    if (result.tierUpgraded && result.completedHome) {
      setTierUpgrade({
        completedHome: result.completedHome,
        activeHome: result.activeHome,
      });
    }
    return { tierUpgraded: result.tierUpgraded };
  };

  return (
    <div className={`page page-build ${highlightBuildArea ? "page-build--highlighted" : ""}`}>
      <header className="page-header">
        <div className="page-header-copy">
          <p className="page-header-eyebrow">{t("build.title")}</p>
          <h1 className="page-header-title">{t("build.heroTitle")}</h1>
          <p className="page-header-lead">{t("build.heroLead")}</p>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-icon refresh-btn-inline"
          onClick={() => void loadAll(true)}
          disabled={loading || mutating}
          aria-label={t("build.refreshAria")}
        >
          ↻
        </button>
      </header>

      <FeedbackRegion
        error={error}
        offline={offline}
        reward={reward}
        loading={loading}
        mutating={mutating}
        activeView="build"
        onNavigate={onNavigate}
      />

      <div className="build-mode-layout">
        <BuildModeProgressPanel activeHome={activeHome} bricks={bricks} />
        <StackBuildMode
          activeHome={activeHome}
          bricks={bricks}
          isPending={loading || mutating}
          highlighted={highlightBuildArea}
          onPlace={handlePlace}
        />
      </div>

      <p className="build-mode-footer-hint">
        {t("build.needBlocks")}
        <button type="button" className="link-btn" onClick={() => onNavigate("dashboard")}>
          {t("build.startSession")}
        </button>
      </p>

      <HomeTierUpgradeOverlay upgrade={tierUpgrade} onDismiss={() => setTierUpgrade(null)} />
    </div>
  );
}
