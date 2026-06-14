import { useLanguage } from "../context/LanguageContext.jsx";
import { decorationLabel, tierLabel } from "../i18n/labels.js";
import { formatArchiveDate } from "../utils/format.js";
import { CompletedHomeMiniPreview, getDecorationPreviewItems } from "./CompletedHomeMiniPreview.jsx";

export function CompletedHomeCard({ home, onView }) {
  const { t } = useLanguage();
  const previewItems = getDecorationPreviewItems(home);
  const decorationCount = previewItems.length;

  return (
    <article className={`archive-card archive-card--${home.tier.toLowerCase()}`}>
      <CompletedHomeMiniPreview home={home} />

      <div className="archive-card-body">
        <div className="archive-card-header">
          <h2 className="archive-card-title">{tierLabel(t, home.tier)}</h2>
          <span className="archive-card-badge">{t("common.completed")}</span>
        </div>

        <dl className="archive-card-stats">
          <div>
            <dt>{t("archive.finished")}</dt>
            <dd>{formatArchiveDate(home.completedAt)}</dd>
          </div>
          <div>
            <dt>{t("common.stacks")}</dt>
            <dd>{home.finalStackCount}</dd>
          </div>
        </dl>

        {decorationCount > 0 ? (
          <ul className="archive-card-decor-preview" aria-label={t("archive.decorationPreview")}>
            {previewItems.slice(0, 4).map(({ placement, item }) => (
              <li key={placement.placementId} title={decorationLabel(t, item)}>
                <span aria-hidden>{item.emoji}</span>
              </li>
            ))}
            {decorationCount > 4 && (
              <li className="archive-card-decor-more">+{decorationCount - 4}</li>
            )}
          </ul>
        ) : (
          <p className="archive-card-no-decor">{t("archive.noDecorations")}</p>
        )}

        <button type="button" className="btn btn-ghost btn-block archive-card-view-btn" onClick={() => onView(home)}>
          {t("archive.viewSummary")}
        </button>
      </div>
    </article>
  );
}
