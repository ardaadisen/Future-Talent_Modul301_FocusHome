import { DECORATION_SLOT_KEYS, getDecorationById } from "../shared/index.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { decorationLabel, slotLabel, tierLabel } from "../i18n/labels.js";
import { formatArchiveDate, formatDateTime } from "../utils/format.js";
import { CompletedHomeMiniPreview } from "./CompletedHomeMiniPreview.jsx";

export function CompletedHomeSummaryModal({ home, onClose }) {
  const { t } = useLanguage();

  if (!home) return null;

  const placedCount = DECORATION_SLOT_KEYS.filter((slot) => home.decorations[slot] !== null).length;

  return (
    <div
      className="archive-summary-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="archive-summary-title"
      onClick={onClose}
    >
      <div className="archive-summary-card" onClick={(event) => event.stopPropagation()}>
        <header className="archive-summary-header">
          <div>
            <p className="archive-summary-eyebrow">{t("archive.completedHomeTitle")}</p>
            <h2 className="archive-summary-title" id="archive-summary-title">
              {tierLabel(t, home.tier)}
            </h2>
            <p className="archive-summary-meta">{t("archive.archivedReadOnly")}</p>
          </div>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label={t("archive.closeSummary")}>
            ✕
          </button>
        </header>

        <CompletedHomeMiniPreview home={home} />

        <dl className="archive-summary-stats">
          <div>
            <dt>{t("archive.completionDate")}</dt>
            <dd>{formatArchiveDate(home.completedAt)}</dd>
          </div>
          <div>
            <dt>{t("archive.finalStackCount")}</dt>
            <dd>{home.finalStackCount}</dd>
          </div>
          <div>
            <dt>{t("archive.decorationsPlaced")}</dt>
            <dd>
              {placedCount} / {DECORATION_SLOT_KEYS.length}
            </dd>
          </div>
          <div>
            <dt>{t("archive.archivedAt")}</dt>
            <dd>{formatDateTime(home.completedAt)}</dd>
          </div>
        </dl>

        <section className="archive-summary-decorations" aria-labelledby="archive-decor-title">
          <h3 className="archive-summary-decor-title" id="archive-decor-title">
            {t("archive.decorationChoices")}
          </h3>
          <ul className="archive-summary-decor-list">
            {DECORATION_SLOT_KEYS.map((slot) => {
              const decorationId = home.decorations[slot];
              const decoration = decorationId ? getDecorationById(decorationId) : null;

              return (
                <li key={slot} className="archive-summary-decor-item">
                  <span className="archive-summary-decor-slot">{slotLabel(t, slot)}</span>
                  {decoration ? (
                    <span className="archive-summary-decor-choice">
                      <span aria-hidden>{decoration.emoji}</span> {decorationLabel(t, decoration)}
                    </span>
                  ) : (
                    <span className="archive-summary-decor-empty">{t("common.empty")}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <p className="archive-summary-note">
          {t("archive.savedMessage", { tier: tierLabel(t, home.tier) })}
        </p>

        <button type="button" className="btn btn-primary btn-block" onClick={onClose}>
          {t("common.close")}
        </button>
      </div>
    </div>
  );
}
