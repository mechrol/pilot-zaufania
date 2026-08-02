import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://oflomemrwwzukwwayfky.supabase.co";
const SUPABASE_ANON_KEY =
  "sb_publishable_7YH6QLhFpHXv4N1W3BVPmg_7QzVdyP8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function getSupabase() {
  return supabase;
}
