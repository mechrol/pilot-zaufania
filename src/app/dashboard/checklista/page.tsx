"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  createSB_SP_Context,
  processSB_SP_Event,
  createEmptyCognitiveTrack,
  updateGPS,
  updateEnvironment,
  createEmptyDecisionTrack,
  updateSpeed,
  updateObjectDistance,
  updateReactionTime,
  recordSignReaction,
  recordManeuver,
  toRenderData,
  generateChartFromEvents,
} from "@/sb-sp";
import type { SB_SP_Context, SB_SP_Event, SB_SP_Input } from "@/sb-sp";
import type { RoadType } from "@/types/road-code";
import { SPEED_LIMITS_PL } from "@/types/road-code";
import type { ChartRenderData } from "@/sb-sp/bubble-visualizer";
import {
  TRIP_FACTORS,
  getCriticalFactors,
  getFactorsForRole,
  getFactorsByCategory,
  createEmptyChecklist,
} from "@/checklist/trip-factors-defs";
import type { ChecklistItem, ChecklistEntry, TripChecklist, ChecklistCategory } from "@/checklist/trip-factors";

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
// Mapa czynników checklisty → wpływ na kategorie ryzyka SB/SP
// ---------------------------------------------------------------------------
interface FactorRiskMap {
  factorId: string;
  label: string;
  affects: string[];   // nazwy atrybutów w SB/SP
  riskAmplifier: number; // mnożnik ryzyka przy niepotwierdzeniu (1.0 = brak wpływu)
}

const FACTOR_RISK_MAP: FactorRiskMap[] = [
  { factorId: "SF-01", label: "Pasy bezpieczeństwa", affects: ["riskScore"], riskAmplifier: 2.5 },
  { factorId: "SF-03", label: "Trzeźwość kierowcy", affects: ["reactionTimeMs", "riskScore"], riskAmplifier: 3.0 },
  { factorId: "SF-04", label: "Sprawność świateł/hamulców", affects: ["riskScore"], riskAmplifier: 1.8 },
  { factorId: "SF-05", label: "Stan opon", affects: ["riskScore"], riskAmplifier: 1.6 },
  { factorId: "SF-06", label: "Apteczka", affects: ["riskScore"], riskAmplifier: 1.1 },
  { factorId: "SF-07", label: "Gaśnica", affects: ["riskScore"], riskAmplifier: 1.1 },
  { factorId: "CF-03", label: "Bagaż zabezpieczony", affects: ["riskScore"], riskAmplifier: 1.3 },
  { factorId: "CF-04", label: "Trasa potwierdzona", affects: ["speedKmh"], riskAmplifier: 1.4 },
  { factorId: "RD-01", label: "Aplikacja uruchomiona", affects: ["riskScore"], riskAmplifier: 1.5 },
  { factorId: "RD-02", label: "GPS dostępny", affects: ["riskScore"], riskAmplifier: 1.2 },
  { factorId: "RD-03", label: "Zgoda pasażera", affects: ["riskScore"], riskAmplifier: 2.0 },
  { factorId: "RD-04", label: "Zgoda kierowcy", affects: ["riskScore"], riskAmplifier: 2.0 },
  { factorId: "RD-05", label: "Cena zaakceptowana", affects: ["riskScore"], riskAmplifier: 1.1 },
];

function computeChecklistRiskMultiplier(
  entries: ChecklistEntry[],
  items: ChecklistItem[]
): number {
  let totalWeight = 0;
  let unconfirmedWeight = 0;

  for (const entry of entries) {
    const item = items.find((f) => f.id === entry.itemId);
    if (!item) continue;

    const map = FACTOR_RISK_MAP.find((m) => m.factorId === item.id);
    const weight = map?.riskAmplifier ?? 1.0;

    totalWeight += weight;
    if (!entry.passengerConfirmed && !entry.driverConfirmed) {
      unconfirmedWeight += weight;
    }
  }

  if (totalWeight === 0) return 1.0;
  // multiplier: 1.0 = wszystko potwierdzone, > 1.0 = im więcej niepotwierdzonych, tym większe ryzyko
  return 1.0 + (unconfirmedWeight / totalWeight) * 2.5;
}

