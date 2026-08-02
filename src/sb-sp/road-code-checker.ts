// =============================================================================
// Pilot Zaufania — Kodeks drogowy: analiza zgodności
// =============================================================================
// Sprawdza zgodność parametrów jazdy z kodeksem drogowym danego kraju.
// Na podstawie WR i WP tworzy ComplianceResult z oceną odchylenia.
//
// Agent: Road Sign Interpreter
// =============================================================================

import type { ComplianceResult, DeviationLevel } from "../types/sb-sp";
import type { RoadType } from "../types/road-code";
import {
  getSpeedLimits,
  SAFETY_DISTANCES,
  REACTION_TIME_NORMS,
  ROAD_SIGNS_PL,
} from "../types/road-code";

// ---------------------------------------------------------------------------
// Analiza prędkości
// ---------------------------------------------------------------------------

/** Sprawdza zgodność prędkości z limitem dla danego typu drogi */
export function checkSpeedCompliance(
  actualSpeedKmh: number,
  roadType: RoadType,
  country: "PL" = "PL"
): ComplianceResult {
  const limits = getSpeedLimits(country);
  const limit = limits[roadType];
  const overspeed = actualSpeedKmh - limit;

  if (overspeed <= 0) {
    return {
      roadCodeReference: "Art. 20 PoRD",
      description: `Prędkość ${actualSpeedKmh} km/h — zgodna z limitem ${limit} km/h`,
      deviationLevel: "none",
      riskScore: 0,
      correctionSuggestion: "",
    };
  }

  const deviationLevel = classifySpeedDeviation(overspeed);
  const riskScore = computeSpeedRiskScore(overspeed);

  return {
    roadCodeReference: "Art. 20 PoRD",
    description: `Przekroczenie prędkości o ${overspeed} km/h (limit: ${limit} km/h)`,
    deviationLevel,
    riskScore,
    correctionSuggestion: `Zmniejsz prędkość do ${limit} km/h.`,
  };
}

function classifySpeedDeviation(overspeedKmh: number): DeviationLevel {
  if (overspeedKmh <= 10) return "minor";
  if (overspeedKmh <= 20) return "moderate";
  if (overspeedKmh <= 30) return "major";
  return "critical";
}

function computeSpeedRiskScore(overspeedKmh: number): number {
  // 0–100: przy 50 km/h ponad limit = 100
  return Math.min(100, Math.round((overspeedKmh / 50) * 100));
}

// ---------------------------------------------------------------------------
// Analiza odległości od obiektów
// ---------------------------------------------------------------------------

/** Sprawdza zgodność odległości od poprzedzającego pojazdu */
export function checkDistanceCompliance(
  actualDistanceM: number,
  speedKmh: number,
  roadType: RoadType
): ComplianceResult {
  const safeDistance = SAFETY_DISTANCES.twoSecondRule(speedKmh);
  const deficit = safeDistance - actualDistanceM;

  if (deficit <= 0) {
    return {
      roadCodeReference: "Art. 19 PoRD",
      description: `Odległość ${actualDistanceM.toFixed(1)} m — bezpieczna (wymagane ${safeDistance.toFixed(1)} m)`,
      deviationLevel: "none",
      riskScore: 0,
      correctionSuggestion: "",
    };
  }

  const deviationLevel = classifyDistanceDeviation(deficit, safeDistance);
  const riskScore = computeDistanceRiskScore(deficit, safeDistance);

  return {
    roadCodeReference: "Art. 19 PoRD",
    description: `Zbyt mała odległość: ${actualDistanceM.toFixed(1)} m (wymagane ${safeDistance.toFixed(1)} m, brakuje ${deficit.toFixed(1)} m)`,
    deviationLevel,
    riskScore,
    correctionSuggestion: `Zwiększ odległość do minimum ${safeDistance.toFixed(0)} m.`,
  };
}

function classifyDistanceDeviation(
  deficitM: number,
  safeDistanceM: number
): DeviationLevel {
  const ratio = deficitM / safeDistanceM;
  if (ratio <= 0.25) return "minor";
  if (ratio <= 0.5) return "moderate";
  if (ratio <= 0.75) return "major";
  return "critical";
}

function computeDistanceRiskScore(
  deficitM: number,
  safeDistanceM: number
): number {
  return Math.min(100, Math.round((deficitM / safeDistanceM) * 100));
}

// ---------------------------------------------------------------------------
// Analiza czasu reakcji
// ---------------------------------------------------------------------------

/** Sprawdza, czy czas reakcji jest akceptowalny */
export function checkReactionTimeCompliance(
  reactionTimeMs: number
): ComplianceResult {
  const excess = reactionTimeMs - REACTION_TIME_NORMS.averageMs;

  if (excess <= 0) {
    return {
      roadCodeReference: "Ogólne zasady bezpieczeństwa",
      description: `Czas reakcji ${reactionTimeMs} ms — w normie`,
      deviationLevel: "none",
      riskScore: 0,
      correctionSuggestion: "",
    };
  }

  if (reactionTimeMs > REACTION_TIME_NORMS.dangerousThresholdMs) {
    return {
      roadCodeReference: "Ogólne zasady bezpieczeństwa",
      description: `Czas reakcji ${reactionTimeMs} ms — NIEBEZPIECZNIE długi (próg: ${REACTION_TIME_NORMS.dangerousThresholdMs} ms)`,
      deviationLevel: "critical",
      riskScore: 90,
      correctionSuggestion:
        "Czas reakcji wskazuje na zmęczenie lub rozproszenie. Zalecana przerwa.",
    };
  }

  const deviationLevel = classifyReactionDeviation(excess);
  const riskScore = computeReactionRiskScore(reactionTimeMs);

  return {
    roadCodeReference: "Ogólne zasady bezpieczeństwa",
    description: `Czas reakcji ${reactionTimeMs} ms — podwyższony (norma: ${REACTION_TIME_NORMS.averageMs} ms)`,
    deviationLevel,
    riskScore,
    correctionSuggestion: "Zwiększ koncentrację na drodze.",
  };
}

