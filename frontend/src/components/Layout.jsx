
import { AppNav } from "./AppNav.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

export function Layout({ children, activeView, onNavigate }) {
  const { t } = useLanguage();

  return (
    <div className="app-layout">
      <header className="top-bar">
        <div className="top-bar-inner">
          <button type="button" className="brand" onClick={() => onNavigate("dashboard")}>
            <span className="brand-mark" aria-hidden>
              🏠
            </span>
            <span className="brand-name">{t("brand.name")}</span>
          </button>
          <AppNav activeView={activeView} onNavigate={onNavigate} />
        </div>
      </header>
      <main className="app-main" id="main-content">
        {children}
      </main>
    </div>
  );
}
