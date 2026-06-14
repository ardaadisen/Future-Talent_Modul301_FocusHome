import { useState } from "react";

import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import {
  validateEmail,
  validateRegisterPassword,
  validateSignInPassword,
} from "../utils/authValidation.js";
import { mapAuthProviderError } from "../utils/authErrors.js";

export function AuthPage({ standalone = false, onSuccess, cloudOnly = false }) {
  const {
    login,
    register,
    emailConfirmRequired,
    isMockDevMode,
    cloudConfigured,
    cloudNotConfigured,
    migrationMessage,
  } = useAuth();
  const { t } = useLanguage();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);
  const [confirmRequired, setConfirmRequired] = useState(false);

  const cloudUnavailable = cloudNotConfigured || !cloudConfigured;
  const authDisabled = cloudOnly && cloudUnavailable && !isMockDevMode;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setPending(true);

    try {
      if (cloudUnavailable && !isMockDevMode) {
        setError(t("sync.syncAfterSignIn"));
        return;
      }

      const emailCheck = validateEmail(email);
      if (!emailCheck.ok) {
        setError(t(emailCheck.messageKey));
        return;
      }

      if (mode === "login") {
        const passCheck = validateSignInPassword(password);
        if (!passCheck.ok) {
          setError(t(passCheck.messageKey));
          return;
        }
        const result = await login(emailCheck.value, password);
        if (result?.migrationMsg) {
          setSuccess(result.migrationMsg);
        }
        onSuccess?.();
      } else {
        const passCheck = validateRegisterPassword(password);
        if (!passCheck.ok) {
          setError(t(passCheck.messageKey));
          return;
        }
        const result = await register(emailCheck.value, password);
        if (result?.emailConfirmRequired) {
          setMode("login");
          setPassword("");
          setConfirmRequired(true);
          setSuccess(t("auth.accountCreatedConfirm"));
        } else {
          if (result?.migrationMsg) {
            setSuccess(result.migrationMsg);
          }
          onSuccess?.();
        }
      }
    } catch (err) {
      setError(mapAuthProviderError(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className={`auth-page ${standalone ? "auth-page--standalone" : ""}`}>
      <div className="card auth-card">
        {isMockDevMode && (
          <p className="auth-dev-badge" role="status">
            {t("auth.developmentMode")}
          </p>
        )}
        <h1 className="page-header-title">{mode === "login" ? t("auth.signIn") : t("auth.createAccount")}</h1>
        <p className="page-header-lead">{t("auth.taglineOptional")}</p>

        {cloudUnavailable && !isMockDevMode && (
          <p className="feedback-warning" role="status">
            {t("sync.deviceOnly")}
          </p>
        )}

        {(confirmRequired || emailConfirmRequired) && (
          <p className="auth-hint">{t("auth.emailConfirmHint")}</p>
        )}

        {migrationMessage && (
          <p className="auth-success" role="status">
            {migrationMessage}
          </p>
        )}

        <form className="auth-form" onSubmit={(e) => void handleSubmit(e)}>
          <label>
            {t("auth.email")}
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={pending}
              required
            />
          </label>
          <label>
            {t("auth.password")}
            <input
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={pending}
              required
            />
          </label>
          {mode === "register" && (
            <p className="auth-hint">{t("auth.passwordRequirements")}</p>
          )}
          {success && (
            <p className="auth-success" role="status">
              {success}
            </p>
          )}
          {error && (
            <p className="feedback-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary" disabled={pending || authDisabled}>
            {pending ? t("common.pleaseWait") : mode === "login" ? t("auth.signIn") : t("auth.createAccount")}
          </button>
        </form>

        <p className="auth-toggle">
          {mode === "login" ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
          <button
            type="button"
            className="link-btn"
            disabled={pending}
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
              setSuccess("");
            }}
          >
            {mode === "login" ? t("auth.createAccount") : t("auth.signIn")}
          </button>
        </p>
      </div>
    </div>
  );
}
