import { useLanguage } from "../../context/LanguageContext.jsx";

const NAV_ITEMS = [
  { id: "dashboard", key: "nav.dashboard", icon: "🏠" },
  { id: "build", key: "nav.build", icon: "🧱" },
  { id: "myhome", key: "nav.home", icon: "🛋️" },
  { id: "archive", key: "nav.archive", icon: "📦" },
  { id: "history", key: "nav.history", icon: "📜" },
  { id: "settings", key: "nav.settings", icon: "⚙️" },
];

export default function BottomNav({ activePage, onNavigate }) {
  const { t } = useLanguage();

  return (
    <nav className="bottom-nav" aria-label={t("nav.mainAria")}>
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`bottom-nav-item ${activePage === item.id ? "bottom-nav-item-active" : ""}`}
          onClick={() => onNavigate(item.id)}
        >
          <span className="bottom-nav-icon" aria-hidden>{item.icon}</span>
          <span className="bottom-nav-label">{t(item.key)}</span>
        </button>
      ))}
    </nav>
  );
}
