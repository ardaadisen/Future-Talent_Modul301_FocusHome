/** Client-side auth validation (format only — ownership via Supabase email confirmation). */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email) {
  const value = String(email || "").trim();
  if (!value) return { ok: false, messageKey: "auth.validation.emailRequired" };
  if (!EMAIL_RE.test(value)) return { ok: false, messageKey: "auth.validation.emailInvalid" };
  return { ok: true, value: value.toLowerCase() };
}

export function validateRegisterPassword(password) {
  const value = String(password || "");
  if (value.length < 8) return { ok: false, messageKey: "auth.validation.passwordMinLength" };
  if (!/[A-Z]/.test(value)) return { ok: false, messageKey: "auth.validation.passwordUppercase" };
  if (!/[a-z]/.test(value)) return { ok: false, messageKey: "auth.validation.passwordLowercase" };
  if (!/\d/.test(value)) return { ok: false, messageKey: "auth.validation.passwordNumber" };
  if (!/[^A-Za-z0-9]/.test(value)) return { ok: false, messageKey: "auth.validation.passwordSpecial" };
  return { ok: true };
}

export function validateSignInPassword(password) {
  if (!String(password || "").trim()) {
    return { ok: false, messageKey: "auth.validation.passwordRequired" };
  }
  return { ok: true };
}
