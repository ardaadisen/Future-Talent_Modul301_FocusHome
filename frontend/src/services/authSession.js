/** Central access-token holder and auth headers for backend API calls. */

import { getStoredLanguage, translate } from "../i18n/translations.js";
import { isCloudConfigured } from "../utils/syncMode.js";
import { supabaseClient } from "./supabaseClient.js";

let accessToken = null;

export function setAccessToken(token) {
  accessToken = token || null;
}

export function getAccessToken() {
  return accessToken;
}

export function hasCloudAccessToken() {
  return Boolean(accessToken);
}

function signInAgainMessage() {
  return translate(getStoredLanguage(), "auth.sessionExpired");
}

/**
 * Always read the active Supabase session before protected backend calls.
 */
export async function requireAccessToken() {
  if (!isCloudConfigured() || !supabaseClient) {
    return null;
  }

  try {
    const { data, error } = await supabaseClient.auth.getSession();
    if (!error && data.session?.access_token) {
      setAccessToken(data.session.access_token);
      return data.session.access_token;
    }
  } catch {
    /* fall through to refresh */
  }

  return refreshAccessToken();
}

/** @deprecated use requireAccessToken */
export async function resolveAccessToken() {
  if (accessToken) return accessToken;
  return requireAccessToken();
}

/** Refresh Supabase session and update the in-memory token. */
export async function refreshAccessToken() {
  if (!supabaseClient) return null;
  try {
    const { data, error } = await supabaseClient.auth.refreshSession();
    if (error || !data.session?.access_token) {
      setAccessToken(null);
      return null;
    }
    setAccessToken(data.session.access_token);
    return data.session.access_token;
  } catch {
    setAccessToken(null);
    return null;
  }
}

export function getAuthHeaders(extra = {}) {
  const headers = { ...extra };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
}

export async function getAuthHeadersAsync(extra = {}) {
  const token = await requireAccessToken();
  const headers = { ...extra };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

const PROTECTED_API_PREFIXES = [
  "/api/tasks",
  "/api/inventory",
  "/api/grid",
  "/api/user",
  "/api/account",
];

export function pathRequiresAuth(path) {
  return PROTECTED_API_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export function logApiAuthDebug(path, headers, syncModeLabel) {
  if (!import.meta.env.DEV) return;
  console.info(
    "[api]",
    path,
    "auth header present:",
    Boolean(headers.Authorization),
    "sync mode:",
    syncModeLabel,
  );
}

export { signInAgainMessage };
