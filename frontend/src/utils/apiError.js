import { BACKEND_UNAVAILABLE } from "../services/api.js";
import { getStoredLanguage, translate } from "../i18n/translations.js";

/** @typedef {{ message: string, status?: number, code?: string }} ApiClientError */

const uiT = (key) => translate(getStoredLanguage(), key);

function messageText(error) {
  if (error instanceof Error) return error.message;
  return String(error || "");
}

function errorStatus(error) {
  if (error && typeof error === "object" && "status" in error) {
    const status = Number(error.status);
    return Number.isFinite(status) ? status : undefined;
  }
  return undefined;
}

/** @param {unknown} error */
export function isAuthApiError(error) {
  const status = errorStatus(error);
  if (status === 401 || status === 403) return true;
  const msg = messageText(error).toLowerCase();
  return (
    msg.includes("not authenticated")
    || msg.includes("unauthorized")
    || msg === "401"
    || msg.includes("request failed (401)")
  );
}

function isServerApiError(error) {
  const status = errorStatus(error);
  return status !== undefined && status >= 500;
}

/** @param {unknown} error @param {{ cloudAttempt?: boolean, syncAttempt?: boolean }} [options] */
export function normalizeApiError(error, options = {}) {
  const raw = messageText(error);
  const msg = raw.toLowerCase();
  const status = errorStatus(error);

  if (raw === BACKEND_UNAVAILABLE || error instanceof Error && error.message === BACKEND_UNAVAILABLE) {
    if (options.syncAttempt) {
      return { message: uiT("sync.progressFailed"), code: "SYNC_FAILED" };
    }
    return {
      message: uiT("error.connectFailed"),
      code: "API_UNREACHABLE",
    };
  }

  if (isAuthApiError(error)) {
    const expiredHint = msg.includes("expired") || msg.includes("jwt") || msg.includes("sign in again");
    return {
      message: expiredHint ? uiT("auth.sessionExpired") : uiT("auth.sessionExpired"),
      code: "AUTH_REQUIRED",
      status: status || 401,
    };
  }

  if (isServerApiError(error)) {
    if (options.syncAttempt || options.cloudAttempt) {
      return {
        message: uiT("sync.progressFailed"),
        code: "SYNC_FAILED",
        status,
      };
    }
  }

  if (error instanceof Error) {
    if (raw.includes(BACKEND_UNAVAILABLE)) {
      return { message: uiT("sync.progressFailed"), code: "SYNC_FAILED" };
    }
    return { message: error.message };
  }
  return { message: uiT("error.generic") };
}
