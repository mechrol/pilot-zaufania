// =============================================================================
// Pilot Zaufania — Tor decyzyjny (Decision Track)
// =============================================================================
// Rejestruje i analizuje decyzje kierowcy: reakcje na znaki, wybór prędkości,
// manewry, czas reakcji. Tworzy WR/WP/Δ dla toru decyzyjnego.
//
// Agenci: Driver Decision Analyzer, Risk & Collision Forecaster
// =============================================================================

import type {
  DecisionTrack,
  WR_WP_Delta,
  SignReaction,
  Maneuver,
} from "../types/sb-sp";
import { REACTION_TIME_NORMS } from "../types/road-code";

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/** Tworzy pusty tor decyzyjny */
export function createEmptyDecisionTrack(): DecisionTrack {
  return {
    signReactions: [],
    speed: { WR: 0, WP: 0, delta: 0 },
    accelerationBraking: { WR: 0, WP: 0, delta: 0 },
    objectDistance: { WR: 0, WP: 0, delta: 0 },
    reactionTime: { WR: 0, WP: 0, delta: 0 },
    maneuvers: [],
    collisionRiskDecisions: [],
  };
}

// ---------------------------------------------------------------------------
// Prędkość
// ---------------------------------------------------------------------------

/** Aktualizuje prędkość w torze decyzyjnym */
export function updateSpeed(
  track: DecisionTrack,
  actualSpeedKmh: number,
  speedLimitKmh: number
): DecisionTrack {
  return {
    ...track,
    speed: {
      WR: actualSpeedKmh,
      WP: speedLimitKmh,
      delta: actualSpeedKmh - speedLimitKmh,
    },
  };
}

// ---------------------------------------------------------------------------
// Przyspieszenie / hamowanie
// ---------------------------------------------------------------------------

/** Aktualizuje dane przyspieszenia/hamowania */
export function updateAccelerationBraking(
  track: DecisionTrack,
  actualMs2: number,
  safeMaxMs2: number = 3.0
): DecisionTrack {
  return {
    ...track,
    accelerationBraking: {
      WR: Math.abs(actualMs2),
      WP: safeMaxMs2,
      delta: Math.abs(actualMs2) - safeMaxMs2,
    },
  };
}

// ---------------------------------------------------------------------------
// Odległość od obiektów
// ---------------------------------------------------------------------------

/** Aktualizuje odległość od obiektów */
export function updateObjectDistance(
  track: DecisionTrack,
  actualDistanceM: number,
  safeDistanceM: number
): DecisionTrack {
  return {
    ...track,
    objectDistance: {
      WR: actualDistanceM,
      WP: safeDistanceM,
      delta: actualDistanceM - safeDistanceM,
    },
  };
}

// ---------------------------------------------------------------------------
// Czas reakcji
// ---------------------------------------------------------------------------

/** Aktualizuje czas reakcji kierowcy */
export function updateReactionTime(
  track: DecisionTrack,
  actualReactionMs: number
): DecisionTrack {
  return {
    ...track,
    reactionTime: {
      WR: actualReactionMs,
      WP: REACTION_TIME_NORMS.averageMs,
      delta: actualReactionMs - REACTION_TIME_NORMS.averageMs,
    },
  };
}

// ---------------------------------------------------------------------------
// Reakcje na znaki
// ---------------------------------------------------------------------------

/** Rejestruje reakcję na znak drogowy */
export function recordSignReaction(
  track: DecisionTrack,
  reaction: SignReaction
): DecisionTrack {
  return {
    ...track,
    signReactions: [...track.signReactions, reaction],
  };
}

// ---------------------------------------------------------------------------
// Manewry
// ---------------------------------------------------------------------------

/** Rejestruje manewr */
export function recordManeuver(
  track: DecisionTrack,
  maneuver: Maneuver
): DecisionTrack {
  return {
    ...track,
    maneuvers: [...track.maneuvers, maneuver],
  };
}

// ---------------------------------------------------------------------------
// Decyzje ryzykowne
// ---------------------------------------------------------------------------

/** Rejestruje decyzję zwiększającą ryzyko kolizji */
export function recordCollisionRiskDecision(
  track: DecisionTrack,
  decision: string
): DecisionTrack {
  return {
    ...track,
    collisionRiskDecisions: [...track.collisionRiskDecisions, decision],
  };
}

// ---------------------------------------------------------------------------
// Wykrywanie ryzykownych zachowań
// ---------------------------------------------------------------------------

/** Sprawdza, czy prędkość przekracza limit */
export function isSpeeding(speed: WR_WP_Delta): boolean {
  return speed.delta > 0;
}

/** Sprawdza, czy odległość od obiektu jest niebezpieczna */
export function isTooClose(distance: WR_WP_Delta): boolean {
  return distance.delta < 0;
}

/** Sprawdza, czy czas reakcji jest niebezpiecznie długi */
export function isReactionTooSlow(reactionTime: WR_WP_Delta): boolean {
  return reactionTime.WR > REACTION_TIME_NORMS.dangerousThresholdMs;
}

/** Sprawdza, czy przyspieszenie/hamowanie jest zbyt gwałtowne */
export function isAccelerationTooAggressive(ab: WR_WP_Delta): boolean {
  return ab.delta > 1.0;
}

// ---------------------------------------------------------------------------
// WR — ekstrakcja
// ---------------------------------------------------------------------------

/** Ekstrahuje WR (wartości rzeczywiste) z toru decyzyjnego */
export function extractDecisionWR(
  track: DecisionTrack
): Record<string, unknown> {
  return {
    speedKmh: track.speed.WR,
    accelerationMs2: track.accelerationBraking.WR,
    objectDistanceM: track.objectDistance.WR,
    reactionTimeMs: track.reactionTime.WR,
    signReactions: track.signReactions,
    maneuvers: track.maneuvers.map((m) => m.type),
    unsafeManeuvers: track.maneuvers.filter((m) => !m.safe).length,
    collisionRiskDecisions: track.collisionRiskDecisions,
    collisionRiskCount: track.collisionRiskDecisions.length,
  };
}

// ---------------------------------------------------------------------------
// WP — wartości postulowane
// ---------------------------------------------------------------------------

/** Tworzy WP dla toru decyzyjnego na podstawie norm */
export function computeDecisionWP(
  speedLimitKmh: number,
  safeDistanceM: number
): Record<string, unknown> {
  return {
    speedKmh: speedLimitKmh,
    accelerationMs2: 3.0,
    objectDistanceM: safeDistanceM,
    reactionTimeMs: REACTION_TIME_NORMS.averageMs,
    expectedCompliance: "full",
  };
}

// ---------------------------------------------------------------------------
// Δ — obliczanie odchyleń
// ---------------------------------------------------------------------------

/** Oblicza Δ dla toru decyzyjnego */
export function computeDecisionDelta(
  wr: Record<string, unknown>,
  wp: Record<string, unknown>
): Record<string, number> {
  const delta: Record<string, number> = {};

  for (const key of Object.keys(wr)) {
    const wrVal = wr[key];
    const wpVal = wp[key];
    if (typeof wrVal === "number" && typeof wpVal === "number") {
      delta[key] = wrVal - wpVal;
    }
  }

  return delta;
}
