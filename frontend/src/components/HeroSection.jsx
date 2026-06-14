import { useLanguage } from "../context/LanguageContext.jsx";
import { formatCompactFocusTime } from "../utils/sessionStats.js";

export function HeroSection({ stats, onRefresh, refreshing }) {
  const { t } = useLanguage();
  const focusTimeLabel = formatCompactFocusTime(stats.totalFocusSecondsCompleted);

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="hero-eyebrow">{t("brand.name")}</p>
        <h1 className="hero-title" id="hero-title">
          {t("dashboard.heroTitle")}
        </h1>
        <p className="hero-subtitle">{t("dashboard.heroLead")}</p>
      </div>
      <button
        type="button"
        className="btn btn-ghost btn-icon refresh-btn"
        onClick={onRefresh}
        disabled={refreshing}
        aria-label={t("dashboard.refreshAria")}
        title={t("common.refresh")}
      >
        ↻
      </button>
      <div className="hero-stats">
        <article className="hero-stat hero-stat-completed">
          <span className="hero-stat-icon" aria-hidden>
            ✅
          </span>
          <div>
            <p className="hero-stat-label">{t("dashboard.statCompleted")}</p>
            <p className="hero-stat-value">{stats.completedCount}</p>
          </div>
        </article>
        <article className="hero-stat hero-stat-pending">
          <span className="hero-stat-icon" aria-hidden>
            📋
          </span>
          <div>
            <p className="hero-stat-label">{t("dashboard.statPending")}</p>
            <p className="hero-stat-value">{stats.pendingCount}</p>
          </div>
        </article>
        <article className="hero-stat hero-stat-focus-time">
          <span className="hero-stat-icon" aria-hidden>
            ⏱
          </span>
          <div>
            <p className="hero-stat-label">{t("dashboard.statFocusTime")}</p>
            <p className="hero-stat-value hero-stat-value-compact">{focusTimeLabel}</p>
          </div>
        </article>
        <article className="hero-stat hero-stat-abandoned">
          <span className="hero-stat-icon" aria-hidden>
            ↩
          </span>
          <div>
            <p className="hero-stat-label">{t("dashboard.statAbandoned")}</p>
            <p className="hero-stat-value">{stats.abandonedCount}</p>
          </div>
        </article>
      </div>
    </section>
  );
}
