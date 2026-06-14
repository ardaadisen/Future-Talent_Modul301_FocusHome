import { useEffect, useMemo, useState } from "react";

import { useLanguage } from "../context/LanguageContext.jsx";
import { blocksReadyLabel } from "../i18n/labels.js";
import { HomeMilestoneTracker } from "./HomeMilestoneTracker.jsx";
import { getMilestoneProgress, shouldShowRoofCapOnCell, shouldShowWindowOnCell, TOTAL_BUILD_SLOTS } from "../utils/homeMilestones.js";

const BUILD_SLOTS = Array.from({ length: TOTAL_BUILD_SLOTS }, (_, index) => ({
  x: index % 5,
  y: Math.floor(index / 5)
}));

export function HomeConstructionZone({
  grid,
  bricks,
  isPending = false,
  highlighted = false,
  onPlace,
  onRemove,
}) {
  const { t } = useLanguage();
  const [placementErrorKey, setPlacementErrorKey] = useState(null);
  const [placingCellKey, setPlacingCellKey] = useState(null);
  const [recentlyPlacedKey, setRecentlyPlacedKey] = useState(null);
  const [localFeedbackKey, setLocalFeedbackKey] = useState(null);

  const placedCount = useMemo(() => grid?.cells.length ?? 0, [grid]);
  const milestoneProgress = useMemo(() => getMilestoneProgress(placedCount), [placedCount]);

  useEffect(() => {
    if (!recentlyPlacedKey) return;
    const timer = window.setTimeout(() => setRecentlyPlacedKey(null), 700);
    return () => window.clearTimeout(timer);
  }, [recentlyPlacedKey]);

  useEffect(() => {
    if (!localFeedbackKey) return;
    const timer = window.setTimeout(() => setLocalFeedbackKey(null), 2800);
    return () => window.clearTimeout(timer);
  }, [localFeedbackKey]);

  const handleCellClick = async (x, y) => {
    const cellKey = `${x}-${y}`;
    const occupied = Boolean(grid?.cells.some((cell) => cell.x === x && cell.y === y));

    if (occupied) {
      if (!onRemove) {
        setPlacementErrorKey("construction.spotOccupied");
        return;
      }
      setPlacementErrorKey(null);
      setPlacingCellKey(cellKey);
      try {
        await onRemove(x, y);
        setLocalFeedbackKey("construction.blockRemoved");
      } catch {
        setPlacementErrorKey("construction.removeFailed");
      } finally {
        setPlacingCellKey(null);
      }
      return;
    }

    if (bricks < 1) {
      setPlacementErrorKey("construction.needBrick");
      return;
    }

    setPlacementErrorKey(null);
    setPlacingCellKey(cellKey);

    try {
      await onPlace(x, y);
      setRecentlyPlacedKey(cellKey);
      setLocalFeedbackKey("construction.brickPlaced");
    } catch {
      setPlacementErrorKey("construction.placeFailed");
    } finally {
      setPlacingCellKey(null);
    }
  };

  return (
    <section
      className={`home-construction-zone ${highlighted ? "home-construction-zone--highlighted" : ""}`}
      aria-labelledby="construction-zone-title"
    >
      <header className="construction-zone-header">
        <div>
          <h2 className="construction-zone-title" id="construction-zone-title">
            {t("construction.title")}
          </h2>
          <p className="construction-zone-lead">{t("construction.lead")}</p>
        </div>
        <div className="construction-zone-meta">
          <span className="construction-meta-pill">
            {t("construction.blocks", { placed: placedCount, total: TOTAL_BUILD_SLOTS })}
          </span>
          <span className="construction-meta-pill construction-meta-bricks">
            {blocksReadyLabel(t, bricks)}
          </span>
        </div>
      </header>

      <HomeMilestoneTracker progress={milestoneProgress} placedCount={placedCount} />

      {localFeedbackKey && (
        <p className="construction-local-feedback" role="status">
          <span aria-hidden>✨</span> {t(localFeedbackKey)}
        </p>
      )}

      {placementErrorKey && (
        <p className="field-error construction-error" role="alert">
          {t(placementErrorKey)}
        </p>
      )}

      <div className="construction-scene">
        <div className="construction-sky" aria-hidden>
          <span className="construction-cloud construction-cloud-a" />
          <span className="construction-cloud construction-cloud-b" />
        </div>

        <div className="construction-yard">
          <div
            className="construction-house-silhouette"
            style={{ opacity: 0.15 + milestoneProgress.overallPercent / 100 * 0.45 }}
            aria-hidden
          />

          {placedCount === 0 && (
            <div className="construction-empty-banner">
              <p className="construction-empty-title">{t("construction.plotReady")}</p>
              <p className="construction-empty-text">{t("construction.plotReadyLead")}</p>
            </div>
          )}

          <div className="construction-foundation-frame">
            <div className="construction-foundation-slab" aria-hidden />
            <div className="construction-grid">
              {BUILD_SLOTS.map((cell) => {
                const occupied = Boolean(grid?.cells.find((c) => c.x === cell.x && c.y === cell.y));
                const cellKey = `${cell.x}-${cell.y}`;
                const isPlacing = placingCellKey === cellKey;
                const justPlaced = recentlyPlacedKey === cellKey;
                const isFoundationRow = cell.y === 4;
                const showWindow = shouldShowWindowOnCell(cell.x, cell.y, placedCount, occupied);
                const showRoofCap = shouldShowRoofCapOnCell(cell.x, cell.y, placedCount, occupied);

                return (
                  <button
                    key={cellKey}
                    className={[
                      "construction-slot",
                      occupied ? "occupied" : "empty",
                      isFoundationRow ? "foundation-row" : "",
                      isPlacing ? "placing" : "",
                      justPlaced ? "just-placed" : "",
                      showWindow ? "has-window" : "",
                      showRoofCap ? "has-roof-cap" : ""
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => void handleCellClick(cell.x, cell.y)}
                    disabled={isPending || isPlacing}
                    type="button"
                    aria-label={
                      occupied
                        ? t("construction.removeAt", { row: cell.y + 1, col: cell.x + 1 })
                        : t("construction.placeAt", { row: cell.y + 1, col: cell.x + 1 })
                    }
                  >
                    {occupied ? (
                      <span className="wall-block" aria-hidden>
                        <span className="wall-block-top" />
                        <span className="wall-block-body">
                          <span className="wall-mortar-row" />
                          <span className="wall-mortar-row wall-mortar-row-offset" />
                          <span className="wall-mortar-row" />
                          <span className="wall-mortar-row wall-mortar-row-offset" />
                        </span>
                        {showWindow && <span className="wall-window" />}
                        {showRoofCap && <span className="wall-roof-cap" />}
                      </span>
                    ) : (
                      <span className="foundation-slot" aria-hidden>
                        <span className="foundation-slot-inner" />
                        <span className="foundation-slot-mark">+</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="construction-grass" aria-hidden />
        </div>

        <div className="construction-overall-progress">
          <div
            className="construction-overall-track"
            role="progressbar"
            aria-valuenow={milestoneProgress.overallPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t("construction.progressAria")}
          >
            <div
              className="construction-overall-fill"
              style={{ width: `${milestoneProgress.overallPercent}%` }}
            />
          </div>
          <span className="construction-overall-label">
            {t("construction.percentBuilt", { percent: milestoneProgress.overallPercent })}
          </span>
        </div>
      </div>
    </section>
  );
}
