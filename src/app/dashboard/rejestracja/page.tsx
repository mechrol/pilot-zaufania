"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import Script from "next/script";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
interface User {
  id: string;
  email: string;
  fullName?: string;
  role?: string;
}

// ---------------------------------------------------------------------------
// Baza miast (współrzędne geograficzne)
// ---------------------------------------------------------------------------
interface City {
  id: string;
  name: string;
  lat: number;
  lon: number;
  region: string;
}

const POLISH_CITIES: City[] = [
  { id: "waw", name: "Warszawa", lat: 52.2297, lon: 21.0122, region: "mazowieckie" },
  { id: "krk", name: "Kraków", lat: 50.0647, lon: 19.9450, region: "małopolskie" },
  { id: "gdn", name: "Gdańsk", lat: 54.3520, lon: 18.6466, region: "pomorskie" },
  { id: "wro", name: "Wrocław", lat: 51.1079, lon: 17.0385, region: "dolnośląskie" },
  { id: "poz", name: "Poznań", lat: 52.4064, lon: 16.9252, region: "wielkopolskie" },
  { id: "ldz", name: "Łódź", lat: 51.7592, lon: 19.4560, region: "łódzkie" },
  { id: "kat", name: "Katowice", lat: 50.2649, lon: 19.0238, region: "śląskie" },
  { id: "szc", name: "Szczecin", lat: 53.4285, lon: 14.5528, region: "zachodniopomorskie" },
  { id: "byd", name: "Bydgoszcz", lat: 53.1235, lon: 18.0084, region: "kujawsko-pomorskie" },
  { id: "lub", name: "Lublin", lat: 51.2465, lon: 22.5684, region: "lubelskie" },
  { id: "bia", name: "Białystok", lat: 53.1325, lon: 23.1688, region: "podlaskie" },
  { id: "rze", name: "Rzeszów", lat: 50.0412, lon: 21.9991, region: "podkarpackie" },
  { id: "tor", name: "Toruń", lat: 53.0138, lon: 18.5984, region: "kujawsko-pomorskie" },
  { id: "kie", name: "Kielce", lat: 50.8661, lon: 20.6286, region: "świętokrzyskie" },
  { id: "ols", name: "Olsztyn", lat: 53.7780, lon: 20.4942, region: "warmińsko-mazurskie" },
  { id: "opo", name: "Opole", lat: 50.6751, lon: 17.9213, region: "opolskie" },
  { id: "gdz", name: "Gdynia", lat: 54.5189, lon: 18.5305, region: "pomorskie" },
  { id: "czs", name: "Częstochowa", lat: 50.8110, lon: 19.1203, region: "śląskie" },
  { id: "rad", name: "Radom", lat: 51.4027, lon: 21.1471, region: "mazowieckie" },
  { id: "zak", name: "Zakopane", lat: 49.2992, lon: 19.9496, region: "małopolskie" },
];

// ---------------------------------------------------------------------------
// Mock kierowcy
// ---------------------------------------------------------------------------
interface DriverCard {
  id: string;
  fullName: string;
  rating: number;
  trustScore: number;
  yearsOfExperience: number;
  licenseCategories: string[];
  completedRides: number;
  avatar: string;
}

const MOCK_DRIVERS: DriverCard[] = [
  { id: "drv-1", fullName: "Jan Kowalski", rating: 4.9, trustScore: 95, yearsOfExperience: 12, licenseCategories: ["B", "C"], completedRides: 1247, avatar: "👨‍✈️" },
  { id: "drv-2", fullName: "Anna Nowak", rating: 4.7, trustScore: 88, yearsOfExperience: 8, licenseCategories: ["B"], completedRides: 856, avatar: "👩‍✈️" },
  { id: "drv-3", fullName: "Piotr Wiśniewski", rating: 4.5, trustScore: 72, yearsOfExperience: 5, licenseCategories: ["B", "BE"], completedRides: 412, avatar: "👨‍✈️" },
  { id: "drv-4", fullName: "Katarzyna Zielińska", rating: 4.8, trustScore: 91, yearsOfExperience: 15, licenseCategories: ["B", "C", "D"], completedRides: 2103, avatar: "👩‍✈️" },
  { id: "drv-5", fullName: "Michał Lewandowski", rating: 4.3, trustScore: 65, yearsOfExperience: 3, licenseCategories: ["B"], completedRides: 178, avatar: "👨‍✈️" },
];

