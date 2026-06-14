
import { useLanguage } from "../context/LanguageContext.jsx";

export function UnlockHintsPanel({ hints }) {
  const { t } = useLanguage();

  return (
    <section className="card unlock-hints-panel" aria-labelledby="unlock-hints-title">
      <h2 className="section-title" id="unlock-hints-title">
        {t("feedback.comingSoon")}
      </h2>
      <p className="section-lead unlock-hints-lead">{t("feedback.unlockLead")}</p>

      <ul className="unlock-hints-list">
        {hints.map((hint) => {
          const percent = Math.min(100, Math.round((hint.current / hint.required) * 100));

          return (
            <li key={hint.id} className={`unlock-hint ${hint.unlocked ? "unlocked" : ""}`}>
              <div className="unlock-hint-header">
                <span className="unlock-hint-icon" aria-hidden>
                  {hint.icon}
                </span>
                <div>
                  <p className="unlock-hint-title">{t(hint.titleKey)}</p>
                  <p className="unlock-hint-label">{t(hint.progressKey, hint.progressParams)}</p>
                </div>
                {hint.unlocked && <span className="unlock-hint-badge">{t("common.unlocked")}</span>}
              </div>
              {!hint.unlocked && (
                <div className="unlock-hint-track">
                  <div className="unlock-hint-fill" style={{ width: `${percent}%` }} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
