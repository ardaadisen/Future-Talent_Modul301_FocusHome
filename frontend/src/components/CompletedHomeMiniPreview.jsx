import { getDecorationById, normalizeDecorationPlacements, sortPlacementsByZIndex } from "../shared/index.js";

import { getTierThemeStyles } from "../utils/tierThemes.js";


export function CompletedHomeMiniPreview({ home }) {
  const tierKey = home.tier.toLowerCase();
  const sceneStyle = getTierThemeStyles(home.tier);
  const placements = sortPlacementsByZIndex(
    normalizeDecorationPlacements(home.decorationPlacements, home.decorations)
  );

  return (
    <div
      className={`archive-mini-scene archive-mini-scene--${tierKey}`}
      style={sceneStyle}
      aria-hidden
    >
      <div className="archive-mini-wall" />
      <div className="archive-mini-floor" />
      <div className="archive-mini-window" />
      <div className="archive-mini-rug" />
      {placements.map((placement) => {
        const decoration = getDecorationById(placement.decorationId);
        if (!decoration) return null;

        return (
          <span
            key={placement.placementId}
            className="archive-mini-decoration archive-mini-placement"
            style={{
              left: `${placement.x}%`,
              top: `${placement.y}%`,
              zIndex: placement.zIndex,
              transform: `translate(-50%, -50%) rotate(${placement.rotation}deg)`
            }}
          >
            {decoration.emoji}
          </span>
        );
      })}
    </div>
  );
}

export const getDecorationPreviewItems = (home) => {
  const placements = normalizeDecorationPlacements(home.decorationPlacements, home.decorations);
  return placements
    .map((placement) => {
      const item = getDecorationById(placement.decorationId);
      return item ? { placement, item } : null;
    })
    .filter((entry) => entry !== null);
};
