export const DEFAULT_FOCUS_DURATION_SECONDS = 25 * 60;

export const createDefaultUserProfile = (userId) => ({
  userId,
  displayName: userId === "demo-user" ? "Demo User" : userId,
  createdAt: new Date().toISOString(),
});

export const createDefaultUserPreferences = (userId) => ({
  userId,
  language: "en",
  theme: "cozy",
  defaultFocusDurationSeconds: DEFAULT_FOCUS_DURATION_SECONDS,
  calendarEnabled: true,
  reducedMotion: false,
  updatedAt: new Date().toISOString(),
});
