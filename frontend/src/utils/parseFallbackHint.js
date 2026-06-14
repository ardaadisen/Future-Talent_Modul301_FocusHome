/** Fallback reason codes returned by the backend when AI was skipped. */
export const PARSE_FALLBACK_REASONS = {
  GEMINI_QUOTA: "gemini_quota_exceeded",
  OPENAI_QUOTA: "openai_quota_exceeded",
  GEMINI_TIMEOUT: "gemini_timeout",
  OPENAI_TIMEOUT: "openai_timeout",
  GEMINI_UNAUTHORIZED: "gemini_unauthorized",
  OPENAI_UNAUTHORIZED: "openai_unauthorized",
  GEMINI_API: "gemini_api_error",
  OPENAI_API: "openai_api_error",
  GEMINI_INVALID: "gemini_invalid_response",
  OPENAI_INVALID: "openai_invalid_response",
  BACKEND_UNREACHABLE: "backend_unreachable",
};

const AI_BUSY_HINT_REASONS = new Set([
  PARSE_FALLBACK_REASONS.GEMINI_QUOTA,
  PARSE_FALLBACK_REASONS.OPENAI_QUOTA,
  PARSE_FALLBACK_REASONS.GEMINI_TIMEOUT,
  PARSE_FALLBACK_REASONS.OPENAI_TIMEOUT,
  PARSE_FALLBACK_REASONS.GEMINI_UNAUTHORIZED,
  PARSE_FALLBACK_REASONS.OPENAI_UNAUTHORIZED,
  PARSE_FALLBACK_REASONS.GEMINI_API,
  PARSE_FALLBACK_REASONS.OPENAI_API,
  PARSE_FALLBACK_REASONS.GEMINI_INVALID,
  PARSE_FALLBACK_REASONS.OPENAI_INVALID,
  PARSE_FALLBACK_REASONS.BACKEND_UNREACHABLE,
]);

/** Show friendly “AI is busy” hint — not for missing-key config issues. */
export function shouldShowAiBusyHint(fallbackReason) {
  if (!fallbackReason) return false;
  return AI_BUSY_HINT_REASONS.has(fallbackReason);
}
