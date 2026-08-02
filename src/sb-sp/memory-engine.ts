// =============================================================================
// Pilot Zaufania — Memory Engine (pamięć refleksyjna)
// =============================================================================
// Zapisuje WR/WP/Δ oraz SB/SP do refleksyjnej bazy wiedzy.
// Buduje pamięć długoterminową: metryki bezpieczeństwa, wzorce zachowań,
// rekomendacje korekcyjne.
//
// Agent: Memory Engineer
// =============================================================================

import type {
  KnowledgeBase,
  SB_SP_Event,
  SafetyMetrics,
  BehaviorPattern,
} from "../types/sb-sp.js";

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/** Tworzy nową bazę wiedzy dla przejazdu */
export function createKnowledgeBase(rideId: string): KnowledgeBase {
  return {
    rideId,
    events: [],
    metrics: createEmptyMetrics(),
    behaviorPatterns: [],
    recommendations: [],
  };
}

function createEmptyMetrics(): SafetyMetrics {
  return {
    averageRiskScore: 0,
    criticalEvents: 0,
    riskyEvents: 0,
    safeEvents: 0,
    complianceRate: 100,
    avgSpeedDeviation: 0,
    avgReactionTimeMs: 0,
  };
}

// ---------------------------------------------------------------------------
// Zapis zdarzeń
// ---------------------------------------------------------------------------

/** Dodaje zdarzenie do bazy wiedzy i aktualizuje metryki */
export function recordEvent(
  kb: KnowledgeBase,
  event: SB_SP_Event
): KnowledgeBase {
  const events = [...kb.events, event];
  const metrics = recomputeMetrics(events);
  const behaviorPatterns = detectPatterns(events);
  const recommendations = generateRecommendations(metrics, behaviorPatterns);

  return {
    ...kb,
    events,
    metrics,
    behaviorPatterns,
    recommendations,
  };
}

// ---------------------------------------------------------------------------
// Przeliczanie metryk bezpieczeństwa
// ---------------------------------------------------------------------------

function recomputeMetrics(events: SB_SP_Event[]): SafetyMetrics {
  if (events.length === 0) return createEmptyMetrics();

  const riskScores = events.map((e) => e.compliance.riskScore);
  const averageRiskScore = Math.round(
    riskScores.reduce((a, b) => a + b, 0) / riskScores.length
  );

  const criticalEvents = events.filter(
    (e) => e.sb_sp_framework.classification === "critical"
  ).length;
  const riskyEvents = events.filter(
    (e) => e.sb_sp_framework.classification === "risky"
  ).length;
  const safeEvents = events.filter(
    (e) => e.sb_sp_framework.classification === "safe"
  ).length;

  const complianceRate =
    events.length > 0
      ? Math.round(
          (events.filter((e) => e.compliance.deviationLevel === "none").length /
            events.length) *
            100
        )
      : 100;

  const speedDeltas = events
    .map((e) => e.decision.delta["speedKmh"])
    .filter((d): d is number => d !== undefined);
  const avgSpeedDeviation =
    speedDeltas.length > 0
      ? Math.round(
          speedDeltas.reduce((a, b) => a + b, 0) / speedDeltas.length
        )
      : 0;

  const reactionTimes = events
    .map((e) => e.decision.WR["reactionTimeMs"])
    .filter((r): r is number => typeof r === "number");
  const avgReactionTimeMs =
    reactionTimes.length > 0
      ? Math.round(
          reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
        )
      : 0;

  return {
    averageRiskScore,
    criticalEvents,
    riskyEvents,
    safeEvents,
    complianceRate,
    avgSpeedDeviation,
    avgReactionTimeMs,
  };
}

// ---------------------------------------------------------------------------
// Detekcja wzorców zachowań
// ---------------------------------------------------------------------------

