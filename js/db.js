/**
 * Pilot Zaufania — Database Service (Refleksyjna Baza Wiedzy)
 *
 * Warstwa abstrakcji bazy danych. Gdy Supabase jest skonfigurowany,
 * używa PostgreSQL przez supabase-js. W przeciwnym razie działa
 * na localStorage (istniejący fallback z data.js).
 *
 * API jest w pełni asynchroniczne — wszystkie funkcje zwracają Promise.
 */

// ===================== WYKRYWANIE ŚRODOWISKA =====================

const DB_MODE = (typeof dbReady !== 'undefined' && dbReady) ? 'supabase' : 'localstorage';
console.log('[PilotZaufania] DB mode:', DB_MODE);

// ===================== POMOCNICZE =====================

/** UUID v4 generator (używany gdy Supabase nie generuje UUID po stronie serwera) */
function dbGenerateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

/** Prosty hash integralności (spójny z data.js) */
function dbSimpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return 'h' + Math.abs(hash).toString(16).padStart(8, '0');
}

// ======================== RIDES (przejazdy) ========================

async function dbGetRides() {
  if (DB_MODE === 'supabase') {
    const { data, error } = await supabase
      .from('rides')
      .select('*, driver:drivers(*), category:categories(*)')
      .order('created_at', { ascending: false });
    if (error) { console.error('[DB] dbGetRides:', error); return []; }
    return data;
  }
  // localStorage fallback
  try {
    const raw = localStorage.getItem('pilot_zaufania_rides');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function dbGetRideById(rideId) {
  if (DB_MODE === 'supabase') {
    const { data, error } = await supabase
      .from('rides')
      .select('*, driver:drivers(*), category:categories(*)')
      .eq('ride_id', rideId)
      .single();
    if (error) return null;
    return data;
  }
  const rides = await dbGetRides();
  return rides.find(r => r.ride_id === rideId) || null;
}

async function dbCreateRide({ pickup, dropoff, categoryKey, driverId, vehicle, tier }) {
  const rideId = dbGenerateUUID();
  const fare = await dbGetFareEstimate(categoryKey);

  const ride = {
    ride_id: rideId,
    passenger_id: '00000000-0000-0000-0000-000000000001', // placeholder — zastąp auth.uid()
    driver_id: driverId,
    category_key: categoryKey,
    pickup,
    dropoff,
    status: 'booked',
    tier: tier || 'T1',
    created_at: new Date().toISOString(),
    fare_base: fare.base,
    fare_distance_km: fare.distance,
    fare_per_km: fare.perKm,
    fare_total: fare.total
  };

  if (DB_MODE === 'supabase') {
    const { data, error } = await supabase.from('rides').insert(ride).select().single();
    if (error) { console.error('[DB] dbCreateRide:', error); return null; }
    return data;
  }
  // localStorage fallback
  const rides = await dbGetRides();
  rides.push(ride);
  localStorage.setItem('pilot_zaufania_rides', JSON.stringify(rides));
  return ride;
}

async function dbSaveRide(ride) {
  if (DB_MODE === 'supabase') {
    const { error } = await supabase.from('rides').upsert(ride, { onConflict: 'ride_id' });
    if (error) { console.error('[DB] dbSaveRide:', error); return false; }
    return true;
  }
  const rides = await dbGetRides();
  const idx = rides.findIndex(r => r.ride_id === ride.ride_id);
  if (idx >= 0) rides[idx] = ride; else rides.push(ride);
  localStorage.setItem('pilot_zaufania_rides', JSON.stringify(rides));
  return true;
}

// ======================== RIDE EVENTS (zdarzenia) ========================

async function dbGetEventsByRide(rideId) {
  if (DB_MODE === 'supabase') {
    const { data, error } = await supabase
      .from('ride_events')
      .select('*')
      .eq('ride_id', rideId)
      .order('timestamp', { ascending: true });
    if (error) { console.error('[DB] dbGetEventsByRide:', error); return []; }
    return data;
  }
  try {
    const raw = localStorage.getItem('pilot_zaufania_events');
    const all = raw ? JSON.parse(raw) : [];
    return all.filter(e => e.ride_id === rideId)
              .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  } catch { return []; }
}

async function dbAddRideEvent(rideId, eventType, payload, tier) {
  const event = {
    event_id: dbGenerateUUID(),
    ride_id: rideId,
    source_tier: tier || 'T1',
    event_type: eventType,
    payload: payload || {},
    integrity_hash: dbSimpleHash(JSON.stringify({ rideId, eventType, ts: Date.now() })),
    timestamp: new Date().toISOString()
  };

  if (DB_MODE === 'supabase') {
    const { data, error } = await supabase.from('ride_events').insert(event).select().single();
    if (error) { console.error('[DB] dbAddRideEvent:', error); return null; }
    return data;
  }
  const all = JSON.parse(localStorage.getItem('pilot_zaufania_events') || '[]');
  all.push(event);
  localStorage.setItem('pilot_zaufania_events', JSON.stringify(all));
  return event;
}

// ======================== JOURNAL (dzienniczek) ========================

async function dbGetJournalEntries(rideId) {
  if (DB_MODE === 'supabase') {
    let query = supabase.from('journal_entries').select('*');
    if (rideId) query = query.eq('ride_id', rideId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) { console.error('[DB] dbGetJournalEntries:', error); return []; }
    return data;
  }
  try {
    const raw = localStorage.getItem('pilot_zaufania_journal');
    const all = raw ? JSON.parse(raw) : [];
    return rideId ? all.filter(e => e.ride_id === rideId) : all;
  } catch { return []; }
}

async function dbSaveJournalEntry(entry) {
  if (DB_MODE === 'supabase') {
    const { data, error } = await supabase.from('journal_entries').insert(entry).select().single();
    if (error) { console.error('[DB] dbSaveJournalEntry:', error); return null; }
    return data;
  }
  const all = JSON.parse(localStorage.getItem('pilot_zaufania_journal') || '[]');
  all.push(entry);
  localStorage.setItem('pilot_zaufania_journal', JSON.stringify(all));
  return entry;
}

async function dbGetUserJournal() {
  const entries = await dbGetJournalEntries(null);
  return entries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

/** Pełnotekstowe wyszukiwanie refleksji — unikalna cecha refleksyjnej bazy wiedzy */
async function dbSearchJournal(query) {
  if (DB_MODE === 'supabase') {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .textSearch('content', query, { config: 'polish' });
    if (error) { console.error('[DB] dbSearchJournal:', error); return []; }
    return data;
  }
  // localStorage: proste wyszukiwanie po treści
  const entries = await dbGetUserJournal();
  const q = query.toLowerCase();
  return entries.filter(e => e.content.toLowerCase().includes(q));
}

// ======================== CONTRACTS (Smart Kontrakty) ========================

async function dbGetContracts() {
  if (DB_MODE === 'supabase') {
    const { data, error } = await supabase.from('contracts').select('*');
    if (error) { console.error('[DB] dbGetContracts:', error); return []; }
    return data;
  }
  try {
    const raw = localStorage.getItem('pilot_zaufania_contracts');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function dbGetContractByRide(rideId) {
  if (DB_MODE === 'supabase') {
    const { data, error } = await supabase
      .from('contracts').select('*').eq('ride_id', rideId).single();
    if (error) return null;
    return data;
  }
  const contracts = await dbGetContracts();
  return contracts.find(c => c.ride_id === rideId) || null;
}

async function dbSaveContract(contract) {
  if (DB_MODE === 'supabase') {
    const { error } = await supabase.from('contracts').upsert(contract, { onConflict: 'ride_id' });
    if (error) { console.error('[DB] dbSaveContract:', error); return false; }
    return true;
  }
  const all = await dbGetContracts();
  const idx = all.findIndex(c => c.ride_id === contract.ride_id);
  if (idx >= 0) all[idx] = contract; else all.push(contract);
  localStorage.setItem('pilot_zaufania_contracts', JSON.stringify(all));
  return true;
}

async function dbCreateContract(rideId, ride) {
  const events = await dbGetEventsByRide(rideId);
  const contract = {
    contract_id: dbGenerateUUID(),
    ride_id: rideId,
    passenger_snapshot: { name: 'Janusz Krawczak', role: 'passenger', joined: '2026-01-15' },
    driver_snapshot: ride.driver ? { name: ride.driver.name, license: ride.driver.license, experience: ride.driver.experience, rating: ride.driver.rating } : {},
    vehicle_snapshot: ride.vehicle || {},
    cost_breakdown: {
      category: ride.fare_estimate ? ride.fare_estimate.category : (ride.category || ''),
      base_fare: ride.fare_estimate ? ride.fare_estimate.base : (ride.fare_base || 0),
      distance_km: ride.fare_estimate ? ride.fare_estimate.distance : (ride.fare_distance_km || 0),
      per_km_rate: ride.fare_estimate ? ride.fare_estimate.perKm : (ride.fare_per_km || 0),
      distance_charge: Math.round((ride.fare_per_km || 0) * (ride.fare_distance_km || 0) * 100) / 100,
      events_surcharge: 0,
      total: ride.fare_estimate ? ride.fare_estimate.total : (ride.fare_total || 0)
    },
    status: 'draft',
    passenger_signoff: null,
    driver_signoff: null,
    created_at: new Date().toISOString()
  };
  await dbSaveContract(contract);
  return contract;
}

// ======================== DRIVERS (kierowcy) ========================

const DB_DRIVERS = [
  { id: 'd1', name: 'Marek Kowalski',      rating: 4.90, license: 'TX-2021-0042', experience: '5 lat', photo_emoji: '👨‍✈️' },
  { id: 'd2', name: 'Anna Nowak',          rating: 4.80, license: 'TX-2019-0128', experience: '7 lat', photo_emoji: '👩‍✈️' },
  { id: 'd3', name: 'Piotr Wiśniewski',    rating: 4.70, license: 'TX-2022-0056', experience: '3 lata', photo_emoji: '👨‍✈️' },
  { id: 'd4', name: 'Katarzyna Zielińska', rating: 4.95, license: 'TX-2018-0091', experience: '8 lat', photo_emoji: '👩‍✈️' }
];

const DB_VEHICLES = {
  'd1': { brand: 'Toyota',  model: 'Camry',    year: 2023, color: 'Srebrny',   plate: 'WA 12345' },
  'd2': { brand: 'Skoda',   model: 'Octavia',  year: 2022, color: 'Biały',     plate: 'WA 67890' },
  'd3': { brand: 'Honda',   model: 'Civic',    year: 2023, color: 'Czarny',    plate: 'WA 24680' },
  'd4': { brand: 'Mercedes',model: 'E-Class',  year: 2024, color: 'Granatowy', plate: 'WA 13579' }
};

async function dbGetDrivers() {
  if (DB_MODE === 'supabase') {
    const { data, error } = await supabase.from('drivers').select('*');
    if (error) return DB_DRIVERS;
    return data.length ? data : DB_DRIVERS;
  }
  return DB_DRIVERS;
}

async function dbGetRandomDriver() {
  const drivers = await dbGetDrivers();
  return drivers[Math.floor(Math.random() * drivers.length)];
}

function dbGetVehicleForDriver(driverId) {
  return DB_VEHICLES[driverId] || DB_VEHICLES['d1'];
}

// ======================== CATEGORIES (kategorie przejazdów) ========================

const DB_CATEGORIES = {
  mini:  { name: 'Mini',  icon: '🚗', description: 'Ekonomiczny przejazd miejski',           base_fare: 12, per_km: 1.5, seats: 3 },
  sedan: { name: 'Sedan', icon: '🚙', description: 'Komfortowa podróż służbowa',              base_fare: 18, per_km: 2.2, seats: 4 },
  suv:   { name: 'SUV',   icon: '🚐', description: 'Przestrzeń i bezpieczeństwo',             base_fare: 25, per_km: 3.0, seats: 6 }
};

const DB_DEFAULT_DISTANCE_KM = 8.5;

async function dbGetCategories() {
  if (DB_MODE === 'supabase') {
    const { data, error } = await supabase.from('categories').select('*');
    if (error) return DB_CATEGORIES;
    if (data.length) {
      const map = {};
      data.forEach(c => { map[c.key] = c; });
      return map;
    }
  }
  return DB_CATEGORIES;
}

async function dbGetFareEstimate(catKey) {
  const cats = await dbGetCategories();
  const cat = cats[catKey] || cats.sedan || DB_CATEGORIES.sedan;
  const total = Math.round((cat.base_fare + cat.per_km * DB_DEFAULT_DISTANCE_KM) * 100) / 100;
  return {
    category: cat.name,
    base:     cat.base_fare,
    perKm:    cat.per_km,
    distance: DB_DEFAULT_DISTANCE_KM,
    total
  };
}

// ======================== REFLECTION PROMPTS (prompty refleksyjne) ========================

const DB_PROMPTS = [
  { id: 'p1', text: 'Co sprawiło, że poczułeś/aś się bezpiecznie podczas tej podróży?', category: 'safety' },
  { id: 'p2', text: 'Czy coś Cię zaniepokoiło podczas przejazdu? Jeśli tak — co dokładnie?', category: 'safety' },
  { id: 'p3', text: 'Jak oceniasz komfort jazdy — czy było coś, co można poprawić?', category: 'comfort' },
  { id: 'p4', text: 'Czy trasa była optymalna? Czy kierowca jechał bezpiecznie?', category: 'route' },
  { id: 'p5', text: 'Czy pasażer zachowywał się odpowiednio? Czy coś wymagało Twojej szczególnej uwagi?', category: 'interaction' },
  { id: 'p6', text: 'Jakie warunki na drodze wpłynęły na tę podróż?', category: 'conditions' },
  { id: 'p7', text: 'Czego nowego dowiedziałeś/aś się podczas tej podróży?', category: 'learning' },
  { id: 'p8', text: 'Gdybyś mógł/mogła coś zmienić w tym przejeździe — co by to było?', category: 'improvement' }
];

async function dbGetPrompts() {
  if (DB_MODE === 'supabase') {
    const { data, error } = await supabase.from('reflection_prompts').select('*');
    if (error) return DB_PROMPTS;
    return data.length ? data : DB_PROMPTS;
  }
  return DB_PROMPTS;
}

async function dbGetRandomPrompts(count) {
  const prompts = await dbGetPrompts();
  const shuffled = [...prompts].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count || 3);
}

// ======================== SAFETY TIPS (porady bezpieczeństwa) ========================

const DB_SAFETY_TIPS = [
  'Zawsze sprawdzaj zgodność tablic rejestracyjnych z danymi w aplikacji przed wejściem do pojazdu.',
  'Podczas jazdy masz prawo poprosić kierowcę o dostosowanie temperatury i muzyki.',
  'W razie dyskomfortu możesz w każdej chwili poprosić o zatrzymanie w bezpiecznym miejscu.',
  'Zapamiętaj: numer rejestracyjny i nazwisko kierowcy są zawsze dostępne w zakładce "Profil kierowcy".',
  'Po zakończeniu przejazdu sprawdź Smart Kontrakt — to Twoje narzędzie do weryfikacji opłat.',
  'Refleksja po przejeździe (Dzienniczek "Zwierciadło") pomaga budować Twoje poczucie bezpieczeństwa na przyszłość.'
];

async function dbGetSafetyTips() {
  if (DB_MODE === 'supabase') {
    const { data, error } = await supabase.from('safety_tips').select('*');
    if (error) return DB_SAFETY_TIPS;
    return data.length ? data.map(t => t.text) : DB_SAFETY_TIPS;
  }
  return DB_SAFETY_TIPS;
}

async function dbGetRandomSafetyTip() {
  const tips = await dbGetSafetyTips();
  return tips[Math.floor(Math.random() * tips.length)];
}

// ======================== SYMULACJA ZDARZEŃ ========================

function dbSimulateTripEvents(rideId, tier, callback) {
  const events = [
    { type: 'trip_start',    delay: 0,    payload: { location: 'Punkt startowy' } },
    { type: 'route_update',  delay: 1.5,  payload: { km: 2.1, speed: '35 km/h' } },
    { type: 'route_update',  delay: 3,    payload: { km: 4.8, speed: '50 km/h' } },
    { type: 'stop',          delay: 4.5,  payload: { reason: 'Sygnalizacja świetlna', duration_s: 45 } },
    { type: 'route_update',  delay: 5.5,  payload: { km: 6.3, speed: '42 km/h' } },
    { type: 'route_update',  delay: 7,    payload: { km: 8.0, speed: '38 km/h' } },
    { type: 'trip_end',      delay: 8.5,  payload: { location: 'Cel podróży', total_km: 8.5 } }
  ];
  events.forEach(ev => {
    setTimeout(async () => {
      await dbAddRideEvent(rideId, ev.type, ev.payload, tier);
      if (callback) callback(ev);
    }, ev.delay * 1000);
  });
  return { totalDuration: 9, eventCount: events.length };
}

// ======================== EKSPORT MODUŁU ========================

console.log('[PilotZaufania] Database service loaded. Mode:', DB_MODE);

