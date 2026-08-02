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
} from "../types/sb-sp";

export { AGENT_ROLES } from "../types/sb-sp";

// Road code types
export type {
  RoadSignType,
  RoadSignDefinition,
  RoadType,
  CountryCode,
} from "../types/road-code";

export {
  SPEED_LIMITS_PL,
  ROAD_SIGNS_PL,
  SAFETY_DISTANCES,
  REACTION_TIME_NORMS,
  getSpeedLimits,
  getRoadSigns,
} from "../types/road-code";

// Bubble chart types
export type {
  BubbleChartConfig,
  BubbleChartState,
  MonitoredAttribute,
} from "../types/bubble-chart";

export {
  DEFAULT_BUBBLE_CHART_CONFIG,
  MONITORED_ATTRIBUTES,
  getRiskColor,
} from "../types/bubble-chart";

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
} from "../schemas/sb-sp";

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
} from "./cognitive-track";

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
} from "./decision-track";

// Road code checker
export {
  checkSpeedCompliance,
  checkDistanceCompliance,
  checkReactionTimeCompliance,
  checkSignCompliance,
  generateComplianceReport,
} from "./road-code-checker";

export type {
  SignComplianceResult,
  ComplianceReport,
} from "./road-code-checker";

// Bubble visualizer
export {
  createBubbleChartState,
  generateBubble,
  updateChartState,
  generateChartFromEvents,
  toRenderData,
} from "./bubble-visualizer";

// Memory engine
export {
  createKnowledgeBase,
  recordEvent,
  exportKnowledgeBase,
  importKnowledgeBase,
} from "./memory-engine";

// SB/SP Engine
export {
  createSB_SP_Context,
  processSB_SP_Event,
  processSB_SP_Batch,
} from "./sb-sp-engine";

export type { SB_SP_Input, SB_SP_Context } from "./sb-sp-engine";