// ---------------------------------------------------------------------------
// Symulowana trasa
// ---------------------------------------------------------------------------
const ROUTE_WAYPOINTS = [
  { lat: 52.2297, lon: 21.0122, label: "Warszawa Centrum" },
  { lat: 52.1951, lon: 20.9957, label: "Warszawa Okęcie" },
  { lat: 52.0692, lon: 20.8584, label: "Piaseczno" },
  { lat: 51.8957, lon: 20.6041, label: "Grójec" },
  { lat: 51.7628, lon: 20.4910, label: "Nowe Miasto" },
  { lat: 51.5758, lon: 20.3954, label: "Drzewica" },
  { lat: 51.3854, lon: 20.2870, label: "Opoczno" },
  { lat: 51.2280, lon: 20.1798, label: "Przysucha" },
  { lat: 51.1080, lon: 20.0589, label: "Końskie" },
  { lat: 50.9780, lon: 19.9280, label: "Włoszczowa" },
  { lat: 50.8350, lon: 19.8480, label: "Szczekociny" },
  { lat: 50.6820, lon: 19.7580, label: "Zawiercie" },
  { lat: 50.4530, lon: 19.6860, label: "Olkusz" },
  { lat: 50.2649, lon: 19.8231, label: "Kraków przedmieścia" },
  { lat: 50.0647, lon: 19.9450, label: "Kraków Rynek" },
];

const ROAD_TYPES: RoadType[] = [
  "built_up", "built_up", "non_built_up", "non_built_up",
  "non_built_up", "non_built_up", "non_built_up", "expressway_dual",
  "expressway_dual", "expressway_dual", "non_built_up", "non_built_up",
  "built_up", "built_up", "built_up",
];

// ---------------------------------------------------------------------------
// Generator SB/SP z uwzględnieniem checklisty
// ---------------------------------------------------------------------------
function buildSimulatedInput(
  index: number,
  total: number,
  baseSpeed: number,
  checklistMultiplier: number,
): SB_SP_Input {
  const wp = ROUTE_WAYPOINTS[index]!;
  const roadType = ROAD_TYPES[index]!;
  const speedLimit = SPEED_LIMITS_PL[roadType];

  // Im gorzej wypelniona checklista, tym bardziej losowa/ryzykowna jazda
  const chaosFactor = (checklistMultiplier - 1.0) / 2.5; // 0..1
  const speedVariation = Math.sin(index * 1.4) * 15 + (Math.random() - 0.3) * 20 * (1 + chaosFactor);
  const actualSpeed = Math.max(0, Math.round(baseSpeed + speedVariation));

  const cognitive = createEmptyCognitiveTrack();
  const c1 = updateGPS(cognitive, {
    lat: wp.lat,
    lon: wp.lon,
    speedKmh: actualSpeed,
    heading: 180 + index * 3,
  });
  const cognitiveWithEnv = updateEnvironment(c1, {
    weather: index > 8 ? "rain" : "clear",
    traffic: index > 5 && index < 10 ? "heavy" : "light",
    visibilityM: index > 8 ? 400 : 1200,
    timeOfDay: index > 10 ? "dusk" : "day",
    roadSurface: index > 8 ? "wet" : "dry",
  });

  const decision = createEmptyDecisionTrack();
  const d1 = updateSpeed(decision, actualSpeed, speedLimit);
  const safeDist = (actualSpeed / 3.6) * 2;
  const actualDist = safeDist * (0.3 + Math.random() * 1.4 * (1 + chaosFactor * 0.5));
  const d2 = updateObjectDistance(d1, Math.round(actualDist), Math.round(safeDist));
  // Czas reakcji wydłużony przez niepotwierdzone czynniki (np. trzeźwość)
  const baseReaction = 600;
  const reactionMs = baseReaction + Math.round(Math.random() * 900 * (1 + chaosFactor * 2));
  const d3 = updateReactionTime(d2, reactionMs);

  let d4 = d3;
  if (index % 3 === 0) {
    d4 = recordManeuver(d4, {
      type: index % 6 === 0 ? "lane_change_left" : "overtake",
      startedAt: new Date().toISOString(),
      safe: Math.random() > 0.3 * (1 + chaosFactor),
    });
  }
  if (index === 4 || index === 7 || index === 12) {
    d4 = recordSignReaction(d4, {
      signId: "B-33",
      signType: "prohibition",
      complied: actualSpeed <= speedLimit + 5 * (1 + chaosFactor),
      reactionTimeMs: 300 + Math.round(Math.random() * 400 * (1 + chaosFactor)),
    });
  }

  const timestamp = new Date(Date.now() - (total - index) * 60000).toISOString();

  return {
    rideId: "checklist-ride",
    cognitive: cognitiveWithEnv,
    decision: d4,
    roadType,
    country: "PL",
    timestamp,
    eventIndex: index,
    totalEvents: total,
  };
}

