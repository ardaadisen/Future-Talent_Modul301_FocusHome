import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

export function LocalModeBanner() {
  const { isCloudMode, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  if (isCloudMode && isAuthenticated) {
    return null;
  }

  return (
    <div className="sync-banner sync-banner--local" role="status">
      {t("sync.localModeBanner")}
    </div>
  );
}
