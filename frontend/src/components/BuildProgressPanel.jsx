import { useLanguage } from "../context/LanguageContext.jsx";

export function BuildProgressPanel({ placedCount, totalCells = 25 }) {
  const { t } = useLanguage();
  const safeTotal = Math.max(1, totalCells);
  const percent = Math.min(100, Math.round((placedCount / safeTotal) * 100));
  const remaining = Math.max(0, safeTotal - placedCount);

  const leadText =
    placedCount === 0
      ? t("build.progressFirstBrick")
      : remaining === 0
        ? t("build.progressPlotFull")
        : remaining === 1
          ? t("build.progressSpotsLeft", { count: remaining })
          : t("build.progressSpotsLeftPlural", { count: remaining });

  return (
    <section className="card build-progress-panel" aria-labelledby="build-progress-title">
      <h2 className="section-title" id="build-progress-title">
        {t("build.progressTitle")}
      </h2>
      <p className="section-lead build-progress-lead">{leadText}</p>

      <div
        className="build-progress-track"
        role="progressbar"
        aria-valuenow={placedCount}
        aria-valuemin={0}
        aria-valuemax={safeTotal}
        aria-label={t("build.progressAria")}
      >
        <div className="build-progress-fill" style={{ width: `${percent}%` }} />
      </div>

      <div className="build-progress-stats">
        <span className="build-progress-count">
          {t("build.progressPlaced", { placed: placedCount, total: safeTotal })}
        </span>
        <span className="build-progress-percent">{percent}%</span>
      </div>
    </section>
  );
}
