import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

let cached: SupabaseClient | null = null;

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

export type Facility = {
  id: string;
  facility_name: string;
  facility_address: string;
  facility_phone: string;
  status: string;
  created_at: string;
};

export type ContactPerson = {
  id: string;
  contact_name: string;
  contact_position: string;
  contact_email: string;
  facility_id: string | null;
  status: string;
  created_at: string;
};

export type Booking = {
  id: string;
  booking_number: string;
  service_id: string;
  service_title: string;
  grade: number | null;
  shift_start: string;
  shift_end: string;
  total_hours: number | null;
  subtotal: number | null;
  estimated_total: number | null;
  gst_amount: number | null;
  total_with_gst: number | null;
  rate_breakdown: unknown | null;
  break_applied: boolean;
  break_amount: number | null;
  overtime_applies: boolean;
  notes: string | null;
  facility_id: string | null;
  contact_person_id: string | null;
  status: string;
  created_at: string;
};