// ---------------------------------------------------------------------------
// Mock pojazdy
// ---------------------------------------------------------------------------
interface VehicleCard {
  id: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  category: string;
  seats: number;
  plate: string;
  ratePerKm: number;
  emoji: string;
}

const MOCK_VEHICLES: VehicleCard[] = [
  { id: "veh-1", brand: "Toyota", model: "Corolla", year: 2022, color: "Srebrny", category: "sedan", seats: 5, plate: "WA 12345", ratePerKm: 1.20, emoji: "🚗" },
  { id: "veh-2", brand: "Skoda", model: "Octavia", year: 2023, color: "Biały", category: "sedan", seats: 5, plate: "KR 67890", ratePerKm: 1.30, emoji: "🚗" },
  { id: "veh-3", brand: "Volkswagen", model: "Passat", year: 2021, color: "Czarny", category: "sedan", seats: 5, plate: "GD 54321", ratePerKm: 1.50, emoji: "🚙" },
  { id: "veh-4", brand: "Mercedes", model: "Vito", year: 2022, color: "Szary", category: "van", seats: 8, plate: "PO 11223", ratePerKm: 1.80, emoji: "🚐" },
  { id: "veh-5", brand: "BMW", model: "X5", year: 2024, color: "Granatowy", category: "suv", seats: 5, plate: "WR 99887", ratePerKm: 2.20, emoji: "🚙" },
  { id: "veh-6", brand: "Toyota", model: "Aygo", year: 2023, color: "Czerwony", category: "mini", seats: 4, plate: "LU 44556", ratePerKm: 0.90, emoji: "🚗" },
];

// ---------------------------------------------------------------------------
// Haversine & route helpers
// ---------------------------------------------------------------------------
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface RouteWaypoint { lat: number; lon: number; label: string; roadType: string; speedLimit: number; }

function generateRouteWaypoints(from: City, to: City): RouteWaypoint[] {
  const dist = haversineKm(from.lat, from.lon, to.lat, to.lon);
  const steps = Math.max(4, Math.round(dist / 50));
  const waypoints: RouteWaypoint[] = [];

  for (let i = 0; i <= steps; i++) {
    const frac = i / steps;
    const lat = from.lat + (to.lat - from.lat) * frac + (Math.random() - 0.5) * 0.05;
    const lon = from.lon + (to.lon - from.lon) * frac + (Math.random() - 0.5) * 0.05;
    const label = i === 0 ? from.name : i === steps ? to.name : `Punkt ${i}`;
    let roadType: string;
    let speedLimit: number;

    if (i < steps * 0.15 || i > steps * 0.85) {
      roadType = "built_up";
      speedLimit = 50;
    } else if (i > steps * 0.3 && i < steps * 0.7 && dist > 200) {
      roadType = "motorway";
      speedLimit = 140;
    } else if (dist > 100) {
      roadType = "non_built_up";
      speedLimit = 90;
    } else {
      roadType = "non_built_up";
      speedLimit = 70;
    }

    waypoints.push({ lat, lon, label, roadType, speedLimit });
  }
  return waypoints;
}

