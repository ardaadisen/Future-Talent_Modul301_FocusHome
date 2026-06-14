import { isCloudConfigured } from "../utils/syncMode.js";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "../utils/syncMode.js";

const supabaseCheck = isCloudConfigured();
const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabaseEnv();

export const isSupabaseConfigured = () => supabaseCheck;

export const supabaseConfigError = supabaseCheck ? null : null;

export const supabaseClient = supabaseCheck
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
