
export const applyUserTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
};

export const applyReducedMotion = (reducedMotion) => {
  document.documentElement.classList.toggle("app-reduce-motion", reducedMotion);
};

export const applyUserPreferences = (preferences) => {
  applyUserTheme(preferences.theme);
  applyReducedMotion(preferences.reducedMotion);
};

export const splitDurationSeconds = (totalSeconds) => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return { hours, minutes, seconds };
};

export const combineDurationSeconds = (hours, minutes, seconds) =>
  hours * 3600 + minutes * 60 + seconds;