function computeRouteParams(waypoints: RouteWaypoint[], vehicleRate: number) {
  let totalDist = 0;
  let totalTimeMin = 0;
  const segments: { from: string; to: string; distKm: number; timeMin: number; avgSpeed: number }[] = [];

  for (let i = 1; i < waypoints.length; i++) {
    const prev = waypoints[i - 1]!;
    const curr = waypoints[i]!;
    const segDist = haversineKm(prev.lat, prev.lon, curr.lat, curr.lon);
    const avgSpeed = curr.speedLimit * 0.75;
    const segTime = (segDist / avgSpeed) * 60;
    totalDist += segDist;
    totalTimeMin += segTime;
    segments.push({ from: prev.label, to: curr.label, distKm: segDist, timeMin: segTime, avgSpeed });
  }

  const avgSpeedKmh = totalDist / (totalTimeMin / 60);
  const baseCost = totalDist * vehicleRate;
  const surcharge = totalDist > 200 ? baseCost * 0.1 : 0;
  const totalCost = baseCost + surcharge;

  // SB/SP parameters
  const sbSpParams = {
    estimatedSpeedKmh: Math.round(avgSpeedKmh),
    routeDistanceKm: Math.round(totalDist * 10) / 10,
    estimatedTimeMin: Math.round(totalTimeMin),
    roadTypeDistribution: computeRoadDistribution(waypoints),
    riskBase: computeBaseRisk(totalDist, avgSpeedKmh),
    recommendedTier: totalDist > 200 ? "T3" : totalDist > 100 ? "T2" : "T1",
  };

  return { totalDistKm: totalDist, totalTimeMin, avgSpeedKmh, baseCost, surcharge, totalCost, segments, sbSpParams };
}

function computeRoadDistribution(waypoints: RouteWaypoint[]): Record<string, number> {
  const dist: Record<string, number> = {};
  for (const wp of waypoints) {
    dist[wp.roadType] = (dist[wp.roadType] ?? 0) + 1;
  }
  const total = waypoints.length;
  const pct: Record<string, number> = {};
  for (const [k, v] of Object.entries(dist)) {
    pct[k] = Math.round((v / total) * 100);
  }
  return pct;
}

function computeBaseRisk(distKm: number, avgSpeed: number): number {
  let risk = 10;
  if (distKm > 300) risk += 15;
  else if (distKm > 150) risk += 10;
  else if (distKm > 50) risk += 5;
  if (avgSpeed > 110) risk += 20;
  else if (avgSpeed > 80) risk += 10;
  return Math.min(100, risk);
}

// ---------------------------------------------------------------------------
// Główny komponent
// ---------------------------------------------------------------------------
type WizardStep = "route" | "driver" | "vehicle" | "summary";

