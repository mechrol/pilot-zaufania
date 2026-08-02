// =============================================================================
// Pilot Zaufania — SB/SP Framework: barrel export
// =============================================================================

// Types (re-export)
export type {
  WR_WP_Delta,
  CognitiveGPS,
  CameraData,
  RadarLidarData,
  EnvironmentalConditions,
  CognitiveTrack,
  SignReaction,
  ManeuverType,
  Maneuver,
  DecisionTrack,
  DeviationLevel,
  RiskColor,
  ComplianceResult,
  BubbleVisualization,
  SB_SP_Phase,
  SB_SP_Reflection,
  SB_SP_Event,
  AgentRole,
  KnowledgeBase,
  SafetyMetrics,
  BehaviorPattern,
} from "../types/sb-sp.js";

export { AGENT_ROLES } from "../types/sb-sp.js";

// Road code types
export type {
  RoadSignType,
  RoadSignDefinition,
  RoadType,
  CountryCode,
} from "../types/road-code.js";

export {
  SPEED_LIMITS_PL,
  ROAD_SIGNS_PL,
  SAFETY_DISTANCES,
  REACTION_TIME_NORMS,
  getSpeedLimits,
  getRoadSigns,
} from "../types/road-code.js";

// Bubble chart types
export type {
  BubbleChartConfig,
  BubbleChartState,
  MonitoredAttribute,
} from "../types/bubble-chart.js";

export {
  DEFAULT_BUBBLE_CHART_CONFIG,
  MONITORED_ATTRIBUTES,
  getRiskColor,
} from "../types/bubble-chart.js";

// Schemas
export {
  wrWpDeltaSchema,
  cognitiveGPSSchema,
  cameraDataSchema,
  radarLidarDataSchema,
  environmentalConditionsSchema,
  cognitiveTrackSchema,
  signReactionSchema,
  maneuverSchema,
  decisionTrackSchema,
  deviationLevelSchema,
  complianceResultSchema,
  riskColorSchema,
  bubbleVisualizationSchema,
  sbSpPhaseSchema,
  sbSpReflectionSchema,
  sbSpEventSchema,
  safetyMetricsSchema,
  behaviorPatternSchema,
  knowledgeBaseSchema,
} from "../schemas/sb-sp.js";

// Cognitive track engine
export {
  createEmptyCognitiveTrack,
  updateGPS,
  updateCamera,
  updateRadarLidar,
  addPassengerObservation,
  addRoutineObject,
  updateEnvironment,
  extractCognitiveWR,
  computeCognitiveWP,
  computeCognitiveDelta,
} from "./cognitive-track.js";

// Decision track engine
export {
  createEmptyDecisionTrack,
  updateSpeed,
  updateAccelerationBraking,
  updateObjectDistance,
  updateReactionTime,
  recordSignReaction,
  recordManeuver,
  recordCollisionRiskDecision,
  isSpeeding,
  isTooClose,
  isReactionTooSlow,
  isAccelerationTooAggressive,
  extractDecisionWR,
  computeDecisionWP,
  computeDecisionDelta,
} from "./decision-track.js";

// Road code checker
export {
  checkSpeedCompliance,
  checkDistanceCompliance,
  checkReactionTimeCompliance,
  checkSignCompliance,
  generateComplianceReport,
} from "./road-code-checker.js";

export type {
  SignComplianceResult,
  ComplianceReport,
} from "./road-code-checker.js";

// Bubble visualizer
export {
  createBubbleChartState,
  generateBubble,
  updateChartState,
  generateChartFromEvents,
  toRenderData,
} from "./bubble-visualizer.js";

// Memory engine
export {
  createKnowledgeBase,
  recordEvent,
  exportKnowledgeBase,
  importKnowledgeBase,
} from "./memory-engine.js";

// SB/SP Engine
export {
  createSB_SP_Context,
  processSB_SP_Event,
  processSB_SP_Batch,
} from "./sb-sp-engine.js";

export type { SB_SP_Input, SB_SP_Context } from "./sb-sp-engine.js";
