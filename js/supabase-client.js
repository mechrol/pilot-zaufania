/**
 * Pilot Zaufania — Supabase Client
 * Inicjalizacja połączenia z refleksyjną bazą wiedzy.
 *
 * Aby aktywować: ustaw SUPABASE_URL i SUPABASE_ANON_KEY na wartości
 * ze swojego projektu Supabase (Settings → API).
 */

// ===================== KONFIGURACJA =====================
// Wartości placeholder — zastąp rzeczywistymi danymi projektu Supabase
const SUPABASE_URL       = 'https://xxxxxxxxxxxx.supabase.co';
const SUPABASE_ANON_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// ===================== INICJALIZACJA KLIENTA =====================
let supabase = null;
let dbReady  = false;

function initSupabase() {
  if (typeof supabaseCreateClient === 'undefined') {
    console.warn('[PilotZaufania] Supabase CDN not loaded. Using localStorage fallback.');
    return false;
  }
  if (!SUPABASE_URL || SUPABASE_URL.includes('xxxxxxxx')) {
    console.warn('[PilotZaufania] Supabase not configured. Using localStorage fallback.');
    return false;
  }
  try {
    supabase = supabaseCreateClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
      db:   { schema: 'public' }
    });
    dbReady = true;
    console.log('[PilotZaufania] Supabase connected — reflective knowledge base active.');
    return true;
  } catch (err) {
    console.error('[PilotZaufania] Supabase init failed:', err);
    return false;
  }
}

// Wywołaj przy starcie
initSupabase();