export default function RejestracjaPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<WizardStep>("route");

  // Route
  const [fromCity, setFromCity] = useState<City | null>(null);
  const [toCity, setToCity] = useState<City | null>(null);
  const [waypoints, setWaypoints] = useState<RouteWaypoint[]>([]);
  const [routeParams, setRouteParams] = useState<ReturnType<typeof computeRouteParams> | null>(null);
  const [fromSearch, setFromSearch] = useState("");
  const [toSearch, setToSearch] = useState("");

  // Driver
  const [selectedDriver, setSelectedDriver] = useState<DriverCard | null>(null);

  // Vehicle
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleCard | null>(null);

  // Map
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Auth
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const userStr = localStorage.getItem("auth_user");
    if (!token || !userStr) { window.location.href = "/"; return; }
    try { setUser(JSON.parse(userStr)); } catch { window.location.href = "/"; return; }
    setLoading(false);
  }, []);

  // Load Leaflet CSS
  useEffect(() => {
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    if (typeof window !== "undefined" && !(window as any).L) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => setLeafletLoaded(true);
      document.head.appendChild(script);
    } else if ((window as any).L) {
      setLeafletLoaded(true);
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const map = L.map(mapRef.current).setView([52.0, 19.0], 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);
    mapInstanceRef.current = map;
    setTimeout(() => map.invalidateSize(), 100);
    setMapReady(true);
  }, [leafletLoaded]);

  // Update map with route
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || waypoints.length === 0) return;
    const L = (window as any).L;
    const map = mapInstanceRef.current;

    // Clear previous layers
    map.eachLayer((layer: any) => {
      if (layer instanceof L.TileLayer) return;
      map.removeLayer(layer);
    });

    // Markers
    const fromIcon = L.divIcon({ html: '<div style="background:#22c55e;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.5)"></div>', iconSize: [20, 20], iconAnchor: [10, 10] });
    const toIcon = L.divIcon({ html: '<div style="background:#ef4444;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.5)"></div>', iconSize: [20, 20], iconAnchor: [10, 10] });
    const wpIcon = L.divIcon({ html: '<div style="background:#3b82f6;width:10px;height:10px;border-radius:50%;border:2px solid white"></div>', iconSize: [10, 10], iconAnchor: [5, 5] });

    const first = waypoints[0]!;
    const last = waypoints[waypoints.length - 1]!;

    L.marker([first.lat, first.lon], { icon: fromIcon }).addTo(map).bindPopup(`<b>Start:</b> ${first.label}`);
    L.marker([last.lat, last.lon], { icon: toIcon }).addTo(map).bindPopup(`<b>Cel:</b> ${last.label}`);

    // Waypoints
    for (let i = 1; i < waypoints.length - 1; i++) {
      const wp = waypoints[i]!;
      L.marker([wp.lat, wp.lon], { icon: wpIcon }).addTo(map).bindPopup(`${wp.label}<br>${wp.roadType} · ${wp.speedLimit} km/h`);
    }

    // Polyline
    const coords = waypoints.map((wp) => [wp.lat, wp.lon]);
    const polyline = L.polyline(coords, { color: "#f59e0b", weight: 3, dashArray: "8 4", opacity: 0.8 }).addTo(map);

    const bounds = L.latLngBounds(coords);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [mapReady, waypoints]);

  // Compute route
  function computeRoute() {
    if (!fromCity || !toCity) return;
    const wps = generateRouteWaypoints(fromCity, toCity);
    setWaypoints(wps);
    const vehicleRate = selectedVehicle?.ratePerKm ?? 1.5;
    const params = computeRouteParams(wps, vehicleRate);
    setRouteParams(params);
    setStep("driver");
  }

  // Next steps
  function goToStep(s: WizardStep) { setStep(s); }

  // Filtered cities for search
  const filteredFrom = fromSearch.length > 0 ? POLISH_CITIES.filter((c) => c.name.toLowerCase().includes(fromSearch.toLowerCase())) : POLISH_CITIES.slice(0, 8);
  const filteredTo = toSearch.length > 0 ? POLISH_CITIES.filter((c) => c.name.toLowerCase().includes(toSearch.toLowerCase())) : POLISH_CITIES.slice(0, 8);

  // Category labels
  const catLabels: Record<string, string> = { mini: "Mini", sedan: "Sedan", suv: "SUV", van: "Van", luxury: "Luksus" };
  const roadLabels: Record<string, string> = { built_up: "Zabudowany", non_built_up: "Niezabudowany", motorway: "Autostrada" };
  const roadIcons: Record<string, string> = { built_up: "🏘️", non_built_up: "🛣️", motorway: "🏎️" };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* ---------- header ---------- */}
      <header className="border-b border-border bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-zinc-400 hover:text-amber-400 transition mr-2">← Powrót</Link>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-zinc-900 text-xl font-bold">P</div>
            <span className="text-lg font-semibold tracking-tight">Pilot Zaufania</span>
          </div>
          <nav className="flex items-center gap-6">
            <span className="text-sm text-zinc-400">{user.fullName || user.email}</span>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Rejestracja podróży</h1>
          <p className="mt-2 text-zinc-400">Wybierz trasę, kierowcę i pojazd — system obliczy wszystkie parametry SB/SP.</p>
        </div>

        {/* ---------- wizard steps ---------- */}
        <div className="flex items-center gap-2 mb-10">
          {(["route", "driver", "vehicle", "summary"] as WizardStep[]).map((s, i) => {
            const labels = ["Trasa", "Kierowca", "Pojazd", "Podsumowanie"];
            const icons = ["📍", "👤", "🚗", "✅"];
            const isActive = step === s;
            const isDone = (["route", "driver", "vehicle", "summary"].indexOf(step) > i);
            return (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                    isActive ? "bg-amber-500 text-zinc-900" : isDone ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  <span>{icons[i]}</span>
                  <span className="hidden sm:inline">{labels[i]}</span>
                </div>
                {i < 3 && <div className={`w-6 h-0.5 ${isDone ? "bg-emerald-500/50" : "bg-zinc-700"}`} />}
              </div>
            );
          })}
        </div>

        {/* ============================ STEP 1: ROUTE ============================ */}
        {step === "route" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* City selectors */}
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-2xl border border-border bg-zinc-900/50 p-6">
                <h2 className="text-lg font-semibold mb-4">Wybierz trasę</h2>

                <div className="space-y-4">
                  {/* From */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">Skąd (odbiór)</label>
                    <input
                      type="text"
                      value={fromSearch}
                      onChange={(e) => setFromSearch(e.target.value)}
                      placeholder="Wpisz miasto..."
                      className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition mb-2"
                    />
                    <div className="grid grid-cols-2 gap-1 max-h-[200px] overflow-y-auto">
                      {filteredFrom.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => { setFromCity(c); setFromSearch(c.name); }}
                          className={`text-left px-3 py-2 rounded-lg text-xs transition ${
                            fromCity?.id === c.id ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "hover:bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          📍 {c.name}
                          <span className="block text-[10px] text-zinc-600">{c.region}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* To */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">Dokąd (cel)</label>
                    <input
                      type="text"
                      value={toSearch}
                      onChange={(e) => setToSearch(e.target.value)}
                      placeholder="Wpisz miasto..."
                      className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition mb-2"
                    />
                    <div className="grid grid-cols-2 gap-1 max-h-[200px] overflow-y-auto">
                      {filteredTo.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => { setToCity(c); setToSearch(c.name); }}
                          className={`text-left px-3 py-2 rounded-lg text-xs transition ${
                            toCity?.id === c.id ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "hover:bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          📍 {c.name}
                          <span className="block text-[10px] text-zinc-600">{c.region}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick route */}
                  {fromCity && toCity && fromCity.id !== toCity.id && (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm">
                      <p className="text-amber-400 font-medium mb-1">Wybrana trasa</p>
                      <p className="text-zinc-300">
                        <span className="text-emerald-400">●</span> {fromCity.name}
                        <span className="mx-2 text-zinc-600">→</span>
                        <span className="text-red-400">●</span> {toCity.name}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Odległość w linii prostej: ~{Math.round(haversineKm(fromCity.lat, fromCity.lon, toCity.lat, toCity.lon))} km
                      </p>
                    </div>
                  )}

                  <button
                    onClick={computeRoute}
                    disabled={!fromCity || !toCity || fromCity.id === toCity.id}
                    className="w-full rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition active:scale-[0.98]"
                  >
                    🚀 Oblicz trasę i przejdź dalej
                  </button>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="lg:col-span-3">
              <div className="rounded-2xl border border-border overflow-hidden bg-zinc-900/50" style={{ minHeight: "500px" }}>
                <div ref={mapRef} className="w-full h-full" style={{ minHeight: "500px" }} />
                {!leafletLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 rounded-2xl z-10">
                    <div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full" />
                  </div>
                )}
              </div>
              <p className="text-xs text-zinc-600 mt-2 text-center">
                Mapa OpenStreetMap — kliknij miasta powyżej, aby wyznaczyć trasę
              </p>
            </div>
          </div>
        )}

        {/* ============================ STEP 2: DRIVER ============================ */}
        {step === "driver" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
              <div className="rounded-2xl border border-border bg-zinc-900/50 p-6 mb-4">
                <h2 className="text-lg font-semibold mb-1">Wybierz kierowcę</h2>
                <p className="text-xs text-zinc-500 mb-6">Kliknij kierowcę, aby go wybrać.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {MOCK_DRIVERS.map((drv) => (
                    <button
                      key={drv.id}
                      onClick={() => setSelectedDriver(drv)}
                      className={`text-left rounded-xl border p-4 transition-all ${
                        selectedDriver?.id === drv.id
                          ? "border-amber-500/50 bg-amber-500/10"
                          : "border-border bg-zinc-800/50 hover:border-zinc-600"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{drv.avatar}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm">{drv.fullName}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-amber-400 text-xs">★ {drv.rating}</span>
                            <span className="text-zinc-600">·</span>
                            <span className={`text-xs font-medium ${drv.trustScore >= 80 ? "text-emerald-400" : drv.trustScore >= 60 ? "text-amber-400" : "text-red-400"}`}>
                              Zaufanie: {drv.trustScore}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {drv.licenseCategories.map((cat) => (
                              <span key={cat} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-400">{cat}</span>
                            ))}
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-[11px] text-zinc-500">
                            <span>🕐 {drv.yearsOfExperience} lat</span>
                            <span>🚗 {drv.completedRides} przejazdów</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep("route")} className="rounded-xl border border-border px-5 py-2.5 text-sm text-zinc-300 hover:border-zinc-600 transition">
                  ← Wróć do trasy
                </button>
                <button
                  onClick={() => setStep("vehicle")}
                  disabled={!selectedDriver}
                  className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition active:scale-[0.98]"
                >
                  Dalej: Wybór pojazdu →
                </button>
              </div>
            </div>

            {/* Route preview on the side */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
                <h3 className="text-sm font-semibold text-emerald-400 mb-3">Wybrana trasa</h3>
                <p className="text-zinc-300 text-sm">
                  <span className="text-emerald-400">●</span> {fromCity?.name}
                  <span className="mx-2 text-zinc-600">→</span>
                  <span className="text-red-400">●</span> {toCity?.name}
                </p>
                {routeParams && (
                  <div className="mt-3 space-y-1.5 text-xs text-zinc-400">
                    <div className="flex justify-between"><span>Dystans:</span><span className="font-mono text-zinc-300">{routeParams.totalDistKm.toFixed(1)} km</span></div>
                    <div className="flex justify-between"><span>Szac. czas:</span><span className="font-mono text-zinc-300">{Math.round(routeParams.totalTimeMin)} min</span></div>
                    <div className="flex justify-between"><span>Śr. prędkość:</span><span className="font-mono text-zinc-300">{Math.round(routeParams.avgSpeedKmh)} km/h</span></div>
                    <div className="flex justify-between"><span>Tier:</span><span className="font-mono text-amber-400">{routeParams.sbSpParams.recommendedTier}</span></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================ STEP 3: VEHICLE ============================ */}
        {step === "vehicle" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
              <div className="rounded-2xl border border-border bg-zinc-900/50 p-6 mb-4">
                <h2 className="text-lg font-semibold mb-1">Wybierz pojazd</h2>
                <p className="text-xs text-zinc-500 mb-6">Kliknij pojazd, aby go wybrać.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {MOCK_VEHICLES.map((veh) => (
                    <button
                      key={veh.id}
                      onClick={() => setSelectedVehicle(veh)}
                      className={`text-left rounded-xl border p-4 transition-all ${
                        selectedVehicle?.id === veh.id
                          ? "border-amber-500/50 bg-amber-500/10"
                          : "border-border bg-zinc-800/50 hover:border-zinc-600"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{veh.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm">{veh.brand} {veh.model}</div>
                          <div className="text-xs text-zinc-500 mt-0.5">{veh.year} · {veh.color} · {veh.plate}</div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              {catLabels[veh.category] ?? veh.category}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-400">
                              {veh.seats} miejsc
                            </span>
                          </div>
                          <div className="text-xs text-amber-400 mt-2 font-mono">
                            {veh.ratePerKm.toFixed(2)} zł/km
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep("driver")} className="rounded-xl border border-border px-5 py-2.5 text-sm text-zinc-300 hover:border-zinc-600 transition">
                  ← Wróć do kierowcy
                </button>
                <button
                  onClick={() => {
                    if (selectedVehicle && routeParams) {
                      const newParams = computeRouteParams(waypoints, selectedVehicle.ratePerKm);
                      setRouteParams(newParams);
                    }
                    setStep("summary");
                  }}
                  disabled={!selectedVehicle}
                  className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition active:scale-[0.98]"
                >
                  Dalej: Podsumowanie →
                </button>
              </div>
            </div>

            {/* Driver recap */}
            <div className="lg:col-span-2">
              {selectedDriver && (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 mb-4">
                  <h3 className="text-sm font-semibold text-amber-400 mb-3">Wybrany kierowca</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{selectedDriver.avatar}</span>
                    <div>
                      <div className="font-semibold text-sm">{selectedDriver.fullName}</div>
                      <div className="text-xs text-zinc-400">★ {selectedDriver.rating} · Zaufanie: {selectedDriver.trustScore}</div>
                    </div>
                  </div>
                </div>
              )}
              {routeParams && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
                  <h3 className="text-sm font-semibold text-emerald-400 mb-3">Parametry trasy</h3>
                  <div className="space-y-1.5 text-xs text-zinc-400">
                    <div className="flex justify-between"><span>Dystans:</span><span className="font-mono text-zinc-300">{routeParams.totalDistKm.toFixed(1)} km</span></div>
                    <div className="flex justify-between"><span>Szac. czas:</span><span className="font-mono text-zinc-300">{Math.round(routeParams.totalTimeMin)} min</span></div>
                    <div className="flex justify-between"><span>Koszt bazowy:</span><span className="font-mono text-amber-400">{routeParams.baseCost.toFixed(2)} zł</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================ STEP 4: SUMMARY ============================ */}
        {step === "summary" && routeParams && fromCity && toCity && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
              {/* Route map */}
              <div className="lg:col-span-2">
                <div className="rounded-2xl border border-border bg-zinc-900/50 p-6">
                  <h2 className="text-lg font-semibold mb-4">🗺️ Mapa trasy</h2>
                  <div ref={mapRef} className="w-full rounded-xl overflow-hidden" style={{ minHeight: "350px" }}>
                    {!leafletLoaded && (
                      <div className="flex items-center justify-center h-[350px] bg-zinc-950/80">
                        <div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full" />
                      </div>
                    )}
                  </div>

                  {/* Google Maps link */}
                  <a
                    href={`https://www.google.com/maps/dir/${encodeURIComponent(fromCity.name + ", Polska")}/${encodeURIComponent(toCity.name + ", Polska")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-3 text-xs text-blue-400 hover:text-blue-300 transition"
                  >
                    🗺️ Otwórz w Google Maps
                  </a>
                </div>
              </div>

              {/* Trip card */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent p-6">
                  <h2 className="text-lg font-semibold mb-4">✅ Podsumowanie przejazdu</h2>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-border/50">
                      <span className="text-zinc-400">Trasa</span>
                      <span className="font-medium">{fromCity.name} → {toCity.name}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border/50">
                      <span className="text-zinc-400">Dystans</span>
                      <span className="font-mono font-medium">{routeParams.totalDistKm.toFixed(1)} km</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border/50">
                      <span className="text-zinc-400">Szac. czas</span>
                      <span className="font-mono font-medium">{Math.round(routeParams.totalTimeMin)} min</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border/50">
                      <span className="text-zinc-400">Śr. prędkość</span>
                      <span className="font-mono font-medium">{Math.round(routeParams.avgSpeedKmh)} km/h</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border/50">
                      <span className="text-zinc-400">Kierowca</span>
                      <span className="font-medium">{selectedDriver?.fullName ?? "—"}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border/50">
                      <span className="text-zinc-400">Pojazd</span>
                      <span className="font-medium">{selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : "—"}</span>
                    </div>
                    <div className="flex justify-between py-3">
                      <span className="font-semibold">Szac. koszt</span>
                      <span className="text-xl font-bold text-amber-400">{routeParams.totalCost.toFixed(2)} zł</span>
                    </div>
                  </div>

                  <button className="w-full mt-4 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition active:scale-[0.98]">
                    ✅ Zarejestruj przejazd
                  </button>
                </div>
              </div>
            </div>

            {/* SB/SP Parameters */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
              <div className="rounded-2xl border border-border bg-zinc-900/50 p-6">
                <h3 className="text-sm font-semibold mb-3">📊 Rozkład typów dróg</h3>
                <div className="space-y-2">
                  {Object.entries(routeParams.sbSpParams.roadTypeDistribution).map(([type, pct]) => (
                    <div key={type} className="flex items-center gap-2">
                      <span className="text-sm w-5">{roadIcons[type] ?? "🛣️"}</span>
                      <span className="text-xs text-zinc-400 w-24">{roadLabels[type] ?? type}</span>
                      <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
                        <div className="h-full rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-mono text-zinc-500 w-8 text-right">{pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-zinc-900/50 p-6">
                <h3 className="text-sm font-semibold mb-3">⚙️ Parametry SB/SP</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1.5 border-b border-border/50">
                    <span className="text-zinc-400">Rekomendowany tier</span>
                    <span className="font-mono text-amber-400 font-semibold">{routeParams.sbSpParams.recommendedTier}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/50">
                    <span className="text-zinc-400">Ryzyko bazowe</span>
                    <span className={`font-mono ${routeParams.sbSpParams.riskBase >= 30 ? "text-red-400" : routeParams.sbSpParams.riskBase >= 20 ? "text-amber-400" : "text-emerald-400"}`}>
                      {routeParams.sbSpParams.riskBase}/100
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/50">
                    <span className="text-zinc-400">Śr. prędkość</span>
                    <span className="font-mono">{routeParams.sbSpParams.estimatedSpeedKmh} km/h</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-zinc-400">Dystans</span>
                    <span className="font-mono">{routeParams.sbSpParams.routeDistanceKm} km</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-zinc-900/50 p-6">
                <h3 className="text-sm font-semibold mb-3">💰 Kalkulacja kosztów</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1.5 border-b border-border/50">
                    <span className="text-zinc-400">Koszt bazowy</span>
                    <span className="font-mono">{routeParams.baseCost.toFixed(2)} zł</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/50">
                    <span className="text-zinc-400">Stawka</span>
                    <span className="font-mono text-zinc-500">{selectedVehicle?.ratePerKm.toFixed(2) ?? "—"} zł/km</span>
                  </div>
                  {routeParams.surcharge > 0 && (
                    <div className="flex justify-between py-1.5 border-b border-border/50">
                      <span className="text-zinc-400">Dopłata (długa trasa)</span>
                      <span className="font-mono text-amber-400">+{routeParams.surcharge.toFixed(2)} zł</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1.5 font-semibold">
                    <span>Razem</span>
                    <span className="text-amber-400">{routeParams.totalCost.toFixed(2)} zł</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button onClick={() => setStep("vehicle")} className="rounded-xl border border-border px-5 py-2.5 text-sm text-zinc-300 hover:border-zinc-600 transition">
                ← Wróć do pojazdu
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
