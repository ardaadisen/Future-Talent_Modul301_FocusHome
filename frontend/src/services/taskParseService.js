/**
 * Resilient task parsing — backend AI with timeout, then client smart parse fallback.
 */

import { mapAiParseFromApi } from "../utils/apiMappers.js";
import { PARSE_FALLBACK_REASONS } from "../utils/parseFallbackHint.js";
import { heuristicParseTask } from "../utils/heuristicTaskParse.js";
import { fetchWithTimeout } from "../utils/withTimeout.js";
import { getAuthHeaders } from "./authSession.js";
import { getApiBaseUrl } from "./api.js";

export const PARSE_REQUEST_TIMEOUT_MS = 18_000;

function logParseFallback(reason, detail) {
  if (import.meta.env.DEV) {
    console.warn(`[taskParse] ${reason}`, detail ?? "");
  }
}

function toUiResult(apiPayload) {
  return mapAiParseFromApi(apiPayload);
}

function clientFallbackPayload(text, timezone, fallbackReason) {
  return {
    ...heuristicParseTask(text, timezone),
    fallbackReason,
  };
}

export async function parseTaskResilient(text, timezone = "Europe/Istanbul") {
  const trimmed = text?.trim();
  if (!trimmed) {
    throw new Error("Plan text is required.");
  }

  const url = `${getApiBaseUrl()}/api/ai/parse-task`;

  try {
    const response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: {
          ...getAuthHeaders({ "Content-Type": "application/json" }),
        },
        body: JSON.stringify({ text: trimmed, timezone }),
      },
      PARSE_REQUEST_TIMEOUT_MS,
    );

    if (!response.ok) {
      logParseFallback("backend error status", response.status);
      return toUiResult(
        clientFallbackPayload(trimmed, timezone, PARSE_FALLBACK_REASONS.BACKEND_UNREACHABLE),
      );
    }

    const data = await response.json();
    if (import.meta.env.DEV) {
      console.info(
        "[taskParse] backend source:",
        data.source ?? "unknown",
        data.fallbackReason ? `(fallbackReason=${data.fallbackReason})` : "",
      );
    }
    return toUiResult(data);
  } catch (err) {
    logParseFallback("backend unreachable or timed out", err);
    return toUiResult(
      clientFallbackPayload(trimmed, timezone, PARSE_FALLBACK_REASONS.BACKEND_UNREACHABLE),
    );
  }
}
