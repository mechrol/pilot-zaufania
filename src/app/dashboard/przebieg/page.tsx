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

// ---------------------------------------------------------------------------
// User auth
// ---------------------------------------------------------------------------
interface User {
  id: string;
  email: string;
  fullName?: string;
  role?: string;
}

// ---------------------------------------------------------------------------
// Symulacja trasy — 15 punktów GPS: Warszawa → Kraków
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
// Generator danych symulowanych
// ---------------------------------------------------------------------------
function buildSimulatedInput(
  index: number,
  total: number,
  baseSpeed: number,
): SB_SP_Input {
  const wp = ROUTE_WAYPOINTS[index]!;
  const roadType = ROAD_TYPES[index]!;
  const speedLimit = SPEED_LIMITS_PL[roadType];

  const speedVariation = Math.sin(index * 1.4) * 15 + (Math.random() - 0.5) * 20;
  const actualSpeed = Math.max(0, Math.round(baseSpeed + speedVariation));

  // Tor poznawczy
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

  // Tor decyzyjny
  const decision = createEmptyDecisionTrack();
  const d1 = updateSpeed(decision, actualSpeed, speedLimit);
  const safeDist = (actualSpeed / 3.6) * 2;
  const actualDist = safeDist * (0.3 + Math.random() * 1.4);
  const d2 = updateObjectDistance(d1, Math.round(actualDist), Math.round(safeDist));
  const reactionMs = 600 + Math.round(Math.random() * 900);
  const d3 = updateReactionTime(d2, reactionMs);

  let d4 = d3;
  if (index % 3 === 0) {
    d4 = recordManeuver(d4, {
      type: index % 6 === 0 ? "lane_change_left" : "overtake",
      startedAt: new Date().toISOString(),
      safe: Math.random() > 0.3,
    });
  }

  if (index === 4 || index === 7 || index === 12) {
    d4 = recordSignReaction(d4, {
      signId: "B-33",
      signType: "prohibition",
      complied: actualSpeed <= speedLimit + 5,
      reactionTimeMs: 300 + Math.round(Math.random() * 400),
    });
  }

  const timestamp = new Date(
    Date.now() - (total - index) * 60000
  ).toISOString();

  return {
    rideId: "demo-ride-waw-krk",
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
// Helpers
// ---------------------------------------------------------------------------
function riskColorHex(riskScore: number): string {
  if (riskScore >= 80) return "#7f1d1d";
  if (riskScore >= 60) return "#ef4444";
  if (riskScore >= 40) return "#f97316";
  if (riskScore >= 20) return "#eab308";
  return "#22c55e";
}

function riskLabel(riskScore: number): string {
  if (riskScore >= 80) return "Krytyczny";
  if (riskScore >= 60) return "Wysoki";
  if (riskScore >= 40) return "Średni";
  if (riskScore >= 20) return "Niski";
  return "Bezpieczny";
}

function riskLabelColor(riskScore: number): string {
  if (riskScore >= 80) return "text-red-500";
  if (riskScore >= 60) return "text-red-400";
  if (riskScore >= 40) return "text-orange-400";
  if (riskScore >= 20) return "text-amber-400";
  return "text-emerald-400";
}

// ---------------------------------------------------------------------------
// Komponent
// ---------------------------------------------------------------------------
export default function PrzebiegDemoPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [simEvents, setSimEvents] = useState<SB_SP_Event[]>([]);
  const [simContext, setSimContext] = useState<SB_SP_Context | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [simComplete, setSimComplete] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const userStr = localStorage.getItem("auth_user");

    if (!token || !userStr) {
      window.location.href = "/";
      return;
    }

    try {
      setUser(JSON.parse(userStr));
    } catch {
      window.location.href = "/";
      return;
    }

    setLoading(false);
  }, []);

  const initSimulation = useCallback(() => {
    const total = ROUTE_WAYPOINTS.length;
    const baseSpeed = 90;
    let ctx = createSB_SP_Context("demo-ride-waw-krk");
    const events: SB_SP_Event[] = [];

    for (let i = 0; i < total; i++) {
      const input = buildSimulatedInput(i, total, baseSpeed);
      const result = processSB_SP_Event(input, ctx);
      events.push(result.event);
      ctx = result.context;
    }

    setSimContext(ctx);
    setSimEvents(events);
    setCurrentStep(0);
    setSimComplete(false);
  }, []);

  useEffect(() => {
    if (!loading) initSimulation();
  }, [loading, initSimulation]);

  const sliceData = useMemo(() => {
    if (simEvents.length === 0) return { points: [] as ChartRenderData["points"], config: null as ChartRenderData["config"] | null };
    const sliced = simEvents.slice(0, currentStep + 1);
    const chartState = generateChartFromEvents("demo-ride-waw-krk", sliced);
    const rd = toRenderData(chartState, sliced);
    return { points: rd.points, config: rd.config };
  }, [simEvents, currentStep]);

  useEffect(() => {
    if (isRunning && currentStep < simEvents.length - 1) {
      const interval = 1200 / speed;
      timerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= simEvents.length - 1) {
            setIsRunning(false);
            setSimComplete(true);
            return prev;
          }
          return prev + 1;
        });
      }, interval);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else if (currentStep >= simEvents.length - 1 && simEvents.length > 0) {
      setIsRunning(false);
      setSimComplete(true);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, currentStep, simEvents.length, speed]);

  const handlePlayPause = () => {
    if (simComplete) {
      initSimulation();
      setTimeout(() => setIsRunning(true), 100);
      return;
    }
    setIsRunning((prev) => !prev);
  };

  const handleStep = () => {
    if (currentStep < simEvents.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      if (next >= simEvents.length - 1) setSimComplete(true);
    }
  };

  const handleReset = () => {
    initSimulation();
  };

  const currentEvent = simEvents[currentStep];
  const progress = simEvents.length > 0 ? ((currentStep + 1) / simEvents.length) * 100 : 0;

  // SVG
  const svgW = 700;
  const svgH = 350;
  const padX = 50;
  const padY = 30;
  const plotW = svgW - padX * 2;
  const plotH = svgH - padY * 2;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  const ctxMetrics = simContext?.knowledgeBase.metrics;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* ---------- header ---------- */}
      <header className="border-b border-border bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-zinc-400 hover:text-amber-400 transition mr-2">
              ← Powrót
            </Link>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-zinc-900 text-xl font-bold">
              P
            </div>
            <span className="text-lg font-semibold tracking-tight">Pilot Zaufania</span>
          </div>
          <nav className="flex items-center gap-6">
            <span className="text-sm text-zinc-400">{user.fullName || user.email}</span>
          </nav>
        </div>
      </header>

      {/* ---------- content ---------- */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Demo: Przebieg trasy + wykres SB/SP</h1>
          <p className="mt-2 text-zinc-400">
            Symulacja przejazdu Warszawa → Kraków z analizą SB/SP. Każdy punkt trasy to zdarzenie oceniane przez silnik.
          </p>
        </div>

        {/* ---------- controls ---------- */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <button
            onClick={handlePlayPause}
            className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-amber-400 transition active:scale-[0.98]"
          >
            {simComplete ? "↺ Powtórz" : isRunning ? "⏸ Pauza" : "▶ Odtwórz"}
          </button>
          <button
            onClick={handleStep}
            disabled={simComplete || isRunning}
            className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-zinc-300 hover:border-amber-500/30 disabled:opacity-40 transition"
          >
            ⏭ Krok
          </button>
          <button
            onClick={handleReset}
            className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-zinc-300 hover:border-amber-500/30 transition"
          >
            ↺ Reset
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-zinc-500">Prędkość:</span>
            {([1, 2, 4] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2.5 py-1 text-xs rounded-md transition ${
                  speed === s
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "text-zinc-500 border border-border hover:text-zinc-300"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* ---------- route progress ---------- */}
        <div className="mb-10">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
            <span>🚩 {ROUTE_WAYPOINTS[0]?.label}</span>
            <span>Krok {currentStep + 1} / {simEvents.length}</span>
            <span>🏁 {ROUTE_WAYPOINTS[ROUTE_WAYPOINTS.length - 1]?.label}</span>
          </div>
          <div className="h-3 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="relative h-6 mt-2">
            {ROUTE_WAYPOINTS.map((wp, i) => {
              const pct = (i / (ROUTE_WAYPOINTS.length - 1)) * 100;
              const isActive = i <= currentStep;
              return (
                <div
                  key={i}
                  className="absolute -translate-x-1/2"
                  style={{ left: `${pct}%` }}
                  title={wp.label}
                >
                  <div
                    className={`w-2 h-2 rounded-full transition-colors ${
                      isActive ? "bg-amber-400" : "bg-zinc-700"
                    } ${i === currentStep ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-zinc-950" : ""}`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ---------- left: wykres bąbelkowy SVG ---------- */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-border bg-zinc-900/50 p-6">
              <h2 className="text-lg font-semibold mb-2">
                {sliceData.config?.title ?? "Wykres bąbelkowy SB/SP"}
              </h2>
              <p className="text-xs text-zinc-500 mb-4">
                {sliceData.config?.xLabel ?? ""} → | ↑ {sliceData.config?.yLabel ?? ""}
              </p>

              <div className="overflow-x-auto">
                <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-[700px] h-auto">
                  {[0, 25, 50, 75, 100].map((pct) => {
                    const x = padX + (pct / 100) * plotW;
                    return (
                      <line key={`gx-${pct}`} x1={x} y1={padY} x2={x} y2={svgH - padY} stroke="#3f3f46" strokeWidth="0.5" />
                    );
                  })}
                  {[-100, -50, 0, 50, 100].map((val) => {
                    const y = padY + plotH / 2 - (val / 100) * (plotH / 2);
                    return (
                      <line key={`gy-${val}`} x1={padX} y1={y} x2={svgW - padX} y2={y} stroke="#3f3f46" strokeWidth="0.5" />
                    );
                  })}
                  <line x1={padX} y1={padY + plotH / 2} x2={svgW - padX} y2={padY + plotH / 2} stroke="#52525b" strokeWidth="1" />

                  <text x={svgW / 2} y={svgH - 5} textAnchor="middle" fill="#71717a" fontSize="10">
                    Czas przejazdu →
                  </text>
                  <text x={12} y={svgH / 2} textAnchor="middle" fill="#71717a" fontSize="10" transform={`rotate(-90, 12, ${svgH / 2})`}>
                    Δ od normy
                  </text>

                  {sliceData.points.map((pt, i) => {
                    const cx = padX + (pt.x / 100) * plotW;
                    const cy = padY + plotH / 2 - (pt.y / 100) * (plotH / 2);
                    const r = Math.max(4, pt.size * 0.55);
                    const isCurrent = i === sliceData.points.length - 1;
                    return (
                      <g key={pt.id}>
                        <circle
                          cx={cx}
                          cy={cy}
                          r={r}
                          fill={pt.color}
                          opacity={pt.opacity}
                          stroke={isCurrent ? "#fff" : "none"}
                          strokeWidth={isCurrent ? 2 : 0}
                        />
                        {isCurrent && (
                          <text x={cx} y={cy - r - 4} textAnchor="middle" fill="#a1a1aa" fontSize="9">
                            {pt.name}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="flex flex-wrap gap-3 mt-4 text-xs">
                {(["green", "yellow", "orange", "red", "darkred"] as const).map((c) => {
                  const hex = sliceData.config?.colors?.[c] ?? riskColorHex(
                    c === "green" ? 0 : c === "yellow" ? 20 : c === "orange" ? 40 : c === "red" ? 60 : 80
                  );
                  const label =
                    c === "green"
                      ? "Zgodne"
                      : c === "yellow"
                        ? "Niskie Δ"
                        : c === "orange"
                          ? "Średnie Δ"
                          : c === "red"
                            ? "Wysokie Δ"
                            : "Krytyczne";
                  return (
                    <div key={c} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: hex }} />
                      <span className="text-zinc-400">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ---------- right: event detail + metrics + timeline ---------- */}
          <div className="space-y-6">
            {currentEvent && (
              <div className="rounded-2xl border border-border bg-zinc-900/50 p-6">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: riskColorHex(currentEvent.compliance.riskScore) }}
                  />
                  Zdarzenie #{currentStep + 1}
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Lokalizacja:</span>
                    <span className="font-medium">{ROUTE_WAYPOINTS[currentStep]?.label ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Droga:</span>
                    <span className="font-medium">
                      {ROAD_TYPES[currentStep] === "built_up"
                        ? "Zabudowany"
                        : ROAD_TYPES[currentStep] === "expressway_dual"
                          ? "Ekspresowa"
                          : "Poza zabudowanym"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Prędkość:</span>
                    <span
                      className={`font-medium ${
                        (currentEvent.decision.WR["speedKmh"] as number) >
                        (SPEED_LIMITS_PL[ROAD_TYPES[currentStep]!] ?? 50)
                          ? "text-red-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {String(currentEvent.decision.WR["speedKmh"] ?? "—")} km/h
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Czas reakcji:</span>
                    <span className="font-medium">{String(currentEvent.decision.WR["reactionTimeMs"] ?? "—")} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Ryzyko:</span>
                    <span className={`font-bold ${riskLabelColor(currentEvent.compliance.riskScore)}`}>
                      {riskLabel(currentEvent.compliance.riskScore)} ({currentEvent.compliance.riskScore})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Faza SB/SP:</span>
                    <span className="font-medium text-amber-400">{currentEvent.sb_sp_framework.classification}</span>
                  </div>
                </div>

                {currentEvent.compliance.deviationLevel !== "none" && (
                  <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400">
                    <p className="font-medium mb-1">⚠️ Odchylenie: {currentEvent.compliance.deviationLevel}</p>
                    <p>{currentEvent.compliance.description}</p>
                    {currentEvent.compliance.correctionSuggestion && (
                      <p className="mt-1 text-zinc-400">💡 {currentEvent.compliance.correctionSuggestion}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {ctxMetrics && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
                <h3 className="text-sm font-semibold mb-3 text-emerald-400">📊 Metryki z bazy wiedzy</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-zinc-500">Śr. ryzyko</div>
                    <div className="font-semibold">{ctxMetrics.averageRiskScore}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500">Zgodność</div>
                    <div className="font-semibold">{ctxMetrics.complianceRate}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500">Zdarzeń kryt.</div>
                    <div className="font-semibold text-red-400">{ctxMetrics.criticalEvents}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500">Bezpiecznych</div>
                    <div className="font-semibold text-emerald-400">{ctxMetrics.safeEvents}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500">Śr. Δ prędkości</div>
                    <div className="font-semibold">{ctxMetrics.avgSpeedDeviation} km/h</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500">Śr. czas reakcji</div>
                    <div className="font-semibold">{ctxMetrics.avgReactionTimeMs} ms</div>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-zinc-900/50 p-6">
              <h3 className="text-sm font-semibold mb-3">Oś czasu zdarzeń</h3>
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                {simEvents.map((evt, i) => {
                  const isPast = i <= currentStep;
                  const isCurrent = i === currentStep;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-2 py-1 px-2 rounded-lg text-xs transition ${
                        isCurrent ? "bg-amber-500/10 border border-amber-500/20" : ""
                      } ${!isPast ? "opacity-30" : ""}`}
                    >
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          backgroundColor: isPast ? riskColorHex(evt.compliance.riskScore) : "#3f3f46",
                        }}
                      />
                      <span className="text-zinc-500 w-6">#{i + 1}</span>
                      <span className="truncate flex-1">{ROUTE_WAYPOINTS[i]?.label}</span>
                      <span className={`font-mono ${riskLabelColor(evt.compliance.riskScore)}`}>
                        {evt.compliance.riskScore}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
