import en from "./locales/en.js";
import tr from "./locales/tr.js";

export const translations = { en, tr };

const LANGUAGE_KEY = "focushome_language";

/** Maps legacy underscore keys to dot-notation keys for gradual migration. */
const LEGACY_KEY_MAP = {
  nav_dashboard: "nav.dashboard",
  nav_build: "nav.build",
  nav_home: "nav.home",
  nav_archive: "nav.archive",
  nav_history: "nav.history",
  nav_settings: "nav.settings",
  create_focus_session: "manual.title",
  parse_plan: "ai.parsePlan",
  focus_sessions: "dashboard.focusSessions",
  active_focus_session: "timer.activeSession",
  start: "common.start",
  pause: "common.pause",
  reset: "common.reset",
  complete: "common.complete",
  abandon: "common.abandon",
  delete: "common.delete",
  language: "common.language",
  theme: "common.theme",
  sign_out: "auth.signOut",
  sign_in: "auth.signIn",
  create_account: "auth.createAccount",
  plan_focus: "dashboard.planFocus",
  plan_focus_lead: "dashboard.planFocusLead",
  ai_plan_assistant: "ai.title",
  your_plan: "ai.yourPlan",
  suggested_session: "ai.suggestedSession",
  detected_duration: "ai.detectedDuration",
  scheduled: "common.scheduled",
  confirm_focus_session: "ai.confirmSession",
  select_session: "dashboard.selectSession",
  empty_sessions: "dashboard.emptySessions",
  parse_badge_ai: "ai.badge.ai",
  parse_badge_smart: "ai.badge.smart",
  parse_badge_mock: "ai.badge.mock",
  reading_plan: "ai.readingPlan",
  language_theme: "settings.languageTheme",
  language_theme_lead: "settings.languageThemeLead",
  account: "common.account",
  save_settings: "settings.saveSettings",
  saving: "common.saving",
  account_created: "auth.accountCreated",
  account_created_confirm: "auth.accountCreatedConfirm",
  no_account: "auth.noAccount",
  have_account: "auth.haveAccount",
  english: "settings.english",
  turkish: "settings.turkish",
  ready: "common.ready",
  in_progress: "common.inProgress",
  focus: "common.focus",
  timer_finished: "timer.finished",
  delete_account: "settings.deleteAccount",
  delete_account_title: "settings.deleteAccountTitle",
  delete_account_warning: "settings.deleteAccountWarning",
  delete_account_continue: "settings.deleteAccountContinue",
  delete_account_confirm: "settings.deleteAccountConfirm",
  delete_account_cancel: "settings.deleteAccountCancel",
  delete_account_type_delete: "settings.deleteAccountTypeDelete",
  delete_account_deleting: "settings.deleteAccountDeleting",
};

/** Normalize any language input to "en" or "tr". */
export function normalizeLanguage(lang) {
  if (lang == null || lang === "") return "en";
  const value = String(lang).trim().toLowerCase();
  if (value === "tr" || value === "turkish" || value === "türkçe" || value === "turkce") {
    return "tr";
  }
  return "en";
}

function resolveKey(key) {
  if (key == null || key === "") return "";
  return LEGACY_KEY_MAP[key] ?? key;
}

function interpolate(template, params) {
  if (template == null) return "";
  const text = String(template);
  if (!params || typeof params !== "object") return text;
  return text.replace(/\{(\w+)\}/g, (match, name) => {
    const value = params[name];
    return value !== undefined && value !== null ? String(value) : match;
  });
}

export function getStoredLanguage() {
  try {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    return normalizeLanguage(stored);
  } catch {
    return "en";
  }
}

/**
 * Safe translation lookup — never throws.
 * TR missing → English fallback → key string.
 */
export function translate(lang, key, params) {
  try {
    const resolvedKey = resolveKey(key);
    if (!resolvedKey) return "";

    const safeLang = normalizeLanguage(lang);
    const table = translations[safeLang] || translations.en;
    let value = table?.[resolvedKey];

    if (value === undefined && safeLang === "tr") {
      if (import.meta.env?.DEV) {
        console.warn(`[i18n] Missing Turkish translation for key: ${resolvedKey}`);
      }
      value = translations.en?.[resolvedKey];
    }

    if (value === undefined) {
      if (import.meta.env?.DEV && resolvedKey) {
        console.warn(`[i18n] Missing translation for key: ${resolvedKey}`);
      }
      value = translations.en?.[resolvedKey] ?? resolvedKey;
    }

    return interpolate(value, params);
  } catch (err) {
    if (import.meta.env?.DEV) {
      console.warn("[i18n] translate() failed:", key, err);
    }
    return key != null ? String(key) : "";
  }
}
