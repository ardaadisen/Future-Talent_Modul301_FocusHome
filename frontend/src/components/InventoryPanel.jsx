
import { useLanguage } from "../context/LanguageContext.jsx";
import { XpLevelProgress } from "./XpLevelProgress.jsx";

export function InventoryPanel({ inventory }) {
  const { t } = useLanguage();
  const totalXp = inventory?.totalXp ?? 0;
  const level = inventory?.level ?? 0;
  const bricks = inventory?.resources.bricks ?? 0;
  const glass = inventory?.resources.glass ?? 0;
  const roofTiles = inventory?.resources.roofTiles ?? 0;

  return (
    <section className="card inventory-panel">
      <h2 className="section-title">{t("build.materials")}</h2>
      <p className="section-lead">{t("build.materialsLead")}</p>

      <XpLevelProgress totalXp={totalXp} level={level} />

      <div className="materials-grid">
        <article className="material-tile">
          <span className="material-icon" aria-hidden>
            🧱
          </span>
          <p className="material-label">{t("common.bricks")}</p>
          <p className="material-value">{bricks}</p>
        </article>
        <article className="material-tile">
          <span className="material-icon" aria-hidden>
            🪟
          </span>
          <p className="material-label">{t("common.glass")}</p>
          <p className="material-value">{glass}</p>
        </article>
        <article className="material-tile">
          <span className="material-icon" aria-hidden>
            🏠
          </span>
          <p className="material-label">{t("common.roofTiles")}</p>
          <p className="material-value">{roofTiles}</p>
        </article>
      </div>

      {bricks === 0 && glass === 0 && roofTiles === 0 && (
        <p className="empty-state inventory-empty">{t("build.earnFirstBricks")}</p>
      )}
    </section>
  );
}
