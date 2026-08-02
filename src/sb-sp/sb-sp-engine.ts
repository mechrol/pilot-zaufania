// =============================================================================
// Pilot Zaufania — SB/SP Engine (silnik główny)
// =============================================================================
// Orkiestruje pełny cykl refleksji SB/SP:
//   1. Identyfikacja — zbieranie WR/WP, obliczanie Δ
//   2. Analiza — ocena zgodności, wykrywanie zagrożeń
//   3. Synteza — łączenie percepcji i decyzji, wnioski przyczynowo-skutkowe
//   4. Ocena — klasyfikacja, aktualizacja wykresu, zapis do bazy wiedzy
//
// Integruje wszystkich agentów: Sensor Fusion, Road Sign Interpreter,
// Driver Decision Analyzer, Risk & Collision Forecaster,
// Memory Engineer, Bubble Visualization Engineer.
// =============================================================================

import type {
  CognitiveTrack,
  DecisionTrack,
  SB_SP_Event,
  SB_SP_Reflection,
  KnowledgeBase,
  WR_WP_Delta,
} from "../types/sb-sp.js";
import type { RoadType } from "../types/road-code.js";
import type { BubbleChartState } from "../types/bubble-chart.js";
import {
  extractCognitiveWR,
  computeCognitiveWP,
  computeCognitiveDelta,
} from "./cognitive-track.js";
import {
  extractDecisionWR,
  computeDecisionWP,
  computeDecisionDelta,
} from "./decision-track.js";
import { generateComplianceReport } from "./road-code-checker.js";
import { generateBubble } from "./bubble-visualizer.js";
import {
  createKnowledgeBase,
  recordEvent,
} from "./memory-engine.js";

// ---------------------------------------------------------------------------
// Parametry wejściowe
// ---------------------------------------------------------------------------

/** Pełne dane wejściowe do przetworzenia przez SB/SP Engine */
export interface SB_SP_Input {
  /** ID przejazdu */
  rideId: string;
  /** Tor poznawczy — dane z sensorów */
  cognitive: CognitiveTrack;
  /** Tor decyzyjny — dane o decyzjach kierowcy */
  decision: DecisionTrack;
  /** Typ drogi (do kodeksu drogowego) */
  roadType: RoadType;
  /** Kraj (domyślnie PL) */
  country?: "PL";
  /** Znacznik czasu zdarzenia */
  timestamp?: string;
  /** Numer zdarzenia w sekwencji */
  eventIndex?: number;
  /** Całkowita liczba zdarzeń w przejeździe */
  totalEvents?: number;
}

// ---------------------------------------------------------------------------
// Główny pipeline SB/SP
// ---------------------------------------------------------------------------

/** Kontekst stanu między wywołaniami */
export interface SB_SP_Context {
  knowledgeBase: KnowledgeBase;
  chartState: BubbleChartState;
  eventCount: number;
}

/** Tworzy nowy kontekst SB/SP dla przejazdu */
export function createSB_SP_Context(rideId: string): SB_SP_Context {
  return {
    knowledgeBase: createKnowledgeBase(rideId),
    chartState: {
      rideId,
      lastUpdated: new Date().toISOString(),
      config: {
        title: "Zgodność SB/SP — Wykres bąbelkowy",
        xAxisLabel: "Czas trwania przejazdu",
        yAxisLabel: "Odchylenie Δ od normy",
        xRange: { min: 0, max: 100 },
        yRange: { min: -100, max: 100 },
        colorMap: {
          green: "#22c55e",
          yellow: "#eab308",
          orange: "#f97316",
          red: "#ef4444",
          darkred: "#7f1d1d",
        },
        sizeScale: { min: 8, max: 64 },
      },
      bubbles: [],
      history: [],
    },
    eventCount: 0,
  };
}

/**
 * Przetwarza jedno zdarzenie przez pełny cykl SB/SP:
 * Identyfikacja → Analiza → Synteza → Ocena
 */
