import { fetchJson } from "./api.js";
import { fetchWithTimeout } from "../utils/withTimeout.js";
import { getApiBaseUrl } from "../utils/authConfig.js";

const API_BASE = getApiBaseUrl();
const AUTH_TIMEOUT_MS = 15_000;

export async function registerUser(email, password) {
  const r = await fetchWithTimeout(
    `${API_BASE}/api/auth/register`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    },
    AUTH_TIMEOUT_MS,
  );
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.detail || "Registration failed");
  return data;
}

export async function loginUser(email, password) {
  const r = await fetchWithTimeout(
    `${API_BASE}/api/auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    },
    AUTH_TIMEOUT_MS,
  );
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.detail || "Login failed");
  return data;
}

export async function fetchCurrentUser(token) {
  const r = await fetchWithTimeout(
    `${API_BASE}/api/auth/me`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
    AUTH_TIMEOUT_MS,
  );
  if (!r.ok) return { authenticated: false };
  return r.json();
}

export async function deleteAccount() {
  return fetchJson("/api/account", { method: "DELETE" });
}
