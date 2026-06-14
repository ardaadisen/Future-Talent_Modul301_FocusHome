import { useRef } from "react";

import { sortPlacementsByZIndex } from "../shared/index.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { tierDescription, tierLabel, tierMood } from "../i18n/labels.js";
import { getTierTheme, getTierThemeStyles } from "../utils/tierThemes.js";
import { DraggablePlacement } from "./DraggablePlacement.jsx";

export function CozyHomeScene({
  activeHome,
  placements = [],
  selectedPlacementId,
  newPlacementId,
  isPending = false,
  onSelectPlacement,
  onPlacementMoveCommit,
  onRotatePlacement,
  onDeletePlacement,
  onBringFront,
  onSendBack,
  onDropDecoration,
}) {
  const { t } = useLanguage();
  const tier = activeHome?.currentTier ?? "SHACK";
  const theme = getTierTheme(tier);
  const tierKey = (tier || "SHACK").toLowerCase();
  const sceneStyle = getTierThemeStyles(tier);
  const roomRef = useRef(null);
  const sorted = sortPlacementsByZIndex(Array.isArray(placements) ? placements : []);
  const stackProgress = activeHome?.stackProgress ?? 0;
  const stackTarget = activeHome?.stackTarget ?? 0;
  const displayName = tierLabel(t, tier);
  const mood = tierMood(t, tier);
  const description = tierDescription(t, tier);

  const handleRoomClick = () => {
    onSelectPlacement(null);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const decorationId = event.dataTransfer.getData("application/focushome-decoration");
    if (!decorationId || !roomRef.current || !onDropDecoration) return;

    const rect = roomRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    onDropDecoration(decorationId, x, y);
  };

  return (
    <section
      className={`cozy-home-scene cozy-home-scene--${tierKey}`}
      style={sceneStyle}
      aria-labelledby="cozy-scene-title"
    >
      <header className="cozy-scene-header">
        <div>
          <p className="cozy-scene-eyebrow" style={{ color: theme.accent }}>
            {t("home.moodDisplay", { mood, name: displayName })}
          </p>
          <h2 className="cozy-scene-title" id="cozy-scene-title">
            {displayName}
          </h2>
          <p className="cozy-scene-description">{description}</p>
        </div>
        <span className="cozy-scene-badge" style={{ borderColor: theme.accent, color: theme.accent }}>
          {t("home.builtProgress", { current: stackProgress, target: stackTarget })}
        </span>
      </header>

      <p className="cozy-scene-editor-hint">{t("home.dragArrange")}</p>

      <div
        ref={roomRef}
        className={`cozy-room cozy-room--editor cozy-room--${tierKey} cozy-room--floor-${theme.floorStyle} cozy-room--window-${theme.windowStyle}`}
        role="application"
        aria-label={t("home.interiorEditorAria", { name: displayName })}
        onClick={handleRoomClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{ "--tier-accent": theme.accent }}
      >
        <div className="cozy-room-wall" aria-hidden />
        <div className="cozy-room-floor" aria-hidden />
        <div className={`cozy-room-window cozy-room-window--${theme.windowStyle}`} aria-hidden>
          <div className="cozy-room-window-sky" aria-hidden />
        </div>
        <div className="cozy-room-glow" aria-hidden />
        <div className="cozy-room-rug" aria-hidden />

        {theme.decorElements.map((element) => (
          <div key={element} className={`cozy-deco cozy-deco--${element}`} aria-hidden />
        ))}

        <div className="cozy-room-placements">
          {sorted.map((placement) => (
            <DraggablePlacement
              key={placement.placementId}
              placement={placement}
              isSelected={selectedPlacementId === placement.placementId}
              isNew={newPlacementId === placement.placementId}
              isPending={isPending}
              roomRef={roomRef}
              onSelect={onSelectPlacement}
              onMoveCommit={onPlacementMoveCommit}
              onRotate={onRotatePlacement}
              onDelete={onDeletePlacement}
              onBringFront={onBringFront}
              onSendBack={onSendBack}
            />
          ))}
        </div>

        {sorted.length === 0 && (
          <p className="cozy-room-empty-hint">{t("home.placeFromPanel")}</p>
        )}
      </div>
    </section>
  );
}
