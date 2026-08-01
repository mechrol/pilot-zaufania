/**
 * Pilot Zaufania — Data Layer
 * Ride ID generation, localStorage CRUD, shared state management.
 */

const APP_KEY = 'pilot_zaufania';

// --- UUID generator ---
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// --- localStorage helpers ---
function loadData(key) {
  try {
    const raw = localStorage.getItem(`${APP_KEY}_${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveData(key, data) {
  localStorage.setItem(`${APP_KEY}_${key}`, JSON.stringify(data));
}

function removeData(key) {
  localStorage.removeItem(`${APP_KEY}_${key}`);
}

// --- Rides ---
function getRides()          { return loadData('rides') || []; }
function getRideById(id)     { return getRides().find(r => r.ride_id === id); }
function saveRide(ride) {
  const rides = getRides();
  const idx = rides.findIndex(r => r.ride_id === ride.ride_id);
  if (idx >= 0) rides[idx] = ride; else rides.push(ride);
  saveData('rides', rides);
}

function createRide(pickup, dropoff, category) {
  const ride = {
    ride_id: generateUUID(),
    pickup, dropoff, category,
    status: 'booked',
    created_at: new Date().toISOString(),
    started_at: null,
    completed_at: null,
    driver: getRandomDriver(),
    vehicle: null,
    fare_estimate: getFareEstimate(category),
    fare_final: null,
    events: [],
    tier: 'T1'
  };
  ride.vehicle = getVehicleForDriver(ride.driver.id);
  return ride;
}

const DRIVERS = [
  { id: 'd1', name: 'Marek Kowalski', rating: 4.9, photo: '\u{1F468}\u200D\u2708\uFE0F', license: 'TX-2021-0042', experience: '5 lat' },
  { id: 'd2', name: 'Anna Nowak', rating: 4.8, photo: '\u{1F469}\u200D\u2708\uFE0F', license: 'TX-2019-0128', experience: '7 lat' },
  { id: 'd3', name: 'Piotr Wi\u015Bniewski', rating: 4.7, photo: '\u{1F468}\u200D\u2708\uFE0F', license: 'TX-2022-0056', experience: '3 lata' },
  { id: 'd4', name: 'Katarzyna Zieli\u0144ska', rating: 4.95, photo: '\u{1F469}\u200D\u2708\uFE0F', license: 'TX-2018-0091', experience: '8 lat' }
];

function getRandomDriver() { return DRIVERS[Math.floor(Math.random() * DRIVERS.length)]; }

function getVehicleForDriver(driverId) {
  const v = {
    'd1': { brand: 'Toyota', model: 'Camry', year: 2023, color: 'Srebrny', plate: 'WA 12345' },
    'd2': { brand: 'Skoda', model: 'Octavia', year: 2022, color: 'Bia\u0142y', plate: 'WA 67890' },
    'd3': { brand: 'Honda', model: 'Civic', year: 2023, color: 'Czarny', plate: 'WA 24680' },
    'd4': { brand: 'Mercedes', model: 'E-Class', year: 2024, color: 'Granatowy', plate: 'WA 13579' }
  };
  return v[driverId] || v['d1'];
}

const CATEGORIES = {
  mini:  { name: 'Mini',  icon: '\u{1F697}', desc: 'Ekonomiczny przejazd miejski', baseFare: 12, perKm: 1.5, seats: 3 },
  sedan: { name: 'Sedan', icon: '\u{1F699}', desc: 'Komfortowa podr\u00F3\u017C s\u0142u\u017Cbowa', baseFare: 18, perKm: 2.2, seats: 4 },
  suv:   { name: 'SUV',   icon: '\u{1F690}', desc: 'Przestrze\u0144 i bezpiecze\u0144stwo', baseFare: 25, perKm: 3.0, seats: 6 }
};

const DEFAULT_DISTANCE_KM = 8.5;

function getFareEstimate(catKey) {
  const cat = CATEGORIES[catKey] || CATEGORIES.sedan;
  const total = Math.round((cat.baseFare + cat.perKm * DEFAULT_DISTANCE_KM) * 100) / 100;
  return { category: cat.name, base: cat.baseFare, perKm: cat.perKm, distance: DEFAULT_DISTANCE_KM, total };
}

// --- Journal entries (Module 2) ---
function getJournalEntries(rideId) {
  const all = loadData('journal') || [];
  return rideId ? all.filter(e => e.ride_id === rideId) : all;
}
function saveJournalEntry(entry) {
  const all = loadData('journal') || [];
  all.push(entry);
  saveData('journal', all);
}
function getUserJournal() {
  return (loadData('journal') || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

// --- Events (Module 3) ---
function getEventsByRide(rideId) {
  const all = loadData('events') || [];
  return all.filter(e => e.ride_id === rideId).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}
function saveEvent(event) {
  const all = loadData('events') || [];
  all.push(event);
  saveData('events', all);
}
function addRideEvent(rideId, eventType, payload, tier) {
  const event = {
    event_id: generateUUID(),
    ride_id: rideId,
    source_tier: tier || 'T1',
    event_type: eventType,
    timestamp: new Date().toISOString(),
    geolocation: (payload && payload.lat) ? { lat: payload.lat, lng: payload.lng } : null,
    payload: payload || {},
    evidence_ref: null,
    integrity_hash: simpleHash(JSON.stringify({ rideId, eventType, ts: Date.now() }))
  };
  saveEvent(event);
  const ride = getRideById(rideId);
  if (ride) {
    ride.events = ride.events || [];
    ride.events.push(event);
    saveRide(ride);
  }
  return event;
}

// --- Smart Contract (Module 4) ---
function getContracts() { return loadData('contracts') || []; }
function getContractByRide(rideId) { return getContracts().find(c => c.ride_id === rideId); }
function saveContract(contract) {
  const all = getContracts();
  const idx = all.findIndex(c => c.ride_id === contract.ride_id);
  if (idx >= 0) all[idx] = contract; else all.push(contract);
  saveData('contracts', all);
}

function createContract(rideId, ride) {
  const events = getEventsByRide(rideId);
  return {
    contract_id: generateUUID(),
    ride_id: rideId,
    passenger_profile_snapshot: { name: 'Janusz Krawczak', role: 'passenger', joined: '2026-01-15' },
    driver_profile_snapshot: { name: ride.driver.name, license: ride.driver.license, experience: ride.driver.experience, rating: ride.driver.rating },
    vehicle_profile_snapshot: ride.vehicle,
    environment_snapshot: null,
    event_refs: events.map(e => e.event_id),
    cost_breakdown: {
      category: ride.fare_estimate.category,
      base_fare: ride.fare_estimate.base,
      distance_km: ride.fare_estimate.distance,
      per_km_rate: ride.fare_estimate.perKm,
      distance_charge: Math.round(ride.fare_estimate.perKm * ride.fare_estimate.distance * 100) / 100,
      events_surcharge: 0,
      total: ride.fare_estimate.total
    },
    status: 'draft',
    passenger_signoff: null,
    driver_signoff: null,
    created_at: new Date().toISOString()
  };
}

// --- Simple hash ---
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return 'h' + Math.abs(hash).toString(16).padStart(8, '0');
}

// --- Reflection prompts (Module 2) ---
const REFLECTION_PROMPTS = [
  { id: 'p1', text: 'Co sprawi\u0142o, \u017Ce poczu\u0142e\u015B/a\u015B si\u0119 bezpiecznie podczas tej podr\u00F3\u017Cy?', category: 'safety' },
  { id: 'p2', text: 'Czy co\u015B Ci\u0119 zaniepokoi\u0142o podczas przejazdu? Je\u015Bli tak \u2014 co dok\u0142adnie?', category: 'safety' },
  { id: 'p3', text: 'Jak oceniasz komfort jazdy \u2014 czy by\u0142o co\u015B, co mo\u017Cna poprawi\u0107?', category: 'comfort' },
  { id: 'p4', text: 'Czy trasa by\u0142a optymalna? Czy kierowca jecha\u0142 bezpiecznie?', category: 'route' },
  { id: 'p5', text: 'Czy pasa\u017Cer zachowywa\u0142 si\u0119 odpowiednio? Czy co\u015B wymaga\u0142o Twojej szczeg\u00F3lnej uwagi?', category: 'interaction' },
  { id: 'p6', text: 'Jakie warunki na drodze wp\u0142yn\u0119\u0142y na t\u0119 podr\u00F3\u017C?', category: 'conditions' },
  { id: 'p7', text: 'Czego nowego dowiedzia\u0142e\u015B/a\u015B si\u0119 podczas tej podr\u00F3\u017Cy?', category: 'learning' },
  { id: 'p8', text: 'Gdyby\u015B m\u00F3g\u0142/mog\u0142a co\u015B zmieni\u0107 w tym przeje\u017Adzie \u2014 co by to by\u0142o?', category: 'improvement' }
];

function getRandomPrompts(count) {
  const shuffled = [...REFLECTION_PROMPTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count || 3);
}

const SAFETY_TIPS = [
  'Zawsze sprawdzaj zgodno\u015B\u0107 tablic rejestracyjnych z danymi w aplikacji przed wej\u015Bciem do pojazdu.',
  'Podczas jazdy masz prawo poprosi\u0107 kierowc\u0119 o dostosowanie temperatury i muzyki.',
  'W razie dyskomfortu mo\u017Cesz w ka\u017Cdej chwili poprosi\u0107 o zatrzymanie w bezpiecznym miejscu.',
  'Zapami\u0119taj: numer rejestracyjny i nazwisko kierowcy s\u0105 zawsze dost\u0119pne w zak\u0142adce "Profil kierowcy".',
  'Po zako\u0144czeniu przejazdu sprawd\u017A Smart Kontrakt \u2014 to Twoje narz\u0119dzie do weryfikacji op\u0142at.',
  'Refleksja po przeje\u017Adzie (Dzienniczek "Zwierciad\u0142o") pomaga budowa\u0107 Twoje poczucie bezpiecze\u0144stwa na przysz\u0142o\u015B\u0107.'
];

function getRandomSafetyTip() {
  return SAFETY_TIPS[Math.floor(Math.random() * SAFETY_TIPS.length)];
}

// --- Simulated trip events (Module 3) ---
function simulateTripEvents(rideId, tier, callback) {
  const evts = [
    { type: 'trip_start',    delay: 0,    payload: { location: 'Punkt startowy' } },
    { type: 'route_update',  delay: 1.5,  payload: { km: 2.1, speed: '35 km/h' } },
    { type: 'route_update',  delay: 3,    payload: { km: 4.8, speed: '50 km/h' } },
    { type: 'stop',          delay: 4.5,  payload: { reason: 'Sygnalizacja \u015Bwietlna', duration_s: 45 } },
    { type: 'route_update',  delay: 5.5,  payload: { km: 6.3, speed: '42 km/h' } },
    { type: 'route_update',  delay: 7,    payload: { km: 8.0, speed: '38 km/h' } },
    { type: 'trip_end',      delay: 8.5,  payload: { location: 'Cel podr\u00F3\u017Cy', total_km: 8.5 } }
  ];
  evts.forEach(ev => {
    setTimeout(() => {
      addRideEvent(rideId, ev.type, ev.payload, tier);
      if (callback) callback(ev);
    }, ev.delay * 1000);
  });
  return { totalDuration: 9, eventCount: evts.length };
}
