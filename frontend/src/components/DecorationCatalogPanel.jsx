import { useState } from "react";
import { DECORATION_CATALOG, DECORATION_SLOT_KEYS } from "../shared/index.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { decorationLabel, slotLabel } from "../i18n/labels.js";
import { DecorationSprite } from "./DecorationSprite.jsx";

export function DecorationCatalogPanel({
  activeHome,
  selectedCategory,
  isPending = false,
  onSelectCategory,
  onPlaceDecoration
}) {
  const { t } = useLanguage();
  const [pendingPlaceId, setPendingPlaceId] = useState(null);
  const unlockedIds = activeHome?.unlockedDecorations ?? [];

  const categoryOptions = DECORATION_CATALOG.filter(
    (item) => item.slot === selectedCategory && unlockedIds.includes(item.id)
  );

  const lockedCount = DECORATION_CATALOG.filter(
    (item) => item.slot === selectedCategory && !unlockedIds.includes(item.id)
  ).length;

  const placedCount = activeHome?.decorationPlacements?.length ?? 0;

  const handlePlace = (decorationId) => {
    setPendingPlaceId(decorationId);
    void onPlaceDecoration(decorationId);
    window.setTimeout(() => setPendingPlaceId(null), 600);
  };

  const handleDragStart = (event, decorationId) => {
    event.dataTransfer.setData("application/focushome-decoration", decorationId);
    event.dataTransfer.effectAllowed = "copy";
  };

  return (
    <aside className="decoration-catalog card" aria-labelledby="decoration-catalog-title">
      <h2 className="decoration-catalog-title" id="decoration-catalog-title">
        {t("home.interiorEditor")}
      </h2>
      <p className="decoration-catalog-lead">
        {t("home.interiorLead")} {t("home.itemsPlaced", { count: placedCount })}
      </p>

      <div className="decoration-slot-tabs" role="tablist" aria-label={t("home.decorCategories")}>
        {DECORATION_SLOT_KEYS.map((slot) => {
          const isActive = slot === selectedCategory;
          const countInRoom = (activeHome?.decorationPlacements ?? []).filter((p) => {
            const item = DECORATION_CATALOG.find((d) => d.id === p.decorationId);
            return item?.slot === slot;
          }).length;

          return (
            <button
              key={slot}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`decoration-slot-tab ${isActive ? "decoration-slot-tab--active" : ""}`}
              onClick={() => onSelectCategory(slot)}
            >
              {slotLabel(t, slot)}
              {countInRoom > 0 && (
                <span className="decoration-slot-tab-dot" aria-hidden />
              )}
            </button>
          );
        })}
      </div>

      <div className="decoration-options" role="tabpanel">
        <p className="decoration-options-heading">
          {t("home.slotItems", { slot: slotLabel(t, selectedCategory) })}
          {lockedCount > 0 && (
            <span className="decoration-options-locked">{t("home.lockedCount", { count: lockedCount })}</span>
          )}
        </p>

        <div className="decoration-option-grid">
          {categoryOptions.map((item) => (
            <div key={item.id} className="decoration-option-card">
              <button
                type="button"
                className={`decoration-option decoration-option--draggable ${pendingPlaceId === item.id ? "decoration-option--selected-pulse" : ""}`}
                disabled={isPending}
                draggable={!isPending}
                onDragStart={(event) => handleDragStart(event, item.id)}
                title={t("home.dragIntoRoom", { label: decorationLabel(t, item) })}
              >
                <DecorationSprite decoration={item} sizeClass={item.sizeClass || "md"} className="decoration-option-sprite" />
                <span className="decoration-option-label">{decorationLabel(t, item)}</span>
              </button>
              <button
                type="button"
                className="btn btn-ghost decoration-place-btn"
                disabled={isPending}
                onClick={() => handlePlace(item.id)}
              >
                {t("common.place")}
              </button>
            </div>
          ))}
        </div>

        {categoryOptions.length === 0 && (
          <p className="decoration-empty-category">{t("home.noUnlockedItems")}</p>
        )}
      </div>

      <section className="decoration-unlocked-list" aria-label={t("home.allUnlockedDecorations")}>
        <h3 className="decoration-unlocked-title">{t("home.quickPlace", { count: unlockedIds.length })}</h3>
        <ul className="decoration-unlocked-items">
          {DECORATION_CATALOG.filter((item) => unlockedIds.includes(item.id)).map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="decoration-unlocked-chip"
                disabled={isPending}
                draggable={!isPending}
                onDragStart={(event) => handleDragStart(event, item.id)}
                onClick={() => {
                  onSelectCategory(item.slot);
                  handlePlace(item.id);
                }}
              >
                <DecorationSprite decoration={item} sizeClass="sm" className="decoration-chip-sprite" />
                <span>{decorationLabel(t, item)}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