export function processSB_SP_Event(
  input: SB_SP_Input,
  context: SB_SP_Context
): { event: SB_SP_Event; context: SB_SP_Context } {
  const timestamp = input.timestamp ?? new Date().toISOString();
  const eventIndex = input.eventIndex ?? context.eventCount;
  const totalEvents = input.totalEvents ?? eventIndex + 1;

  // ------------------------------------------------------------------
  // FAZA 1: IDENTYFIKACJA — zbieranie WR, pobieranie WP, obliczanie Δ
  // ------------------------------------------------------------------

  const cognitiveWR = extractCognitiveWR(input.cognitive);
  const cognitiveWP = computeCognitiveWP(input.cognitive, input.roadType);
  const cognitiveDelta = computeCognitiveDelta(cognitiveWR, cognitiveWP);

  const speedLimitKmh = getSpeedLimitForRoad(input.roadType);
  const safeDistanceM = getSafeDistanceForRoad(
    input.cognitive.gps.speedKmh,
    input.roadType
  );

  const decisionWR = extractDecisionWR(input.decision);
  const decisionWP = computeDecisionWP(speedLimitKmh, safeDistanceM);
  const decisionDelta = computeDecisionDelta(decisionWR, decisionWP);

  const identification = buildIdentificationSummary(
    cognitiveDelta,
    decisionDelta
  );

  // ------------------------------------------------------------------
  // FAZA 2: ANALIZA — ocena zgodności, wykrywanie odchyleń
  // ------------------------------------------------------------------

  const report = generateComplianceReport({
    actualSpeedKmh: input.decision.speed.WR,
    roadType: input.roadType,
    actualDistanceM: input.decision.objectDistance.WR,
    reactionTimeMs: input.decision.reactionTime.WR,
    signReactions: input.decision.signReactions.map((sr) => ({
      signId: sr.signId,
      complied: sr.complied,
      reactionTimeMs: sr.reactionTimeMs,
    })),
  });

  const analysis = buildAnalysisSummary(report);

  // ------------------------------------------------------------------
  // FAZA 3: SYNTEZA — łączenie percepcji i decyzji, wnioski
  // ------------------------------------------------------------------

  const synthesis = buildSynthesisSummary(
    input.cognitive,
    input.decision,
    report
  );

  // ------------------------------------------------------------------
  // FAZA 4: OCENA — klasyfikacja, wizualizacja
  // ------------------------------------------------------------------

  const classification = classifySituation(report.overallRiskScore);
  const evaluation = buildEvaluationSummary(classification, report);

  // ------------------------------------------------------------------
  // Tworzenie zdarzenia SB/SP
  // ------------------------------------------------------------------

  const timeProgress =
    totalEvents > 1
      ? Math.round((eventIndex / (totalEvents - 1)) * 100)
      : 50;

  const sbSpReflection: SB_SP_Reflection = {
    identification,
    analysis,
    synthesis,
    evaluation,
    classification,
  };

  // Tworzymy tymczasowe zdarzenie do wygenerowania bąbelka
  const tempEvent: SB_SP_Event = {
    timestamp,
    rideId: input.rideId,
    location: {
      lat: input.cognitive.gps.lat,
      lon: input.cognitive.gps.lon,
      speedKmh: input.cognitive.gps.speedKmh,
      heading: input.cognitive.gps.heading,
    },
    cognitive: {
      WR: cognitiveWR,
      WP: cognitiveWP,
      delta: cognitiveDelta,
    },
    decision: {
      WR: decisionWR,
      WP: decisionWP,
      delta: decisionDelta,
    },
    compliance: {
      roadCodeReference: report.speed.roadCodeReference,
      description: report.summary,
      deviationLevel: report.overallDeviationLevel,
      riskScore: report.overallRiskScore,
      correctionSuggestion:
        report.speed.correctionSuggestion ||
        report.distance.correctionSuggestion ||
        report.reactionTime.correctionSuggestion ||
        "",
    },
    visualization: generateBubble(
      {
        ...tempEventPlaceholder(),
        cognitive: { WR: cognitiveWR, WP: cognitiveWP, delta: cognitiveDelta },
        decision: { WR: decisionWR, WP: decisionWP, delta: decisionDelta },
        compliance: {
          roadCodeReference: report.speed.roadCodeReference,
          description: report.summary,
          deviationLevel: report.overallDeviationLevel,
          riskScore: report.overallRiskScore,
          correctionSuggestion: "",
        },
      } as SB_SP_Event,
      timeProgress
    ),
    sb_sp_framework: sbSpReflection,
  };

  // Generuj bąbelek z poprawnym eventem
  const bubble = generateBubble(tempEvent, timeProgress);

  const event: SB_SP_Event = {
    ...tempEvent,
    visualization: bubble,
  };

  // Aktualizacja bazy wiedzy
  const updatedKB = recordEvent(context.knowledgeBase, event);

  // Aktualizacja stanu wykresu
  const updatedChart: BubbleChartState = {
    ...context.chartState,
    lastUpdated: new Date().toISOString(),
    bubbles: [...context.chartState.bubbles, bubble],
    history: [...context.chartState.history, [...context.chartState.bubbles]].slice(-20),
  };

  const updatedContext: SB_SP_Context = {
    knowledgeBase: updatedKB,
    chartState: updatedChart,
    eventCount: context.eventCount + 1,
  };

  return { event, context: updatedContext };
}