function classifyReactionDeviation(excessMs: number): DeviationLevel {
  if (excessMs <= 200) return "minor";
  if (excessMs <= 400) return "moderate";
  return "major";
}

function computeReactionRiskScore(reactionTimeMs: number): number {
  if (reactionTimeMs <= REACTION_TIME_NORMS.averageMs) return 0;
  return Math.min(
    100,
    Math.round(
      ((reactionTimeMs - REACTION_TIME_NORMS.averageMs) /
        REACTION_TIME_NORMS.dangerousThresholdMs) *
        100
    )
  );
}

// ---------------------------------------------------------------------------
// Analiza zgodności ze znakami
// ---------------------------------------------------------------------------

/** Rezultat analizy pojedynczej reakcji na znak */
export interface SignComplianceResult {
  signId: string;
  signName: string;
  complied: boolean;
  violation?: string;
  riskScore: number;
}

/** Sprawdza zgodność reakcji na znak drogowy */
export function checkSignCompliance(
  signId: string,
  complied: boolean,
  reactionTimeMs: number
): SignComplianceResult {
  const signDef = ROAD_SIGNS_PL.find((s) => s.id === signId);
  const signName = signDef?.name ?? signId;

  if (complied) {
    return { signId, signName, complied: true, riskScore: 0 };
  }

  return {
    signId,
    signName,
    complied: false,
    violation: `Niezastosowanie się do znaku ${signId} (${signName})`,
    riskScore: signDef?.type === "prohibition" ? 70 : 40,
  };
}

// ---------------------------------------------------------------------------
// Agregacja — pełna ocena zgodności
// ---------------------------------------------------------------------------

/** Wynik pełnej kontroli zgodności z kodeksem */
export interface ComplianceReport {
  speed: ComplianceResult;
  distance: ComplianceResult;
  reactionTime: ComplianceResult;
  signViolations: SignComplianceResult[];
  overallRiskScore: number;
  overallDeviationLevel: DeviationLevel;
  summary: string;
}

/** Generuje pełny raport zgodności z kodeksem */
export function generateComplianceReport(params: {
  actualSpeedKmh: number;
  roadType: RoadType;
  actualDistanceM: number;
  reactionTimeMs: number;
  signReactions: Array<{ signId: string; complied: boolean; reactionTimeMs: number }>;
}): ComplianceReport {
  const speed = checkSpeedCompliance(params.actualSpeedKmh, params.roadType);
  const distance = checkDistanceCompliance(
    params.actualDistanceM,
    params.actualSpeedKmh,
    params.roadType
  );
  const reaction = checkReactionTimeCompliance(params.reactionTimeMs);
  const signViolations = params.signReactions
    .map((sr) => checkSignCompliance(sr.signId, sr.complied, sr.reactionTimeMs))
    .filter((s) => !s.complied);

  const scores = [
    speed.riskScore,
    distance.riskScore,
    reaction.riskScore,
    ...signViolations.map((s) => s.riskScore),
  ];

  const overallRiskScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

  const overallDeviationLevel = classifyOverallDeviation(
    speed.deviationLevel,
    distance.deviationLevel,
    reaction.deviationLevel,
    signViolations.length
  );

  const summary = buildSummary(
    overallRiskScore,
    overallDeviationLevel,
    signViolations
  );

  return {
    speed,
    distance,
    reactionTime: reaction,
    signViolations,
    overallRiskScore,
    overallDeviationLevel,
    summary,
  };
}

function classifyOverallDeviation(
  speedLevel: DeviationLevel,
  distanceLevel: DeviationLevel,
  reactionLevel: DeviationLevel,
  signViolationCount: number
): DeviationLevel {
  const levels: DeviationLevel[] = [speedLevel, distanceLevel, reactionLevel];
  const severity: Record<DeviationLevel, number> = {
    none: 0,
    minor: 1,
    moderate: 2,
    major: 3,
    critical: 4,
  };

  const maxSeverity = Math.max(
    ...levels.map((l) => severity[l]),
    signViolationCount > 2 ? 3 : signViolationCount > 0 ? 2 : 0
  );

  const entry = Object.entries(severity).find(([, v]) => v === maxSeverity);
  return (entry?.[0] as DeviationLevel) ?? "none";
}

function buildSummary(
  riskScore: number,
  level: DeviationLevel,
  violations: SignComplianceResult[]
): string {
  if (level === "none" || level === "minor") {
    return "Jazda zgodna z przepisami. Brak istotnych naruszeń.";
  }
  if (level === "moderate") {
    return `Wykryto umiarkowane odchylenia od norm (ryzyko: ${riskScore}/100).${
      violations.length > 0
        ? ` Naruszenia znaków: ${violations.map((v) => v.signId).join(", ")}.`
        : ""
    }`;
  }
  if (level === "major") {
    return `Poważne naruszenia przepisów (ryzyko: ${riskScore}/100). Wymagana korekta zachowań.`;
  }
  return `KRYTYCZNE naruszenia bezpieczeństwa (ryzyko: ${riskScore}/100). Natychmiastowa korekta wymagana!`;
}
