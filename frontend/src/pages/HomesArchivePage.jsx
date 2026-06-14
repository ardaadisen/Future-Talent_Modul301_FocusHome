import { useMemo, useState } from "react";
import { CompletedHomeCard } from "../components/CompletedHomeCard.jsx";
import { CompletedHomeSummaryModal } from "../components/CompletedHomeSummaryModal.jsx";
import { FeedbackRegion } from "../components/FeedbackRegion.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { tierLabel } from "../i18n/labels.js";

export function HomesArchivePage({
  activeHome,
  completedHomes,
  error,
  offline,
  reward,
  loading,
  mutating,
  loadAll,
  onNavigate
}) {
  const { t } = useLanguage();
  const [selectedHome, setSelectedHome] = useState(null);

  const sortedHomes = useMemo(
    () => [...completedHomes].sort((a, b) => b.completedAt.localeCompare(a.completedAt)),
    [completedHomes]
  );

  const totalStacks = sortedHomes.reduce((sum, home) => sum + home.finalStackCount, 0);

  return (
    <div className="page page-archive">
      <header className="page-header archive-page-header">
        <div>
          <p className="page-header-eyebrow">{t("archive.title")}</p>
          <h1 className="page-header-title">{t("archive.lead")}</h1>
          <p className="page-header-lead">{t("archive.description")}</p>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-icon refresh-btn-inline"
          onClick={() => void loadAll(true)}
          disabled={loading || mutating}
          aria-label={t("archive.refreshAria")}
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
        activeView="archive"
        onNavigate={onNavigate}
      />

      {sortedHomes.length > 0 && (
        <div className="archive-stats-row" aria-label={t("archive.statsAria")}>
          <article className="archive-stat-pill">
            <span className="archive-stat-value">{sortedHomes.length}</span>
            <span className="archive-stat-label">
              {sortedHomes.length === 1 ? t("archive.completedHome") : t("archive.completedHomes")}
            </span>
          </article>
          <article className="archive-stat-pill">
            <span className="archive-stat-value">{totalStacks}</span>
            <span className="archive-stat-label">{t("archive.totalStacks")}</span>
          </article>
          {activeHome && (
            <article className="archive-stat-pill archive-stat-pill--active">
              <span className="archive-stat-value">{tierLabel(t, activeHome.currentTier)}</span>
              <span className="archive-stat-label">{t("archive.currentHome")}</span>
            </article>
          )}
        </div>
      )}

      {loading && sortedHomes.length === 0 ? (
        <p className="empty-state">{t("archive.loading")}</p>
      ) : sortedHomes.length === 0 ? (
        <div className="archive-empty card">
          <span className="archive-empty-icon" aria-hidden>
            🏡
          </span>
          <h2 className="archive-empty-title">{t("archive.empty")}</h2>
          <p className="archive-empty-lead">{t("archive.emptyLead")}</p>
          <div className="archive-empty-actions">
            <button type="button" className="btn btn-primary" onClick={() => onNavigate("build")}>
              {t("archive.openBuildMode")}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => onNavigate("home")}>
              {t("home.title")}
            </button>
          </div>
        </div>
      ) : (
        <div className="archive-grid">
          {sortedHomes.map((home) => (
            <CompletedHomeCard key={home.id} home={home} onView={setSelectedHome} />
          ))}
        </div>
      )}

      <CompletedHomeSummaryModal home={selectedHome} onClose={() => setSelectedHome(null)} />
    </div>
  );
}
