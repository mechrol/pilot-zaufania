// =============================================================================
// Pilot Zaufania — Schematy Zod: SB/SP Framework
// =============================================================================

import { z } from "zod";

// ---------------------------------------------------------------------------
// WR / WP / Δ
// ---------------------------------------------------------------------------

export const wrWpDeltaSchema = z.object({
  WR: z.number(),
  WP: z.number(),
  delta: z.number(),
});

// ---------------------------------------------------------------------------
// Tor poznawczy
// ---------------------------------------------------------------------------

export const cognitiveGPSSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  speedKmh: z.number().min(0),
  heading: z.number().min(0).max(360),
});

export const cameraDataSchema = z.object({
  objects: z.array(z.string()),
  signs: z.array(z.string()),
  lanes: z.array(z.string()),
  pedestrianCount: z.number().int().min(0),
  vehicleCount: z.number().int().min(0),
});

export const radarLidarDataSchema = z.object({
  distancesM: z.array(z.number().min(0)),
  objectSpeedsKmh: z.array(z.number()),
});

export const environmentalConditionsSchema = z.object({
  weather: z.enum(["clear", "rain", "snow", "fog", "storm"]),
  traffic: z.enum(["light", "moderate", "heavy", "standstill"]),
  visibilityM: z.number().min(0),
  timeOfDay: z.enum(["day", "dusk", "night", "dawn"]),
  roadSurface: z.enum(["dry", "wet", "icy", "snow_covered"]),
});

export const cognitiveTrackSchema = z.object({
  gps: cognitiveGPSSchema,
  camera: cameraDataSchema.optional(),
  radarLidar: radarLidarDataSchema.optional(),
  passengerObservations: z.array(z.string()).default([]),
  routineObjects: z.array(z.string()).default([]),
  environment: environmentalConditionsSchema,
});

// ---------------------------------------------------------------------------
// Tor decyzyjny
// ---------------------------------------------------------------------------

export const signReactionSchema = z.object({
  signId: z.string().min(1),
  signType: z.enum(["warning", "prohibition", "mandatory", "information"]),
  complied: z.boolean(),
  reactionTimeMs: z.number().min(0),
});

export const maneuverTypeSchema = z.enum([
  "lane_change_left",
  "lane_change_right",
  "turn_left",
  "turn_right",
  "u_turn",
  "overtake",
  "merge",
  "exit",
  "stop",
  "park",
]);

export const maneuverSchema = z.object({
  type: maneuverTypeSchema,
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
  safe: z.boolean(),
});

export const decisionTrackSchema = z.object({
  signReactions: z.array(signReactionSchema).default([]),
  speed: wrWpDeltaSchema,
  accelerationBraking: wrWpDeltaSchema,
  objectDistance: wrWpDeltaSchema,
  reactionTime: wrWpDeltaSchema,
  maneuvers: z.array(maneuverSchema).default([]),
  collisionRiskDecisions: z.array(z.string()).default([]),
});

// ---------------------------------------------------------------------------
// Zgodność z kodeksem
// ---------------------------------------------------------------------------

export const deviationLevelSchema = z.enum([
  "none",
  "minor",
  "moderate",
  "major",
  "critical",
]);

export const complianceResultSchema = z.object({
  roadCodeReference: z.string(),
  description: z.string(),
  deviationLevel: deviationLevelSchema,
  riskScore: z.number().min(0).max(100),
  correctionSuggestion: z.string(),
});

// ---------------------------------------------------------------------------
// Wizualizacja bąbelkowa
// ---------------------------------------------------------------------------

export const riskColorSchema = z.enum([
  "green",
  "yellow",
  "orange",
  "red",
  "darkred",
]);

export const bubbleVisualizationSchema = z.object({
  attributeName: z.string(),
  size: z.number().min(0),
  color: riskColorSchema,
  position: z.object({ x: z.number(), y: z.number() }),
  opacity: z.number().min(0).max(1),
});

// ---------------------------------------------------------------------------
// SB/SP Reflection
// ---------------------------------------------------------------------------

export const sbSpPhaseSchema = z.enum([
  "identification",
  "analysis",
  "synthesis",
  "evaluation",
]);

export const sbSpReflectionSchema = z.object({
  identification: z.string(),
  analysis: z.string(),
  synthesis: z.string(),
  evaluation: z.string(),
  classification: z.enum(["safe", "risky", "critical"]),
});

// ---------------------------------------------------------------------------
// Główne zdarzenie SB/SP
// ---------------------------------------------------------------------------

export const sbSpEventSchema = z.object({
  timestamp: z.string().datetime(),
  rideId: z.string().min(1),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
    speedKmh: z.number().min(0),
    heading: z.number().min(0).max(360),
  }),
  cognitive: z.object({
    WR: z.record(z.string(), z.unknown()),
    WP: z.record(z.string(), z.unknown()),
    delta: z.record(z.string(), z.number()),
  }),
  decision: z.object({
    WR: z.record(z.string(), z.unknown()),
    WP: z.record(z.string(), z.unknown()),
    delta: z.record(z.string(), z.number()),
  }),
  compliance: complianceResultSchema,
  visualization: bubbleVisualizationSchema,
  sb_sp_framework: sbSpReflectionSchema,
});

// ---------------------------------------------------------------------------
// Baza wiedzy
// ---------------------------------------------------------------------------

export const safetyMetricsSchema = z.object({
  averageRiskScore: z.number().min(0).max(100),
  criticalEvents: z.number().int().min(0),
  riskyEvents: z.number().int().min(0),
  safeEvents: z.number().int().min(0),
  complianceRate: z.number().min(0).max(100),
  avgSpeedDeviation: z.number(),
  avgReactionTimeMs: z.number().min(0),
});

export const behaviorPatternSchema = z.object({
  name: z.string(),
  frequency: z.number().min(0).max(1),
  avgRisk: z.number().min(0).max(100),
  relatedEventIndices: z.array(z.number().int().min(0)),
});

export const knowledgeBaseSchema = z.object({
  rideId: z.string().min(1),
  events: z.array(sbSpEventSchema),
  metrics: safetyMetricsSchema,
  behaviorPatterns: z.array(behaviorPatternSchema),
  recommendations: z.array(z.string()),
});

// ---------------------------------------------------------------------------
// Typy inferowane
// ---------------------------------------------------------------------------

export type WR_WP_Delta = z.infer<typeof wrWpDeltaSchema>;
export type CognitiveGPS = z.infer<typeof cognitiveGPSSchema>;
export type CameraData = z.infer<typeof cameraDataSchema>;
export type EnvironmentalConditions = z.infer<typeof environmentalConditionsSchema>;
export type CognitiveTrack = z.infer<typeof cognitiveTrackSchema>;
export type DecisionTrack = z.infer<typeof decisionTrackSchema>;
export type ComplianceResult = z.infer<typeof complianceResultSchema>;
export type BubbleVisualization = z.infer<typeof bubbleVisualizationSchema>;
export type SB_SP_Reflection = z.infer<typeof sbSpReflectionSchema>;
export type SB_SP_Event = z.infer<typeof sbSpEventSchema>;
export type KnowledgeBase = z.infer<typeof knowledgeBaseSchema>;
