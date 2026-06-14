/**
 * Re-export language hook as useTranslation for components.
 * Usage: const { t, language, setLanguage } = useTranslation();
 *        t("dashboard.heroTitle")
 *        t("home.blocksReady", { count: 3 })
 */
export { useLanguage as useTranslation, parseSourceBadgeClass, parseSourceBadgeLabel } from "../context/LanguageContext.jsx";
export { translate, getStoredLanguage, normalizeLanguage } from "./translations.js";
export { difficultyLabel, statusLabel, sourceLabel, tierLabel, tierDescription, tierMood, slotLabel, decorationLabel } from "./labels.js";
