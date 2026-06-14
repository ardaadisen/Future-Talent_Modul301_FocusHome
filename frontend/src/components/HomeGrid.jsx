import AppCard from "./AppCard";
import { useLanguage } from "../context/LanguageContext.jsx";

const ASSET_LABEL = {
  empty: "",
  wall: "WALL",
  window: "WINDOW",
  roof: "ROOF",
};

export default function HomeGrid({ grid, onPlaceAsset, onRemoveAsset, disabled }) {
  const { t } = useLanguage();

  return (
    <AppCard title={t("grid.title")}>
      <div className="grid5">
        {grid.flatMap((row, rIdx) =>
          row.map((cell, cIdx) => {
            const filled = cell !== "empty";
            return (
              <button
                type="button"
                key={`${rIdx}-${cIdx}`}
                className={`cell ${filled ? "cell-filled" : ""}`}
                disabled={disabled}
                onClick={() => {
                  if (filled) {
                    onRemoveAsset?.(rIdx, cIdx);
                  } else {
                    onPlaceAsset?.(rIdx, cIdx);
                  }
                }}
                title={filled ? t("grid.clickRemove") : t("grid.clickPlace")}
              >
                {ASSET_LABEL[cell]}
              </button>
            );
          }),
        )}
      </div>
      <p className="muted" style={{ marginBottom: 0 }}>
        {t("grid.legend")}
      </p>
    </AppCard>
  );
}
