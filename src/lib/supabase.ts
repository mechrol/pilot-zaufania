// Supabase client
const SUPABASE_URL = "https://your-project.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-key";
let _c = null;
async function gc() { if(_c) return _c; try { const {createClient} = await import("@supabase/supabase-js"); _c=createClient(SUPABASE_URL,SUPABASE_ANON_KEY); return _c; } catch { return null; } }
export async function isSupabaseAvailable() { return (await gc()) !== null; }
export async function getSupabaseClient() { return gc(); }
export { SUPABASE_URL, SUPABASE_ANON_KEY };
