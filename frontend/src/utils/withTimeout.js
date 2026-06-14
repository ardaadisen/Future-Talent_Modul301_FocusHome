/**
 * Reject a promise if it does not settle within `ms`.
 * Clears the timer when the promise settles to avoid leaks.
 */
export function withTimeout(promise, ms, message = "Request timed out.") {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = window.setTimeout(() => {
      reject(new Error(message));
    }, ms);
  });

  return Promise.race([promise, timeout]).finally(() => {
    window.clearTimeout(timer);
  });
}

/**
 * fetch() with an AbortSignal timeout.
 */
export async function fetchWithTimeout(url, options = {}, ms = 15_000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), ms);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw err;
  } finally {
    window.clearTimeout(timer);
  }
}
