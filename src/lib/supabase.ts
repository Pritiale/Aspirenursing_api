import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

let cached: SupabaseClient | null = null;

/**
 * Server-side Supabase client using the SERVICE ROLE key.
 * Bypasses RLS — only ever import this in the API project (never in a browser bundle).
 */
export function getSupabase(): SupabaseClient {
  if (cached) return cached;
  cached = createClient(env.supabaseUrl(), env.supabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export type Subscription = {
  id: string;
  email: string;
  source: string | null;
  status: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  unsubscribed_at: string | null;
};
