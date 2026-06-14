
import { useLanguage } from "../context/LanguageContext.jsx";

export function HomeCtaCard({ onGoToHome, bricksAvailable = 0, placedCount = 0 }) {
  const { t } = useLanguage();
  const hasProgress = bricksAvailable > 0 || placedCount > 0;

  return (
    <section className="card home-cta-card" aria-labelledby="home-cta-title">
      <div className="home-cta-copy">
        <p className="home-cta-eyebrow">{t("home.title")}</p>
        <h2 className="home-cta-title" id="home-cta-title">
          {t("homeCta.title")}
        </h2>
        {hasProgress ? (
          <p className="home-cta-meta">
            {t("homeCta.metaReady", { bricks: bricksAvailable, placed: placedCount })}
          </p>
        ) : (
          <p className="home-cta-meta">{t("homeCta.metaWaiting")}</p>
        )}
      </div>
      <button type="button" className="btn btn-primary home-cta-btn" onClick={onGoToHome}>
        {t("homeCta.visit")}
        <span aria-hidden> →</span>
      </button>
    </section>
  );
}
