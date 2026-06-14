import { getDataProvider } from "../services/dataProvider.js";
import { LocalDataProvider } from "../services/LocalDataProvider.js";
import { refreshAccessToken, requireAccessToken } from "../services/authSession.js";
import { isAuthApiError, normalizeApiError } from "./apiError.js";
import { SYNC_MODE } from "./syncMode.js";

/** Pick cloud provider only when signed-in mode and a bearer token is available. */
export async function resolveTaskDataProvider(syncMode) {
  if (syncMode === SYNC_MODE.CLOUD) {
    const token = await requireAccessToken();
    if (token) {
      return { provider: getDataProvider(SYNC_MODE.CLOUD), mode: SYNC_MODE.CLOUD };
    }
  }
  return { provider: LocalDataProvider, mode: SYNC_MODE.LOCAL };
}

/**
 * Run a task mutation with cloud provider when possible.
 * On auth failure: refresh token once, then fall back to local storage.
 */
export async function runTaskMutation(syncMode, fn) {
  let { provider, mode } = await resolveTaskDataProvider(syncMode);

  try {
    return { result: await fn(provider), mode, fallback: false };
  } catch (error) {
    if (mode !== SYNC_MODE.CLOUD || !isAuthApiError(error)) {
      throw error;
    }

    const refreshed = await refreshAccessToken();
    if (refreshed) {
      try {
        const cloudProvider = getDataProvider(SYNC_MODE.CLOUD);
        return { result: await fn(cloudProvider), mode: SYNC_MODE.CLOUD, fallback: false, retried: true };
      } catch (retryError) {
        if (!isAuthApiError(retryError)) {
          throw retryError;
        }
      }
    }

    const result = await fn(LocalDataProvider);
    return {
      result,
      mode: SYNC_MODE.LOCAL,
      fallback: true,
      authNotice: normalizeApiError(error, { cloudAttempt: true }),
    };
  }
}
