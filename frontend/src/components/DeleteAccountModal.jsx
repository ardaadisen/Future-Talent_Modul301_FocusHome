import { useState } from "react";

import { useLanguage } from "../context/LanguageContext.jsx";

const CONFIRM_WORD = "DELETE";

export function DeleteAccountModal({ open, pending, error, onCancel, onConfirm }) {
  const { t } = useLanguage();
  const [confirmText, setConfirmText] = useState("");
  const [step, setStep] = useState(1);

  if (!open) return null;

  const canProceed = step === 1 || confirmText.trim().toUpperCase() === CONFIRM_WORD;

  const handleClose = () => {
    setConfirmText("");
    setStep(1);
    onCancel();
  };

  const handlePrimary = () => {
    if (step === 1) {
      setStep(2);
      return;
    }
    if (confirmText.trim().toUpperCase() !== CONFIRM_WORD) return;
    void onConfirm();
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={handleClose}>
      <div
        className="modal-card delete-account-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="delete-account-title" className="modal-title">
          {t("settings.deleteAccountTitle")}
        </h2>
        <p className="modal-warning">{t("settings.deleteAccountWarning")}</p>

        {step === 2 && (
          <label className="delete-account-confirm-field">
            <span>{t("settings.deleteAccountTypeDelete")}</span>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={t("settings.deleteConfirmPlaceholder")}
              autoComplete="off"
              disabled={pending}
            />
          </label>
        )}

        {error && (
          <p className="feedback-error" role="alert">
            {error}
          </p>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={handleClose} disabled={pending}>
            {t("settings.deleteAccountCancel")}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handlePrimary}
            disabled={pending || !canProceed || (step === 2 && confirmText.trim().toUpperCase() !== CONFIRM_WORD)}
          >
            {pending
              ? t("settings.deleteAccountDeleting")
              : step === 1
                ? t("settings.deleteAccountContinue")
                : t("settings.deleteAccountConfirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
