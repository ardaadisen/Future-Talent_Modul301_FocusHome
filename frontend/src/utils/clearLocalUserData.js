/** Remove user-scoped cached game data. Keeps UI prefs (language) intact. */

import { STORAGE_KEYS } from "./localStore.js";

const AUTH_KEYS = [
  "focushome_auth_token",
  "focushome_user_id",
  "focushome_user_email",
];

/** Clear progress/home data but keep language preference. */
export function clearUserProgressData() {
  Object.values(STORAGE_KEYS).forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  });
}

/** Full wipe including auth keys (account deletion). Language is cleared too. */
export function clearAllLocalUserData() {
  clearUserProgressData();
  AUTH_KEYS.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  });
  try {
    localStorage.removeItem("focushome_language");
  } catch {
    /* ignore */
  }
}
