import { BACKEND_UNAVAILABLE } from "../services/api.js";
import { getStoredLanguage, translate } from "../i18n/translations.js";

/** @typedef {{ message: string, status?: number, code?: string }} ApiClientError */

const uiT = (key) => translate(getStoredLanguage(), key);

/** @param {unknown} error */
export function normalizeApiError(error) {
  if (error instanceof Error) {
    if (error.message === BACKEND_UNAVAILABLE) {
      return {
        message: uiT("error.connectFailed"),
        code: "API_UNREACHABLE",
      };
    }
    return { message: error.message };
  }
  return { message: uiT("error.generic") };
}