function detectPatterns(events: SB_SP_Event[]): BehaviorPattern[] {
  if (events.length < 3) return [];

  const patterns: BehaviorPattern[] = [];

  // Wykrywanie tendencji do przekraczania prędkości
  const speedingEvents = events.filter((e) => {
    const speedDelta = e.decision.delta["speedKmh"];
    return typeof speedDelta === "number" && speedDelta > 5;
  });

  if (speedingEvents.length >= 2) {
    patterns.push({
      name: "Tendencja do przekraczania prędkości",
      frequency: speedingEvents.length / events.length,
      avgRisk: Math.round(
        speedingEvents.reduce((a, e) => a + e.compliance.riskScore, 0) /
          speedingEvents.length
      ),
      relatedEventIndices: speedingEvents.map((_, i) =>
        events.indexOf(speedingEvents[i]!)
      ),
    });
  }

  // Wykrywanie wolnego czasu reakcji
  const slowReactionEvents = events.filter((e) => {
    const rt = e.decision.WR["reactionTimeMs"];
    return typeof rt === "number" && rt > 1200;
  });

  if (slowReactionEvents.length >= 2) {
    patterns.push({
      name: "Wydłużony czas reakcji",
      frequency: slowReactionEvents.length / events.length,
      avgRisk: Math.round(
        slowReactionEvents.reduce((a, e) => a + e.compliance.riskScore, 0) /
          slowReactionEvents.length
      ),
      relatedEventIndices: slowReactionEvents.map((_, i) =>
        events.indexOf(slowReactionEvents[i]!)
      ),
    });
  }

  // Wykrywanie ryzykownych manewrów
  const riskManeuverEvents = events.filter((e) => {
    const unsafeCount = e.decision.WR["unsafeManeuvers"];
    return typeof unsafeCount === "number" && unsafeCount > 0;
  });

  if (riskManeuverEvents.length >= 2) {
    patterns.push({
      name: "Ryzykowne manewry",
      frequency: riskManeuverEvents.length / events.length,
      avgRisk: Math.round(
        riskManeuverEvents.reduce((a, e) => a + e.compliance.riskScore, 0) /
          riskManeuverEvents.length
      ),
      relatedEventIndices: riskManeuverEvents.map((_, i) =>
        events.indexOf(riskManeuverEvents[i]!)
      ),
    });
  }

  return patterns;
}

// ---------------------------------------------------------------------------
// Generowanie rekomendacji
// ---------------------------------------------------------------------------

function generateRecommendations(
  metrics: SafetyMetrics,
  patterns: BehaviorPattern[]
): string[] {
  const recommendations: string[] = [];

  if (metrics.averageRiskScore > 50) {
    recommendations.push(
      "Wysoki poziom ryzyka — rozważ dodatkowe szkolenie z bezpiecznej jazdy."
    );
  }

  if (metrics.avgSpeedDeviation > 10) {
    recommendations.push(
      `Średnie przekroczenie prędkości: ${metrics.avgSpeedDeviation} km/h. Zwróć uwagę na przestrzeganie ograniczeń.`
    );
  }

  if (metrics.avgReactionTimeMs > 1200) {
    recommendations.push(
      "Wydłużony średni czas reakcji — może wskazywać na zmęczenie. Rozważ regularne przerwy."
    );
  }

  if (metrics.complianceRate < 80) {
    recommendations.push(
      `Niski poziom zgodności z kodeksem (${metrics.complianceRate}%). Przejrzyj najczęstsze naruszenia.`
    );
  }

  for (const pattern of patterns) {
    if (pattern.frequency > 0.5 && pattern.avgRisk > 40) {
      recommendations.push(
        `Częsty wzorzec: "${pattern.name}" — ${Math.round(pattern.frequency * 100)}% przejazdów. Ryzyko: ${pattern.avgRisk}/100.`
      );
    }
  }

  if (recommendations.length === 0) {
    recommendations.push("Jazda zgodna z normami. Kontynuuj bezpieczną praktykę.");
  }

  return recommendations;
}

// ---------------------------------------------------------------------------
// Eksport bazy wiedzy
// ---------------------------------------------------------------------------

/** Eksportuje bazę wiedzy jako obiekt JSON gotowy do serializacji */
export function exportKnowledgeBase(kb: KnowledgeBase): string {
  return JSON.stringify(kb, null, 2);
}

/** Ładuje bazę wiedzy z JSON */
export function importKnowledgeBase(json: string): KnowledgeBase {
  return JSON.parse(json) as KnowledgeBase;
}
