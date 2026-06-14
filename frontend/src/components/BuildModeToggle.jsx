
import { useLanguage } from "../context/LanguageContext.jsx";

const MODES = [
  { id: "grid", labelKey: "build.gridMode", hintKey: "build.gridHint" },
  { id: "stack", labelKey: "build.stackModeLabel", hintKey: "build.stackModeHint" },
];

export function BuildModeToggle({ mode, onChange, disabled = false }) {
  const { t } = useLanguage();

  return (
    <div className="build-mode-toggle" role="group" aria-label={t("build.interactionMode")}>
      {MODES.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`build-mode-option ${mode === item.id ? "active" : ""}`}
          onClick={() => onChange(item.id)}
          disabled={disabled}
          aria-pressed={mode === item.id}
          title={t(item.hintKey)}
        >
          {t(item.labelKey)}
        </button>
      ))}
    </div>
  );
}
