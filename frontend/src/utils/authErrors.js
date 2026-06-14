import { getStoredLanguage, translate } from "../i18n/translations.js";

function stripTechnicalTerms(message) {
  return String(message || "")
    .replace(/\bsupabase\b/gi, "account service")
    .replace(/\bbackend\b/gi, "service")
    .replace(/\bapi\b/gi, "service")
    .replace(/\bendpoint\b/gi, "service")
    .replace(/\bdatabase\b/gi, "storage")
    .replace(/\bconfigured\b/gi, "available")
    .trim();
}

/** Map provider auth errors to product-friendly i18n messages. */
export function mapAuthProviderError(error) {
  const lang = getStoredLanguage();
  const raw = error instanceof Error ? error.message : String(error || "");
  const msg = raw.toLowerCase();

  if (msg.includes("invalid login credentials") || msg.includes("invalid email or password")) {
    return translate(lang, "auth.invalidCredentials");
  }
  if (msg.includes("user already registered") || msg.includes("already been registered")) {
    return translate(lang, "auth.emailAlreadyRegistered");
  }
  if (msg.includes("email not confirmed")) {
    return translate(lang, "auth.emailNotConfirmed");
  }
  if (
    msg.includes("email rate limit exceeded")
    || msg.includes("over_email_send_rate_limit")
    || msg.includes("email rate limit")
  ) {
    return translate(lang, "auth.emailRateLimitExceeded");
  }
  if (msg.includes("timed out")) {
    return translate(lang, "auth.requestTimedOut");
  }
  if (msg.includes("sign-in is not available") || msg.includes("sync after sign")) {
    return translate(lang, "sync.syncAfterSignIn");
  }

  const cleaned = stripTechnicalTerms(raw);
  if (cleaned && cleaned.length < 120 && !/jwt|token|bearer|oauth/i.test(cleaned)) {
    return cleaned;
  }
  return translate(lang, "auth.authFailed");
}
