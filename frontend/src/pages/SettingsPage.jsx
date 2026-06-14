import { useEffect, useState } from "react";

import { FeedbackRegion } from "../components/FeedbackRegion.jsx";
import { DeleteAccountModal } from "../components/DeleteAccountModal.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { AuthPage } from "./AuthPage.jsx";
import { getUserId } from "../utils/format.js";
import { formatDuration } from "../utils/format.js";
import { applyUserTheme } from "../utils/userPreferences.js";

import { combineDurationSeconds, splitDurationSeconds } from "../utils/userPreferences.js";

export function SettingsPage({
  userProfile,
  userPreferences,
  error,
  offline,
  reward,
  loading,
  mutating,
  loadAll,
  saveUserSettings,
  onNavigate,
  onAccountDeleted,
  cloudSyncConfigured = true,
}) {
  const {
    user,
    isAuthenticated,
    isCloudMode,
    cloudNotConfigured,
    cloudConfigured,
    logout,
    deleteAccount,
    syncLocalProgress,
    migrationMessage,
    isMockDevMode,
  } = useAuth();
  const { setLanguage: setUiLanguage, t } = useLanguage();
  const [showAuth, setShowAuth] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [deletePending, setDeletePending] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [language, setLanguage] = useState("en");
  const [theme, setTheme] = useState("cozy");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [calendarEnabled, setCalendarEnabled] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [syncPending, setSyncPending] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [accountMessage, setAccountMessage] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!userProfile || !userPreferences) return;

    setDisplayName(userProfile.displayName);
    setLanguage(userPreferences.language);
    setTheme(userPreferences.theme);
    setCalendarEnabled(userPreferences.calendarEnabled);
    setReducedMotion(userPreferences.reducedMotion);

    const duration = splitDurationSeconds(userPreferences.defaultFocusDurationSeconds);
    setHours(duration.hours);
    setMinutes(duration.minutes);
    setSeconds(duration.seconds);
    setDirty(false);
  }, [userProfile, userPreferences]);

  const totalDurationSeconds = combineDurationSeconds(hours, minutes, seconds);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaveError(null);

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setSaveError(t("settings.errorDisplayName"));
      return;
    }

    if (totalDurationSeconds < 60) {
      setSaveError(t("settings.errorDuration"));
      return;
    }

    try {
      await saveUserSettings({
        displayName,
        preferences: {
          userId: getUserId(),
          language,
          theme,
          defaultFocusDurationSeconds: totalDurationSeconds,
          calendarEnabled,
          reducedMotion
        }
      });
      setDirty(false);
    } catch {
      /* surfaced via FeedbackRegion */
    }
  };

  const markDirty = () => setDirty(true);

  const handleSyncLocal = async () => {
    setSyncPending(true);
    setSyncError(null);
    try {
      const msg = await syncLocalProgress();
      setAccountMessage(msg);
      await loadAll(true);
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : t("auth.migrationFailed"));
    } finally {
      setSyncPending(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeletePending(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      setShowDeleteModal(false);
      setShowAuth(true);
      await loadAll(true);
      onAccountDeleted?.();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : t("settings.deleteFailed"));
    } finally {
      setDeletePending(false);
    }
  };

  return (
    <div className="page page-settings">
      <header className="settings-hero">
        <div>
          <p className="settings-eyebrow">{t("settings.yourSpace")}</p>
          <h1 className="section-title">{t("settings.title")}</h1>
          <p className="section-lead">{t("settings.lead")}</p>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-icon refresh-btn-inline"
          onClick={() => void loadAll(true)}
          disabled={loading || mutating}
          aria-label={t("settings.refreshAria")}
        >
          ↻
        </button>
      </header>

      <FeedbackRegion
        error={error}
        offline={offline}
        reward={reward}
        loading={loading}
        mutating={mutating}
        activeView="settings"
        onNavigate={onNavigate}
      />

      <section className="settings-card card">
        <h2 className="settings-card-title">{t("common.account")}</h2>
        <p className="settings-card-lead">
          {isCloudMode && isAuthenticated
            ? t("settings.signedInAs", { email: user?.email || user?.userId })
            : cloudNotConfigured
              ? t("settings.localModeCloudUnavailable")
              : t("settings.localModeActive")}
        </p>
        {(migrationMessage || accountMessage) && (
          <p className="auth-success" role="status">
            {accountMessage || migrationMessage}
          </p>
        )}
        {syncError && (
          <p className="feedback-error" role="alert">
            {syncError}
          </p>
        )}
        {showAuth ? (
          <AuthPage cloudOnly onSuccess={() => { setShowAuth(false); void loadAll(true); }} />
        ) : isAuthenticated ? (
          <div className="account-actions">
            {isCloudMode && (
              <button type="button" className="btn btn-ghost" onClick={() => void handleSyncLocal()} disabled={syncPending}>
                {syncPending ? t("common.pleaseWait") : t("settings.syncLocalProgress")}
              </button>
            )}
            <button type="button" className="btn btn-ghost" onClick={() => void logout().then(() => loadAll(true))}>
              {t("auth.signOut")}
            </button>
            <button
              type="button"
              className="btn btn-danger btn-ghost"
              onClick={() => {
                setDeleteError(null);
                setShowDeleteModal(true);
              }}
            >
              {t("settings.deleteAccount")}
            </button>
          </div>
        ) : (
          <div className="account-actions">
            <button type="button" className="btn btn-primary" onClick={() => setShowAuth(true)} disabled={cloudNotConfigured && !isMockDevMode}>
              {t("auth.signIn")}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setShowAuth(true)} disabled={cloudNotConfigured && !isMockDevMode}>
              {t("auth.createAccount")}
            </button>
          </div>
        )}
        {!isAuthenticated && (
          <p className="auth-hint">{t("settings.continueLocalHint")}</p>
        )}
      </section>

      {loading && !userPreferences ? (
        <div className="settings-loading card">{t("settings.loadingPrefs")}</div>
      ) : (
        <form className="settings-form" onSubmit={(event) => void handleSubmit(event)}>
          <section className="settings-card card">
            <h2 className="settings-card-title">{t("settings.profile")}</h2>
            <p className="settings-card-lead">{t("settings.profileLead")}</p>
            <label className="settings-field">
              <span className="settings-label">{t("settings.displayName")}</span>
              <input
                className="settings-input"
                type="text"
                value={displayName}
                maxLength={80}
                onChange={(event) => {
                  setDisplayName(event.target.value);
                  markDirty();
                }}
                placeholder={t("settings.displayNamePlaceholder")}
              />
            </label>
          </section>

          <section className="settings-card card">
            <h2 className="settings-card-title">{t("settings.languageTheme")}</h2>
            <p className="settings-card-lead">{t("settings.languageThemeLead")}</p>

            <fieldset className="settings-field">
              <legend className="settings-label">{t("common.language")}</legend>
              <div className="settings-segmented" role="radiogroup" aria-label={t("common.language")}>
                <button
                  type="button"
                  className={`settings-segment ${language === "en" ? "settings-segment--active" : ""}`}
                  aria-pressed={language === "en"}
                  onClick={() => {
                    setLanguage("en");
                    setUiLanguage("en");
                    markDirty();
                  }}
                >
                  {t("settings.english")}
                </button>
                <button
                  type="button"
                  className={`settings-segment ${language === "tr" ? "settings-segment--active" : ""}`}
                  aria-pressed={language === "tr"}
                  onClick={() => {
                    setLanguage("tr");
                    setUiLanguage("tr");
                    markDirty();
                  }}
                >
                  {t("settings.turkish")}
                </button>
              </div>
            </fieldset>

            <fieldset className="settings-field">
              <legend className="settings-label">{t("common.theme")}</legend>
              <div className="settings-segmented" role="radiogroup" aria-label={t("common.theme")}>
                <button
                  type="button"
                  className={`settings-segment ${theme === "cozy" ? "settings-segment--active" : ""}`}
                  aria-pressed={theme === "cozy"}
                  onClick={() => {
                    setTheme("cozy");
                    applyUserTheme("cozy");
                    markDirty();
                  }}
                >
                  {t("settings.cozy")}
                </button>
                <button
                  type="button"
                  className={`settings-segment ${theme === "classic" ? "settings-segment--active" : ""}`}
                  aria-pressed={theme === "classic"}
                  onClick={() => {
                    setTheme("classic");
                    applyUserTheme("classic");
                    markDirty();
                  }}
                >
                  {t("settings.classic")}
                </button>
              </div>
            </fieldset>
          </section>

          <section className="settings-card card">
            <h2 className="settings-card-title">{t("settings.focusDefaults")}</h2>
            <p className="settings-card-lead">{t("settings.focusDefaultsLead")}</p>

            <div className="settings-duration-grid">
              <label className="settings-field settings-field--compact">
                <span className="settings-label">{t("common.hours")}</span>
                <input
                  className="settings-input"
                  type="number"
                  min={0}
                  max={8}
                  value={hours}
                  onChange={(event) => {
                    setHours(Math.max(0, Number(event.target.value) || 0));
                    markDirty();
                  }}
                />
              </label>
              <label className="settings-field settings-field--compact">
                <span className="settings-label">{t("common.minutes")}</span>
                <input
                  className="settings-input"
                  type="number"
                  min={0}
                  max={59}
                  value={minutes}
                  onChange={(event) => {
                    setMinutes(Math.max(0, Math.min(59, Number(event.target.value) || 0)));
                    markDirty();
                  }}
                />
              </label>
              <label className="settings-field settings-field--compact">
                <span className="settings-label">{t("common.seconds")}</span>
                <input
                  className="settings-input"
                  type="number"
                  min={0}
                  max={59}
                  value={seconds}
                  onChange={(event) => {
                    setSeconds(Math.max(0, Math.min(59, Number(event.target.value) || 0)));
                    markDirty();
                  }}
                />
              </label>
            </div>
            <p className="settings-hint">{t("settings.defaultSessionLength", { duration: formatDuration(totalDurationSeconds) })}</p>
          </section>

          <section className="settings-card card">
            <h2 className="settings-card-title">{t("settings.integrations")}</h2>

            <label className="settings-toggle-row">
              <span>
                <span className="settings-toggle-title">{t("settings.calendarIntegration")}</span>
                <span className="settings-toggle-copy">{t("settings.calendarHint")}</span>
              </span>
              <input
                className="settings-toggle-input"
                type="checkbox"
                checked={calendarEnabled}
                onChange={(event) => {
                  setCalendarEnabled(event.target.checked);
                  markDirty();
                }}
              />
              <span className="settings-toggle-switch" aria-hidden />
            </label>

            <label className="settings-toggle-row">
              <span>
                <span className="settings-toggle-title">{t("settings.reducedMotion")}</span>
                <span className="settings-toggle-copy">{t("settings.reducedMotionHint")}</span>
              </span>
              <input
                className="settings-toggle-input"
                type="checkbox"
                checked={reducedMotion}
                onChange={(event) => {
                  setReducedMotion(event.target.checked);
                  markDirty();
                }}
              />
              <span className="settings-toggle-switch" aria-hidden />
            </label>
          </section>

          {saveError && (
            <p className="settings-save-error" role="alert">
              {saveError}
            </p>
          )}

          <div className="settings-actions">
            <button type="submit" className="btn btn-primary" disabled={mutating || loading || !dirty}>
              {mutating ? t("common.saving") : t("settings.saveSettings")}
            </button>
          </div>
        </form>
      )}

      <DeleteAccountModal
        open={showDeleteModal}
        pending={deletePending}
        error={deleteError}
        onCancel={() => {
          if (!deletePending) {
            setShowDeleteModal(false);
            setDeleteError(null);
          }
        }}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
}