// ---------------------------------------------------------------------------
// Kolory / etykiety
// ---------------------------------------------------------------------------
function riskColorHex(riskScore: number): string {
  if (riskScore >= 80) return "#7f1d1d";
  if (riskScore >= 60) return "#ef4444";
  if (riskScore >= 40) return "#f97316";
  if (riskScore >= 20) return "#eab308";
  return "#22c55e";
}

function riskLabel(score: number): string {
  if (score >= 80) return "Krytyczny";
  if (score >= 60) return "Wysoki";
  if (score >= 40) return "Średni";
  if (score >= 20) return "Niski";
  return "Bezpieczny";
}

function riskLabelColor(score: number): string {
  if (score >= 80) return "text-red-500";
  if (score >= 60) return "text-red-400";
  if (score >= 40) return "text-orange-400";
  if (score >= 20) return "text-amber-400";
  return "text-emerald-400";
}

const CATEGORY_LABELS: Record<ChecklistCategory, string> = {
  safety: "Bezpieczeństwo",
  comfort: "Komfort",
  readiness: "Gotowość",
};

const CATEGORY_ICONS: Record<ChecklistCategory, string> = {
  safety: "🛡️",
  comfort: "😊",
  readiness: "📱",
};

const CATEGORY_COLORS: Record<ChecklistCategory, string> = {
  safety: "border-red-500/30 bg-red-500/5",
  comfort: "border-blue-500/30 bg-blue-500/5",
  readiness: "border-emerald-500/30 bg-emerald-500/5",
};

// ---------------------------------------------------------------------------
// Komponent
// ---------------------------------------------------------------------------
type PageMode = "checklist" | "simulation" | "results";

