import { NAV_ITEMS } from "../navigation.js";
import { useLanguage } from "../context/LanguageContext.jsx";

const NAV_KEYS = {
  dashboard: "nav.dashboard",
  build: "nav.build",
  home: "nav.home",
  archive: "nav.archive",
  history: "nav.history",
  settings: "nav.settings",
};

export function AppNav({ activeView, onNavigate }) {
  const { t } = useLanguage();

  return (
    <nav className="app-nav" aria-label={t("nav.mainAria")}>
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`app-nav-link ${activeView === item.id ? "active" : ""}`}
          onClick={() => onNavigate(item.id)}
          aria-current={activeView === item.id ? "page" : undefined}
        >
          <span className="app-nav-icon" aria-hidden>
            {item.icon}
          </span>
          <span className="app-nav-label">{t(NAV_KEYS[item.id])}</span>
        </button>
      ))}
    </nav>
  );
}
