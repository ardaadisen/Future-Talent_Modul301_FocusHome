import { useLanguage } from "../context/LanguageContext.jsx";

export function PlacementToolbar({
  onRotate,
  onDelete,
  onBringFront,
  onSendBack,
  disabled = false
}) {
  const { t } = useLanguage();

  return (
    <div
      className="placement-toolbar"
      role="toolbar"
      aria-label={t("home.placementControls")}
      onClick={(event) => event.stopPropagation()}
    >
      <button type="button" className="placement-toolbar-btn" disabled={disabled} onClick={onRotate} title={t("home.rotate15")}>
        ↻
      </button>
      <button type="button" className="placement-toolbar-btn" disabled={disabled} onClick={onBringFront} title={t("home.bringFront")}>
        ▲
      </button>
      <button type="button" className="placement-toolbar-btn" disabled={disabled} onClick={onSendBack} title={t("home.sendBack")}>
        ▼
      </button>
      <button
        type="button"
        className="placement-toolbar-btn placement-toolbar-btn--danger"
        disabled={disabled}
        onClick={onDelete}
        title={t("common.remove")}
      >
        ✕
      </button>
    </div>
  );
}
