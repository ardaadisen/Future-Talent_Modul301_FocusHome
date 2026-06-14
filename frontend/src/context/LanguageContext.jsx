import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { getStoredLanguage, normalizeLanguage, translate } from "../i18n/translations.js";

const LANGUAGE_KEY = "focushome_language";

const LanguageContext = createContext(null);

export function LanguageProvider({ children, initialLanguage = "en" }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const stored = localStorage.getItem(LANGUAGE_KEY);
      if (stored) return normalizeLanguage(stored);
    } catch {
      /* ignore */
    }
    return normalizeLanguage(initialLanguage);
  });

  useEffect(() => {
    document.documentElement.lang = language === "tr" ? "tr" : "en";
  }, [language]);

  const setLanguage = useCallback((next) => {
    const value = normalizeLanguage(next);
    setLanguageState(value);
    try {
      localStorage.setItem(LANGUAGE_KEY, value);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key, params) => translate(language, key, params),
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}

export function parseSourceBadgeLabel(source, t) {
  if (source === "gemini" || source === "openai") return t("ai.badge.ai");
  if (source === "mock") return t("ai.badge.mock");
  return t("ai.badge.smart");
}

export function parseSourceBadgeClass(source) {
  if (source === "gemini" || source === "openai") return "badge-source-ai";
  if (source === "mock") return "badge-source-mock";
  return "badge-source-heuristic";
}
