import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./config";

export function createClient() {
  const { supabaseAnonKey, supabaseUrl } = getSupabaseEnv();
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
