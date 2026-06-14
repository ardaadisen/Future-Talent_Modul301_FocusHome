import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { deleteAccount as deleteAccountApi, loginUser, registerUser } from "../services/authApi.js";
import { migrateLocalToCloud, shouldOfferMigration } from "../services/migrationService.js";
import { setAccessToken } from "../services/authSession.js";
import { supabaseClient } from "../services/supabaseClient.js";
import { clearAllLocalUserData } from "../utils/clearLocalUserData.js";
import {
  AUTH_REQUEST_TIMEOUT_MS,
  getCloudNotConfiguredMessage,
  getDataSyncMode,
  isCloudConfigured,
  isMockAuthEnabled,
  SYNC_MODE,
} from "../utils/syncMode.js";
import { withTimeout } from "../utils/withTimeout.js";
import { getStoredLanguage, translate } from "../i18n/translations.js";
import { mapAuthProviderError } from "../utils/authErrors.js";

const AuthContext = createContext(null);

function mapSupabaseSession(session) {
  if (!session?.user) return null;
  return {
    userId: session.user.id,
    email: session.user.email || "",
    token: session.access_token,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [emailConfirmRequired, setEmailConfirmRequired] = useState(false);
  const [migrationMessage, setMigrationMessage] = useState(null);
  const [authActionError, setAuthActionError] = useState(null);

  const syncMode = getDataSyncMode({ authenticated: Boolean(user), accessToken: user?.token });
  const cloudConfigured = isCloudConfigured();

  const applySession = useCallback((sessionLike) => {
    if (!sessionLike) {
      setAccessToken(null);
      setUser(null);
      localStorage.removeItem("focushome_user_id");
      localStorage.removeItem("focushome_user_email");
      return;
    }
    setAccessToken(sessionLike.token);
    setUser({ userId: sessionLike.userId, email: sessionLike.email, token: sessionLike.token });
    localStorage.setItem("focushome_user_id", sessionLike.userId);
    localStorage.setItem("focushome_user_email", sessionLike.email || "");
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem("focushome_user_id");
    localStorage.removeItem("focushome_user_email");
  }, []);

  const runMigrationIfNeeded = useCallback(async (session) => {
    if (!session?.userId || !isCloudConfigured()) return null;
    if (!shouldOfferMigration(session.userId)) return null;
    const result = await migrateLocalToCloud(session.userId);
    if (result.ok && result.migrated) {
      return translate(getStoredLanguage(), "auth.migrationSuccess");
    }
    if (!result.ok) {
      return result.error || translate(getStoredLanguage(), "auth.migrationFailed");
    }
    return null;
  }, []);

  useEffect(() => {
    if (!cloudConfigured || !supabaseClient) return undefined;

    let cancelled = false;

    async function restoreSession() {
      setAuthLoading(true);
      try {
        const { data } = await withTimeout(
          supabaseClient.auth.getSession(),
          AUTH_REQUEST_TIMEOUT_MS,
          translate(getStoredLanguage(), "auth.requestTimedOut"),
        );
        if (cancelled) return;
        applySession(mapSupabaseSession(data.session));
      } catch {
        /* stay in local mode */
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    }

    void restoreSession();

    const { data: sub } = supabaseClient.auth.onAuthStateChange((event, session) => {
      applySession(mapSupabaseSession(session));
      if (import.meta.env.DEV && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
        console.info("[auth] session updated:", event);
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [applySession, cloudConfigured]);

  const loginWithSupabase = useCallback(
    async (email, password) => {
      if (!isCloudConfigured() || !supabaseClient) {
        throw new Error(getCloudNotConfiguredMessage());
      }
      const { data, error } = await withTimeout(
        supabaseClient.auth.signInWithPassword({ email, password }),
        AUTH_REQUEST_TIMEOUT_MS,
        translate(getStoredLanguage(), "auth.requestTimedOut"),
      );
      if (error) throw new Error(mapAuthProviderError(error));
      if (!data.session) {
        throw new Error(translate(getStoredLanguage(), "auth.signInFailed"));
      }
      const session = mapSupabaseSession(data.session);
      applySession(session);
      const migrationMsg = await runMigrationIfNeeded(session);
      if (migrationMsg) setMigrationMessage(migrationMsg);
      return { session, emailConfirmRequired: false, migrationMsg };
    },
    [applySession, runMigrationIfNeeded],
  );

  const registerWithSupabase = useCallback(
    async (email, password) => {
      if (!isCloudConfigured() || !supabaseClient) {
        throw new Error(getCloudNotConfiguredMessage());
      }
      const { data, error } = await withTimeout(
        supabaseClient.auth.signUp({ email, password }),
        AUTH_REQUEST_TIMEOUT_MS,
        translate(getStoredLanguage(), "auth.requestTimedOut"),
      );
      if (error) throw new Error(mapAuthProviderError(error));

      const needsConfirm = !data.session;
      setEmailConfirmRequired(needsConfirm);

      if (data.session) {
        const session = mapSupabaseSession(data.session);
        applySession(session);
        const migrationMsg = await runMigrationIfNeeded(session);
        if (migrationMsg) setMigrationMessage(migrationMsg);
        return { emailConfirmRequired: false, migrationMsg };
      }

      return { emailConfirmRequired: true };
    },
    [applySession, runMigrationIfNeeded],
  );

  const login = useCallback(
    async (email, password) => {
      setAuthActionError(null);
      if (isMockAuthEnabled()) {
        const session = await loginUser(email, password);
        localStorage.setItem("focushome_auth_token", session.token);
        applySession({ userId: session.userId, email: session.email, token: session.token });
        return session;
      }
      return loginWithSupabase(email, password);
    },
    [applySession, loginWithSupabase],
  );

  const register = useCallback(
    async (email, password) => {
      setAuthActionError(null);
      if (isMockAuthEnabled()) {
        await registerUser(email, password);
        setEmailConfirmRequired(false);
        return { emailConfirmRequired: false };
      }
      return registerWithSupabase(email, password);
    },
    [registerWithSupabase],
  );

  const syncLocalProgress = useCallback(async () => {
    if (!user?.userId) {
      throw new Error(translate(getStoredLanguage(), "error.notSignedIn"));
    }
    const result = await migrateLocalToCloud(user.userId);
    if (!result.ok) {
      throw new Error(result.error || translate(getStoredLanguage(), "auth.migrationFailed"));
    }
    const msg = translate(getStoredLanguage(), "auth.migrationSuccess");
    setMigrationMessage(msg);
    return msg;
  }, [user]);

  const logout = useCallback(async () => {
    try {
      if (user && supabaseClient && isCloudConfigured()) {
        await withTimeout(
          supabaseClient.auth.signOut(),
          AUTH_REQUEST_TIMEOUT_MS,
          translate(getStoredLanguage(), "auth.requestTimedOut"),
        );
      }
      localStorage.removeItem("focushome_auth_token");
    } catch {
      /* ignore — still return to local mode */
    } finally {
      clearSession();
      setMigrationMessage(null);
    }
  }, [clearSession, user]);

  const deleteAccount = useCallback(async () => {
    if (!user?.token) {
      throw new Error(translate(getStoredLanguage(), "auth.noCloudAccount"));
    }
    await deleteAccountApi();
    try {
      if (supabaseClient) await supabaseClient.auth.signOut();
    } finally {
      clearAllLocalUserData();
      clearSession();
    }
  }, [clearSession, user]);

  const value = useMemo(
    () => ({
      user,
      loading: authLoading,
      authLoading,
      requireAuth: false,
      syncMode,
      cloudConfigured,
      emailConfirmRequired,
      migrationMessage,
      authActionError,
      login,
      register,
      logout,
      deleteAccount,
      syncLocalProgress,
      isAuthenticated: Boolean(user),
      isSupabaseMode: cloudConfigured,
      isMockDevMode: isMockAuthEnabled(),
      isLocalMode: syncMode === SYNC_MODE.LOCAL || syncMode === SYNC_MODE.SUPABASE_NOT_CONFIGURED,
      isCloudMode: syncMode === SYNC_MODE.CLOUD,
      cloudNotConfigured: syncMode === SYNC_MODE.SUPABASE_NOT_CONFIGURED,
    }),
    [
      user,
      authLoading,
      syncMode,
      cloudConfigured,
      emailConfirmRequired,
      migrationMessage,
      authActionError,
      login,
      register,
      logout,
      deleteAccount,
      syncLocalProgress,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { isCloudConfigured, isMockAuthEnabled, SYNC_MODE };
