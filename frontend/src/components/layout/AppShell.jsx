import BottomNav from "./BottomNav";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function AppShell({ activePage, onNavigate, displayName, inventory, children }) {
  const { t } = useLanguage();

  return (
    <div className="app-frame">
      <header className="app-header">
        <div>
          <p className="app-header-kicker">{t("brand.name")}</p>
          <h1 className="app-header-title">{displayName}</h1>
        </div>
        <div className="app-header-stats">
          <span className="pill-stat">{t("layout.levelShort", { level: inventory.level })}</span>
          <span className="pill-stat">{inventory.xp} {t("common.xp")}</span>
          <span className="pill-stat">🧱 {inventory.bricks}</span>
        </div>
      </header>

      <main className="app-content">{children}</main>

      <BottomNav activePage={activePage} onNavigate={onNavigate} />
    </div>
  );
}
