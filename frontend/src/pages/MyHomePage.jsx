import { useEffect, useMemo, useState } from "react";

import { CozyHomeScene } from "../components/CozyHomeScene.jsx";
import { DecorationCatalogPanel } from "../components/DecorationCatalogPanel.jsx";
import { FeedbackRegion } from "../components/FeedbackRegion.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { nextTierLabel, tierDescription, tierLabel, tierMood } from "../i18n/labels.js";
import { ensureActiveHome } from "../utils/activeHomeDefaults.js";
import { getStackProgressPercent, getTierTheme } from "../utils/homeTiers.js";
import { MOTION } from "../utils/motion.js";

export function MyHomePage({
  activeHome,
  inventory,
  error,
  offline,
  reward,
  loading,
  mutating,
  loadAll,
  createDecorationPlacement,
  moveDecorationPlacement,
  deleteDecorationPlacement,
  rotateDecorationPlacement,
  bringPlacementForward,
  sendPlacementBackward,
  onNavigate,
}) {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState("bed");
  const [selectedPlacementId, setSelectedPlacementId] = useState(null);
  const [newPlacementId, setNewPlacementId] = useState(null);

  const home = useMemo(() => ensureActiveHome(activeHome), [activeHome]);
  const tier = home.currentTier ?? "SHACK";
  const tierTheme = getTierTheme(tier);
  const progressPercent = getStackProgressPercent(home);
  const nextTier = nextTierLabel(t, tier);
  const bricks = inventory?.resources?.bricks ?? 0;
  const placements = home.decorationPlacements ?? [];

  const handlePlace = async (decorationId, x, y) => {
    if (!createDecorationPlacement) return;
    const placementId = await createDecorationPlacement(decorationId, x, y);
    if (placementId) {
      setSelectedPlacementId(placementId);
      setNewPlacementId(placementId);
    }
  };

  const handleDelete = async (placementId) => {
    if (!deleteDecorationPlacement) return;
    await deleteDecorationPlacement(placementId);
    setSelectedPlacementId((current) => (current === placementId ? null : current));
  };

  useEffect(() => {
    if (!newPlacementId) return;
    const timer = window.setTimeout(() => setNewPlacementId(null), MOTION.decorFlash);
    return () => window.clearTimeout(timer);
  }, [newPlacementId]);

  return (
    <div className={`page page-home page-home--${tier.toLowerCase()}`}>
      <header
        className="home-hero home-hero--tier"
        style={{
          "--tier-accent": tierTheme.accent,
          "--tier-accent-soft": tierTheme.accentSoft,
        }}
      >
        <div>
          <p className="home-hero-eyebrow">{t("home.moodHome", { mood: tierMood(t, tier) })}</p>
          <h1 className="home-hero-title">{tierLabel(t, tier)}</h1>
          <p className="home-hero-subtitle">{tierDescription(t, tier)}</p>
        </div>
        <div className="home-hero-actions">
          <span className="home-hero-brick-count" aria-label={t("home.blocksAvailable", { bricks })}>
            🧱 {bricks}
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-icon refresh-btn-inline"
            onClick={() => void loadAll(true)}
            disabled={loading || mutating}
            aria-label={t("home.refreshAria")}
          >
            ↻
          </button>
        </div>
      </header>

      <FeedbackRegion
        error={error}
        offline={offline}
        reward={reward}
        loading={loading}
        mutating={mutating}
        activeView="home"
        onNavigate={onNavigate}
      />

      <div
        className="home-tier-summary card home-tier-summary--tier"
        style={{ "--tier-accent": tierTheme.accent }}
      >
        <div className="home-tier-summary-copy">
          <p className="home-tier-summary-label">{t("home.tierProgress")}</p>
          <p className="home-tier-summary-value">
            {t("home.stackProgress", { current: home.stackProgress ?? 0, target: home.stackTarget ?? 0 })}
            {nextTier ? ` · ${t("common.nextTier", { tier: nextTier })}` : ""}
          </p>
        </div>
        <div className="home-tier-summary-track" aria-hidden>
          <div className="home-tier-summary-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <button type="button" className="btn btn-primary" onClick={() => onNavigate("build")}>
          {t("build.title")}
        </button>
      </div>

      <div className="my-home-layout">
        <CozyHomeScene
          activeHome={home}
          placements={placements}
          selectedPlacementId={selectedPlacementId}
          newPlacementId={newPlacementId}
          isPending={loading || mutating}
          onSelectPlacement={setSelectedPlacementId}
          onPlacementMoveCommit={(placementId, x, y) => {
            if (moveDecorationPlacement) {
              void moveDecorationPlacement(placementId, x, y);
            }
          }}
          onRotatePlacement={(placementId) => {
            if (rotateDecorationPlacement) {
              void rotateDecorationPlacement(placementId);
            }
          }}
          onDeletePlacement={(placementId) => void handleDelete(placementId)}
          onBringFront={(placementId) => {
            if (bringPlacementForward) {
              void bringPlacementForward(placementId);
            }
          }}
          onSendBack={(placementId) => {
            if (sendPlacementBackward) {
              void sendPlacementBackward(placementId);
            }
          }}
          onDropDecoration={(decorationId, x, y) => void handlePlace(decorationId, x, y)}
        />
        <DecorationCatalogPanel
          activeHome={home}
          selectedCategory={selectedCategory}
          isPending={loading || mutating}
          onSelectCategory={setSelectedCategory}
          onPlaceDecoration={(decorationId) => void handlePlace(decorationId)}
        />
      </div>
    </div>
  );
}
