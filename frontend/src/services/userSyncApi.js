import { getApiBaseUrl } from "./api.js";
import { getAuthHeaders } from "./authSession.js";

function baseUrl() {
  return getApiBaseUrl();
}

export async function fetchUserState() {
  const r = await fetch(`${baseUrl()}/api/user/state`, {
    headers: getAuthHeaders(),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.detail || "Failed to load user data");
  return data;
}

export async function saveUserState(payload) {
  const r = await fetch(`${baseUrl()}/api/user/state`, {
    method: "PUT",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.detail || "Failed to save user data");
  return data;
}

export async function fetchBackendInfo() {
  const r = await fetch(`${baseUrl()}/api/main`);
  if (!r.ok) return null;
  return r.json();
}