export default function ChecklistaPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<PageMode>("checklist");

  // Checklist state
  const [entries, setEntries] = useState<ChecklistEntry[]>(() =>
    TRIP_FACTORS.map((item) => ({
      itemId: item.id,
      passengerConfirmed: false,
      driverConfirmed: false,
    }))
  );
  const [comments, setComments] = useState<Record<string, string>>({});

  // Simulation state
  const [checklistMultiplier, setChecklistMultiplier] = useState(1.0);
  const [simEvents, setSimEvents] = useState<SB_SP_Event[]>([]);
  const [simContext, setSimContext] = useState<SB_SP_Context | null>(null);
  const [chartData, setChartData] = useState<ChartRenderData | null>(null);

  // Auth
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const userStr = localStorage.getItem("auth_user");
    if (!token || !userStr) { window.location.href = "/"; return; }
    try { setUser(JSON.parse(userStr)); } catch { window.location.href = "/"; return; }
    setLoading(false);
  }, []);

  // Toggle
  function toggleEntry(itemId: string) {
    setEntries((prev) =>
      prev.map((e) =>
        e.itemId === itemId
          ? { ...e, passengerConfirmed: !e.passengerConfirmed, confirmedAt: new Date().toISOString() }
          : e
      )
    );
  }

  function setComment(itemId: string, value: string) {
    setComments((prev) => ({ ...prev, [itemId]: value }));
  }

  // Progress
  const passengerItems = useMemo(() => getFactorsForRole("passenger"), []);
  const passengerConfirmed = useMemo(
    () => entries.filter((e) => {
      const item = passengerItems.find((f) => f.id === e.itemId);
      return item && e.passengerConfirmed;
    }).length,
    [entries, passengerItems]
  );

  const criticalItems = useMemo(() => getCriticalFactors(), []);
  const criticalConfirmed = useMemo(
    () => entries.filter((e) => {
      const item = criticalItems.find((f) => f.id === e.itemId);
      return item && e.passengerConfirmed;
    }).length,
    [entries, criticalItems]
  );

  const allCriticalDone = criticalConfirmed >= criticalItems.length;

  // Uruchom symulację
  function startSimulation() {
    const multiplier = computeChecklistRiskMultiplier(entries, TRIP_FACTORS);
    setChecklistMultiplier(multiplier);
    setMode("simulation");

    const total = ROUTE_WAYPOINTS.length;
    const baseSpeed = 90;
    let ctx = createSB_SP_Context("checklist-ride");
    const events: SB_SP_Event[] = [];

    for (let i = 0; i < total; i++) {
      const input = buildSimulatedInput(i, total, baseSpeed, multiplier);
      const result = processSB_SP_Event(input, ctx);
      // Apply checklist multiplier to risk
      const amplifiedEvent: SB_SP_Event = {
        ...result.event,
        compliance: {
          ...result.event.compliance,
          riskScore: Math.min(100, Math.round(result.event.compliance.riskScore * multiplier)),
        },
      };
      events.push(amplifiedEvent);
      ctx = result.context;
    }

    setSimContext(ctx);
    setSimEvents(events);

    const chartState = generateChartFromEvents("checklist-ride", events);
    setChartData(toRenderData(chartState, events));
  }

  function goBackToChecklist() {
    setMode("checklist");
    setSimEvents([]);
    setSimContext(null);
    setChartData(null);
  }

  // Compute collision prediction
  const collisionRisk = useMemo(() => {
    if (simEvents.length === 0) return null;
    const maxRisk = Math.max(...simEvents.map((e) => e.compliance.riskScore));
    const avgRisk = Math.round(simEvents.reduce((a, e) => a + e.compliance.riskScore, 0) / simEvents.length);
    const criticalCount = simEvents.filter((e) => e.compliance.riskScore >= 80).length;
    const highCount = simEvents.filter((e) => e.compliance.riskScore >= 60).length;

    return { maxRisk, avgRisk, criticalCount, highCount, total: simEvents.length };
  }, [simEvents]);

  // SVG dimensions
  const svgW = 700;
  const svgH = 400;
  const padX = 50;
  const padY = 40;
  const plotW = svgW - padX * 2;
  const plotH = svgH - padY * 2;

  // Progressive events for animation
  const [animStep, setAnimStep] = useState(0);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (mode === "simulation" && simEvents.length > 0 && animStep < simEvents.length) {
      animRef.current = setInterval(() => {
        setAnimStep((prev) => {
          if (prev >= simEvents.length) {
            if (animRef.current) clearInterval(animRef.current);
            return prev;
          }
          return prev + 1;
        });
      }, 600);
      return () => { if (animRef.current) clearInterval(animRef.current); };
    }
  }, [mode, simEvents.length, animStep]);

  const visiblePoints = useMemo(() => {
    if (!chartData) return [];
    return chartData.points.slice(0, animStep);
  }, [chartData, animStep]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  const isPassenger = user.role !== "driver";
  const roleLabel = isPassenger ? "Pasażer" : "Kierowca";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* ---------- header ---------- */}
      <header className="border-b border-border bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-zinc-400 hover:text-amber-400 transition mr-2">
              ← Powrót
            </Link>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-zinc-900 text-xl font-bold">P</div>
            <span className="text-lg font-semibold tracking-tight">Pilot Zaufania</span>
          </div>
          <nav className="flex items-center gap-6">
            <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-border">{roleLabel}</span>
            <span className="text-sm text-zinc-400">{user.fullName || user.email}</span>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* ---------- MODE: CHECKLIST ---------- */}
        {mode === "checklist" && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Checklista przed podróżą</h1>
              <p className="mt-2 text-zinc-400">
                Potwierdź wszystkie pozycje przed rozpoczęciem przejazdu. Niepotwierdzone czynniki zwiększają prognozowane ryzyko kolizji.
              </p>
            </div>

            {/* progress */}
            <div className="rounded-2xl border border-border bg-zinc-900/50 p-6 mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">
                  Postęp: {passengerConfirmed} / {passengerItems.length} pozycji
                </span>
                <span className="text-xs text-zinc-500">
                  Krytyczne: {criticalConfirmed} / {criticalItems.length}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                  style={{ width: `${(passengerConfirmed / passengerItems.length) * 100}%` }}
                />
              </div>
              {!allCriticalDone && (
                <p className="mt-3 text-xs text-amber-400">
                  ⚠️ Musisz potwierdzić wszystkie pozycje krytyczne przed rozpoczęciem symulacji.
                </p>
              )}
            </div>

            {/* checklist categories */}
            <div className="space-y-8">
              {(["safety", "comfort", "readiness"] as ChecklistCategory[]).map((cat) => {
                const catItems = getFactorsByCategory(cat).filter((item) =>
                  item.requiredBy.includes("passenger") || item.requiredBy.includes("both")
                );
                const catConfirmed = entries.filter(
                  (e) => catItems.some((ci) => ci.id === e.itemId) && e.passengerConfirmed
                ).length;

                return (
                  <section key={cat} className={`rounded-2xl border ${CATEGORY_COLORS[cat]} p-6`}>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl">{CATEGORY_ICONS[cat]}</span>
                      <h2 className="text-lg font-semibold">{CATEGORY_LABELS[cat]}</h2>
                      <span className="text-xs text-zinc-500 ml-auto">
                        {catConfirmed} / {catItems.length}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {catItems.map((item) => {
                        const entry = entries.find((e) => e.itemId === item.id);
                        const isConfirmed = entry?.passengerConfirmed ?? false;
                        const map = FACTOR_RISK_MAP.find((m) => m.factorId === item.id);

                        return (
                          <div
                            key={item.id}
                            className={`rounded-xl border p-4 transition-all ${
                              isConfirmed
                                ? "border-emerald-500/20 bg-emerald-500/5"
                                : item.critical
                                  ? "border-red-500/20 bg-red-500/5"
                                  : "border-border bg-zinc-800/50"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <button
                                onClick={() => toggleEntry(item.id)}
                                className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition ${
                                  isConfirmed
                                    ? "bg-emerald-500 border-emerald-500"
                                    : "border-zinc-600 hover:border-zinc-400"
                                }`}
                              >
                                {isConfirmed && (
                                  <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                )}
                              </button>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-sm font-medium ${isConfirmed ? "text-zinc-300" : "text-zinc-100"}`}>
                                    {item.label}
                                  </span>
                                  {item.critical && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 uppercase">
                                      Krytyczne
                                    </span>
                                  )}
                                  {map && !isConfirmed && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                      +{Math.round((map.riskAmplifier - 1) * 100)}% ryzyka
                                    </span>
                                  )}
                                </div>
                                {item.description && (
                                  <p className="text-xs text-zinc-500 mb-1">{item.description}</p>
                                )}
                                {!isConfirmed && item.critical && (
                                  <p className="text-xs text-red-400 mt-1">
                                    ⚠️ Niepotwierdzenie tego czynnika znacząco zwiększa ryzyko prognozowanych kolizji.
                                  </p>
                                )}
                                <input
                                  type="text"
                                  value={comments[item.id] ?? ""}
                                  onChange={(e) => setComment(item.id, e.target.value)}
                                  placeholder="Komentarz (opcjonalnie)..."
                                  className="mt-2 w-full bg-transparent border-b border-zinc-700 text-xs text-zinc-400 placeholder:text-zinc-600 pb-1 focus:outline-none focus:border-amber-500/50"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>

            {/* start simulation button */}
            <div className="mt-10 flex flex-col items-center gap-3">
              <button
                onClick={startSimulation}
                disabled={!allCriticalDone}
                className="rounded-xl bg-amber-500 px-8 py-4 text-base font-semibold text-zinc-900 hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                🚀 Rozpocznij symulację przejazdu z prognozą kolizji
              </button>
              {!allCriticalDone && (
                <p className="text-xs text-zinc-500">
                  Potwierdź wszystkie krytyczne pozycje (czerwone), aby odblokować symulację.
                </p>
              )}
            </div>
          </>
        )}

        {/* ---------- MODE: SIMULATION + RESULTS ---------- */}
        {mode === "simulation" && chartData && (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Symulacja z prognozą kolizji</h1>
                <p className="mt-2 text-zinc-400">
                  Wykres bąbelkowy pokazuje prognozowane ryzyko kolizji na podstawie checklisty i analizy SB/SP.
                </p>
              </div>
              <button
                onClick={goBackToChecklist}
                className="rounded-xl border border-border px-5 py-2.5 text-sm text-zinc-300 hover:border-amber-500/30 transition"
              >
                ← Wróć do checklisty
              </button>
            </div>

            {/* checklist risk multiplier badge */}
            <div className={`inline-flex items-center gap-2 mb-8 px-4 py-3 rounded-xl border ${
              checklistMultiplier < 1.3
                ? "border-emerald-500/30 bg-emerald-500/10"
                : checklistMultiplier < 1.7
                  ? "border-amber-500/30 bg-amber-500/10"
                  : "border-red-500/30 bg-red-500/10"
            }`}>
              <span className="text-sm">Mnożnik ryzyka z checklisty:</span>
              <span className={`text-lg font-bold ${
                checklistMultiplier < 1.3 ? "text-emerald-400" : checklistMultiplier < 1.7 ? "text-amber-400" : "text-red-400"
              }`}>
                {checklistMultiplier.toFixed(2)}×
              </span>
              <span className="text-xs text-zinc-500">
                ({passengerConfirmed}/{passengerItems.length} potwierdzonych)
              </span>
            </div>

            {/* collision prediction cards */}
            {collisionRisk && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="rounded-2xl border border-border bg-zinc-900/50 p-5 text-center">
                  <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Maks. ryzyko kolizji</div>
                  <div className={`text-3xl font-bold ${riskLabelColor(collisionRisk.maxRisk)}`}>
                    {collisionRisk.maxRisk}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">{riskLabel(collisionRisk.maxRisk)}</div>
                </div>
                <div className="rounded-2xl border border-border bg-zinc-900/50 p-5 text-center">
                  <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Średnie ryzyko</div>
                  <div className={`text-3xl font-bold ${riskLabelColor(collisionRisk.avgRisk)}`}>
                    {collisionRisk.avgRisk}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">na {collisionRisk.total} zdarzeń</div>
                </div>
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-center">
                  <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Krytyczne zdarzenia</div>
                  <div className="text-3xl font-bold text-red-400">{collisionRisk.criticalCount}</div>
                  <div className="text-xs text-zinc-500 mt-1">ryzyko ≥ 80</div>
                </div>
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 text-center">
                  <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Wysokie ryzyko</div>
                  <div className="text-3xl font-bold text-amber-400">{collisionRisk.highCount}</div>
                  <div className="text-xs text-zinc-500 mt-1">ryzyko ≥ 60</div>
                </div>
              </div>
            )}

            {/* ---------- bubble chart + timeline ---------- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="rounded-2xl border border-border bg-zinc-900/50 p-6">
                  <h2 className="text-lg font-semibold mb-1">
                    {chartData.config.title}
                  </h2>
                  <p className="text-xs text-zinc-500 mb-4">
                    Każdy bąbelek = prognozowane ryzyko kolizji w punkcie trasy. Kolor i rozmiar zależą od odchylenia Δ i checklisty.
                  </p>

                  <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto">
                    {/* grid */}
                    {[0, 25, 50, 75, 100].map((pct) => {
                      const x = padX + (pct / 100) * plotW;
                      return <line key={`gx-${pct}`} x1={x} y1={padY} x2={x} y2={svgH - padY} stroke="#3f3f46" strokeWidth="0.5" />;
                    })}
                    {[-100, -50, 0, 50, 100].map((val) => {
                      const y = padY + plotH / 2 - (val / 100) * (plotH / 2);
                      return <line key={`gy-${val}`} x1={padX} y1={y} x2={svgW - padX} y2={y} stroke="#3f3f46" strokeWidth="0.5" />;
                    })}
                    <line x1={padX} y1={padY + plotH / 2} x2={svgW - padX} y2={padY + plotH / 2} stroke="#52525b" strokeWidth="1" />

                    {/* collision danger zone (upper area) */}
                    <rect
                      x={padX}
                      y={padY}
                      width={plotW}
                      height={plotH * 0.3}
                      fill="#ef4444"
                      opacity="0.05"
                    />
                    <text x={svgW - padX - 5} y={padY + 15} textAnchor="end" fill="#ef4444" fontSize="9" opacity="0.6">
                      STREFA KOLIZJI
                    </text>

                    {/* axis labels */}
                    <text x={svgW / 2} y={svgH - 5} textAnchor="middle" fill="#71717a" fontSize="10">Czas przejazdu →</text>
                    <text x={12} y={svgH / 2} textAnchor="middle" fill="#71717a" fontSize="10" transform={`rotate(-90, 12, ${svgH / 2})`}>
                      Δ od normy + ryzyko kolizji
                    </text>

                    {/* bubbles */}
                    {visiblePoints.map((pt, i) => {
                      const cx = padX + (pt.x / 100) * plotW;
                      const cy = padY + plotH / 2 - (pt.y / 100) * (plotH / 2);
                      const r = Math.max(5, pt.size * 0.6);
                      const isLast = i === visiblePoints.length - 1;
                      return (
                        <g key={pt.id}>
                          {/* collision radius ring for high-risk points */}
                          {pt.riskScore >= 60 && (
                            <circle cx={cx} cy={cy} r={r * 1.8} fill="none" stroke={pt.color} strokeWidth="0.5" opacity="0.25" strokeDasharray="3,2">
                              <animate attributeName="r" from={r * 1.5} to={r * 2.2} dur="2s" repeatCount="indefinite" />
                              <animate attributeName="opacity" from="0.25" to="0.05" dur="2s" repeatCount="indefinite" />
                            </circle>
                          )}
                          <circle cx={cx} cy={cy} r={r} fill={pt.color} opacity={pt.opacity} stroke={isLast ? "#fff" : "none"} strokeWidth={isLast ? 2 : 0} />
                          {isLast && (
                            <text x={cx} y={cy - r - 4} textAnchor="middle" fill="#a1a1aa" fontSize="9">{pt.name}</text>
                          )}
                        </g>
                      );
                    })}
                  </svg>

                  {/* legend */}
                  <div className="flex flex-wrap gap-3 mt-4 text-xs">
                    {(["green", "yellow", "orange", "red", "darkred"] as const).map((c) => {
                      const hex = chartData.config.colors[c];
                      const label = c === "green" ? "Bezpieczny" : c === "yellow" ? "Niskie ryzyko" : c === "orange" ? "Średnie" : c === "red" ? "Wysokie" : "Kolizja";
                      return (
                        <div key={c} className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: hex }} />
                          <span className="text-zinc-400">{label}</span>
                        </div>
                      );
                    })}
                    <div className="flex items-center gap-1.5 ml-4">
                      <div className="w-3 h-3 rounded-full border border-dashed border-red-500/50" />
                      <span className="text-zinc-400">Strefa kolizji</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* right panel: timeline + predictions */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-border bg-zinc-900/50 p-6">
                  <h3 className="text-sm font-semibold mb-3">Oś czasu — prognozowane kolizje</h3>
                  <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                    {simEvents.map((evt, i) => {
                      const isVisible = i < animStep;
                      const isLast = i === animStep - 1;
                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs transition-all ${
                            !isVisible ? "opacity-20" : ""
                          } ${isLast ? "bg-amber-500/10 border border-amber-500/20" : ""}`}
                        >
                          <div className="relative w-3 h-3 shrink-0">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: isVisible ? riskColorHex(evt.compliance.riskScore) : "#3f3f46" }}
                            />
                            {evt.compliance.riskScore >= 80 && isVisible && (
                              <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
                            )}
                          </div>
                          <span className="text-zinc-600 w-6">#{i + 1}</span>
                          <span className="truncate flex-1">{ROUTE_WAYPOINTS[i]?.label}</span>
                          <span className={`font-mono text-[11px] ${riskLabelColor(evt.compliance.riskScore)}`}>
                            {evt.compliance.riskScore}
                          </span>
                          {evt.compliance.riskScore >= 80 && isVisible && (
                            <span className="text-[9px] text-red-400 animate-pulse">⚡KOLIZJA</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* checklist impact summary */}
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
                  <h3 className="text-sm font-semibold text-amber-400 mb-3">📋 Wpływ checklisty na ryzyko</h3>
                  {FACTOR_RISK_MAP.filter((m) => {
                    const entry = entries.find((e) => e.itemId === m.factorId);
                    return entry && !entry.passengerConfirmed;
                  }).slice(0, 5).map((m) => (
                    <div key={m.factorId} className="flex items-center justify-between py-1.5 text-xs border-b border-border/50 last:border-0">
                      <span className="text-zinc-300">❌ {m.label}</span>
                      <span className="font-mono text-red-400">
                        +{Math.round((m.riskAmplifier - 1) * 100)}% ryzyka
                      </span>
                    </div>
                  ))}
                  {FACTOR_RISK_MAP.filter((m) => {
                    const entry = entries.find((e) => e.itemId === m.factorId);
                    return entry && entry.passengerConfirmed;
                  }).slice(0, 5).map((m) => (
                    <div key={m.factorId} className="flex items-center justify-between py-1.5 text-xs border-b border-border/50 last:border-0">
                      <span className="text-zinc-300">✅ {m.label}</span>
                      <span className="font-mono text-emerald-400">OK</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
