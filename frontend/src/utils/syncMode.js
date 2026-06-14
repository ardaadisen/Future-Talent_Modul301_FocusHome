/** Data sync mode — local-first; optional account sync when configured in env. */

import { withTimeout } from "./withTimeout.js";
import { getStoredLanguage, translate } from "../i18n/translations.js";

export const AUTH_REQUEST_TIMEOUT_MS = 15_000;

export const SYNC_MODE = {
  LOCAL: "local",
  CLOUD: "cloud",
  SUPABASE_NOT_CONFIGURED: "supabase_not_configured",
};

export function getSupabaseEnv() {
  return {
    url: (import.meta.env.VITE_SUPABASE_URL || "").trim(),
    anonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim(),
  };
}

export function isCloudConfigured() {
  const { url, anonKey } = getSupabaseEnv();
  return Boolean(url && anonKey);
}

export function isMockAuthEnabled() {
  return import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCK_AUTH === "true";
}

export function getDataSyncMode(isAuthenticated, accessToken) {
  const authenticated = typeof isAuthenticated === "object" && isAuthenticated !== null
    ? Boolean(isAuthenticated.authenticated)
    : Boolean(isAuthenticated);
  const token = typeof isAuthenticated === "object" && isAuthenticated !== null
    ? isAuthenticated.accessToken
    : accessToken;
  const hasToken = Boolean(token);

  if (authenticated && hasToken && isCloudConfigured()) {
    return SYNC_MODE.CLOUD;
  }
  if (!isCloudConfigured()) {
    return SYNC_MODE.SUPABASE_NOT_CONFIGURED;
  }
  return SYNC_MODE.LOCAL;
}

export function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
}

export function getCloudNotConfiguredMessage() {
  return translate(getStoredLanguage(), "sync.syncAfterSignIn");
}

export async function validateBackendForCloud() {
  if (!isCloudConfigured()) {
      return { ok: false, message: translate(getStoredLanguage(), "sync.deviceOnly") };
  }
  try {
    const response = await withTimeout(
      fetch(`${getApiBaseUrl()}/api/main`),
      8_000,
      translate(getStoredLanguage(), "error.connectFailed"),
    );
    if (!response.ok) {
      return { ok: false, message: translate(getStoredLanguage(), "feedback.loadError") };
    }
    return { ok: true, data: await response.json() };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : translate(getStoredLanguage(), "feedback.loadError"),
    };
  }
}

/** @deprecated use isCloudConfigured */
export function isSupabaseAuthMode() {
  return isCloudConfigured();
}

/** @deprecated use isMockAuthEnabled */
export function isMockAuthMode() {
  return isMockAuthEnabled();
}

export function getAuthMode() {
  return isCloudConfigured() ? "supabase" : "local";
}

export function validateSupabaseEnv() {
  if (isCloudConfigured()) return { ok: true };
  return { ok: false, message: getCloudNotConfiguredMessage() };
}

export function getSupabaseConfigError() {
  return isCloudConfigured() ? null : getCloudNotConfiguredMessage();
}

export function assertSupabaseConfigured() {
  if (!isCloudConfigured()) {
    throw new Error(getCloudNotConfiguredMessage());
  }
}

export async function validateBackendAuthConfig() {
  return validateBackendForCloud();
}
