import { fetchJson, getApiBaseUrl } from "./api.js";

export async function fetchUserState() {
  return fetchJson("/api/user/state", { method: "GET" });
}

export async function saveUserState(payload) {
  return fetchJson("/api/user/state", { method: "PUT", body: payload });
}

export async function fetchBackendInfo() {
  const r = await fetch(`${getApiBaseUrl()}/api/main`);
  if (!r.ok) return null;
  return r.json();
}
