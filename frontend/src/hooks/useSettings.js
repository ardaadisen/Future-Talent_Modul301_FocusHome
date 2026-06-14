import { useCallback, useEffect, useState } from "react";
import { readJson, STORAGE_KEYS, writeJson } from "../utils/localStore";

export const DEFAULT_SETTINGS = {
  displayName: "Focus Builder",
  theme: "cozy",
  language: "en",
  calendarEnabled: true,
  defaultDuration: 30,
  reducedMotion: false,
};

/** TODO: persist settings via backend user profile endpoint. */
export function useSettings() {
  const [settings, setSettingsState] = useState(() =>
    readJson(STORAGE_KEYS.settings, DEFAULT_SETTINGS),
  );

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.classList.toggle("reduce-motion", settings.reducedMotion);
  }, [settings.theme, settings.reducedMotion]);

  const setSettings = useCallback((patch) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...patch };
      writeJson(STORAGE_KEYS.settings, next);
      return next;
    });
  }, []);

  return { settings, setSettings };
}