/** Placeholder do inicjalizacji pola visualization */
function tempEventPlaceholder(): Partial<SB_SP_Event> {
  return {
    visualization: {
      attributeName: "",
      size: 0,
      color: "green",
      position: { x: 0, y: 0 },
      opacity: 1,
    },
  } as Partial<SB_SP_Event>;
}

// ---------------------------------------------------------------------------
// Przetwarzanie wielu zdarzeń
// ---------------------------------------------------------------------------

/** Przetwarza listę zdarzeń wsadowo */
export function processSB_SP_Batch(
  inputs: SB_SP_Input[]
): { events: SB_SP_Event[]; context: SB_SP_Context } {
  if (inputs.length === 0) {
    throw new Error("Batch cannot be empty");
  }

  let context = createSB_SP_Context(inputs[0]!.rideId);

  const events: SB_SP_Event[] = [];

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i]!;
    const result = processSB_SP_Event(
      {
        ...input,
        eventIndex: i,
        totalEvents: inputs.length,
      },
      context
    );
    events.push(result.event);
    context = result.context;
  }

  return { events, context };
}

// ---------------------------------------------------------------------------
// Pomocnicze: limity prędkości i odległości
// ---------------------------------------------------------------------------

function getSpeedLimitForRoad(roadType: RoadType): number {
  const limits: Record<RoadType, number> = {
    built_up: 50,
    non_built_up: 90,
    expressway_single: 100,
    expressway_dual: 120,
    motorway: 140,
  };
  return limits[roadType];
}

function getSafeDistanceForRoad(speedKmh: number, _roadType: RoadType): number {
  // Reguła 2 sekund
  return (speedKmh / 3.6) * 2;
}

// ---------------------------------------------------------------------------
// Pomocnicze: budowanie podsumowań
// ---------------------------------------------------------------------------

function buildIdentificationSummary(
  cognitiveDelta: Record<string, number>,
  decisionDelta: Record<string, number>
): string {
  const allDeltas = { ...cognitiveDelta, ...decisionDelta };
  const significantDeltas = Object.entries(allDeltas)
    .filter(([, v]) => Math.abs(v) > 0)
    .map(([k, v]) => `${k}: Δ=${v.toFixed(1)}`)
    .slice(0, 5);

  if (significantDeltas.length === 0) {
    return "Brak istotnych odchyleń od normy.";
  }

  return `Zidentyfikowano odchylenia: ${significantDeltas.join(", ")}.`;
}

function buildAnalysisSummary(report: {
  overallRiskScore: number;
  overallDeviationLevel: string;
  summary: string;
}): string {
  return `Poziom odchylenia: ${report.overallDeviationLevel}, ryzyko: ${report.overallRiskScore}/100. ${report.summary}`;
}

function buildSynthesisSummary(
  cognitive: CognitiveTrack,
  decision: DecisionTrack,
  report: { overallRiskScore: number }
): string {
  const speedExcess = decision.speed.delta;
  const visibility = cognitive.environment.visibilityM;
  const weather = cognitive.environment.weather;

  const parts: string[] = [];

  if (speedExcess > 0 && visibility < 500) {
    parts.push(
      "Przekroczenie prędkości przy ograniczonej widoczności — zwiększone ryzyko kolizji."
    );
  }

  if (weather !== "clear" && speedExcess > 10) {
    parts.push(
      "Niedostosowanie prędkości do warunków pogodowych."
    );
  }

  if (report.overallRiskScore > 60) {
    parts.push(
      "Kumulacja czynników ryzyka wymaga natychmiastowej korekty zachowania."
    );
  }

  return parts.length > 0
    ? parts.join(" ")
    : "Warunki i zachowanie kierowcy zrównoważone.";
}

function buildEvaluationSummary(
  classification: "safe" | "risky" | "critical",
  report: { overallRiskScore: number }
): string {
  switch (classification) {
    case "safe":
      return `Sytuacja bezpieczna (ryzyko: ${report.overallRiskScore}/100).`;
    case "risky":
      return `Sytuacja ryzykowna (ryzyko: ${report.overallRiskScore}/100). Zalecana korekta.`;
    case "critical":
      return `SYTUACJA KRYTYCZNA (ryzyko: ${report.overallRiskScore}/100). Natychmiastowa interwencja zalecana!`;
  }
}

function classifySituation(riskScore: number): "safe" | "risky" | "critical" {
  if (riskScore >= 75) return "critical";
  if (riskScore >= 35) return "risky";
  return "safe";
}
