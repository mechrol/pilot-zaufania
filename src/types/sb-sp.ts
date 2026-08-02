// =============================================================================
// Pilot Zaufania — SB/SP Framework: Refleksyjna Baza Wiedzy
// =============================================================================
// Tor Sterowniczy (SB) / Sterowniczy Proces (SP)
//
// Dwa równoległe tory:
//   - Tor poznawczy (Cognitive Track) — percepcja, sensory, obserwacje
//   - Tor decyzyjny (Decision Track) — reakcje kierowcy, wybory, manewry
//
// Każdy atrybut otrzymuje WR (wartość rzeczywistą), WP (wartość postulowaną)
// i Δ (odchylenie). System wykonuje pełny cykl refleksji:
//   1. Identyfikacja → 2. Analiza → 3. Synteza → 4. Ocena
// =============================================================================

// ---------------------------------------------------------------------------
// WR / WP / Δ
// ---------------------------------------------------------------------------

/** Trójka wartości: rzeczywista, postulowana i odchylenie */
export interface WR_WP_Delta {
  /** Wartość rzeczywista — dane bieżące z czujników i decyzji */
  WR: number;
  /** Wartość postulowana — norma z kodeksu / modelu decyzyjnego */
  WP: number;
  /** Odchylenie od normy: Δ = WR − WP */
  delta: number;
}

// ---------------------------------------------------------------------------
// Tor poznawczy (Cognitive Track)
// ---------------------------------------------------------------------------

/** Dane GPS w torze poznawczym */
export interface CognitiveGPS {
  /** Szerokość geograficzna */
  lat: number;
  /** Długość geograficzna */
  lon: number;
  /** Prędkość w km/h */
  speedKmh: number;
  /** Kierunek jazdy w stopniach (0–360) */
  heading: number;
}

/** Dane z kamery */
export interface CameraData {
  /** Wykryte obiekty (pojazdy, piesi, przeszkody) */
  objects: string[];
  /** Rozpoznane znaki drogowe */
  signs: string[];
  /** Wykryte linie drogowe */
  lanes: string[];
  /** Liczba pieszych w polu widzenia */
  pedestrianCount: number;
  /** Liczba pojazdów w polu widzenia */
  vehicleCount: number;
}

/** Dane z radaru / LiDAR */
export interface RadarLidarData {
  /** Odległości do obiektów w metrach */
  distancesM: number[];
  /** Prędkości obiektów w km/h */
  objectSpeedsKmh: number[];
}

/** Warunki środowiskowe */
export interface EnvironmentalConditions {
  /** Pogoda: "clear", "rain", "snow", "fog", "storm" */
  weather: string;
  /** Natężenie ruchu: "light", "moderate", "heavy", "standstill" */
  traffic: string;
  /** Widoczność w metrach */
  visibilityM: number;
  /** Pora dnia: "day", "dusk", "night", "dawn" */
  timeOfDay: string;
  /** Stan nawierzchni: "dry", "wet", "icy", "snow_covered" */
  roadSurface: string;
}

/** Kompletny tor poznawczy — "co się dzieje w świecie" */
export interface CognitiveTrack {
  /** Dane GPS */
  gps: CognitiveGPS;
  /** Dane z kamery (opcjonalne — wymaga sprzętu) */
  camera?: CameraData;
  /** Dane z radaru/LiDAR (opcjonalne) */
  radarLidar?: RadarLidarData;
  /** Obserwacje pasażera (tekstowe) */
  passengerObservations: string[];
  /** Rutynowe obiekty na trasie */
  routineObjects: string[];
  /** Warunki środowiskowe */
  environment: EnvironmentalConditions;
}

// ---------------------------------------------------------------------------
// Tor decyzyjny (Decision Track)
// ---------------------------------------------------------------------------

/** Reakcja na znak drogowy */
export interface SignReaction {
  /** Identyfikator znaku (np. "B-33" — ograniczenie prędkości) */
  signId: string;
  /** Typ znaku: "warning", "prohibition", "mandatory", "information" */
  signType: "warning" | "prohibition" | "mandatory" | "information";
  /** Czy kierowca zastosował się do znaku */
  complied: boolean;
  /** Czas reakcji w ms */
  reactionTimeMs: number;
}

/** Typ manewru */
export type ManeuverType =
  | "lane_change_left"
  | "lane_change_right"
  | "turn_left"
  | "turn_right"
  | "u_turn"
  | "overtake"
  | "merge"
  | "exit"
  | "stop"
  | "park";

/** Pojedynczy manewr */
export interface Maneuver {
  /** Typ manewru */
  type: ManeuverType;
  /** Znacznik czasu rozpoczęcia */
  startedAt: string;
  /** Znacznik czasu zakończenia */
  endedAt?: string;
  /** Czy manewr był bezpieczny */
  safe: boolean;
}

/** Kompletny tor decyzyjny — "co kierowca robi i dlaczego" */
export interface DecisionTrack {
  /** Reakcje na znaki drogowe */
  signReactions: SignReaction[];
  /** Wybór prędkości — WR/WP/Δ */
  speed: WR_WP_Delta;
  /** Przyspieszenie / hamowanie (m/s²) */
  accelerationBraking: WR_WP_Delta;
  /** Odległość od obiektów (metry) */
  objectDistance: WR_WP_Delta;
  /** Czas reakcji (ms) */
  reactionTime: WR_WP_Delta;
  /** Wykonane manewry */
  maneuvers: Maneuver[];
  /** Decyzje zwiększające ryzyko kolizji */
  collisionRiskDecisions: string[];
}

// ---------------------------------------------------------------------------
// Zgodność z kodeksem drogowym
// ---------------------------------------------------------------------------

/** Poziom odchylenia od normy */
export type DeviationLevel = "none" | "minor" | "moderate" | "major" | "critical";

/** Wynik analizy zgodności z kodeksem */
export interface ComplianceResult {
  /** Referencja do artykułu/paragrafu kodeksu drogowego */
  roadCodeReference: string;
  /** Opis naruszenia (lub "zgodne") */
  description: string;
  /** Poziom odchylenia */
  deviationLevel: DeviationLevel;
  /** Wynik ryzyka 0–100 (0 = bezpiecznie, 100 = krytycznie) */
  riskScore: number;
  /** Sugestia korekcyjna dla kierowcy */
  correctionSuggestion: string;
}

// ---------------------------------------------------------------------------
// Wizualizacja bąbelkowa
// ---------------------------------------------------------------------------

/** Poziom ryzyka — kolor bąbelka */
export type RiskColor = "green" | "yellow" | "orange" | "red" | "darkred";

/** Dane wizualizacji bąbelkowej dla pojedynczego atrybutu */
export interface BubbleVisualization {
  /** Nazwa atrybutu (np. "prędkość", "odległość", "czas reakcji") */
  attributeName: string;
  /** Rozmiar bąbelka — proporcjonalny do |Δ| */
  size: number;
  /** Kolor bąbelka — poziom ryzyka */
  color: RiskColor;
  /** Pozycja na wykresie (x = czas, y = relacja SB/SP) */
  position: { x: number; y: number };
  /** Przezroczystość — stabilność zachowania (0–1, 1 = stabilne) */
  opacity: number;
}

// ---------------------------------------------------------------------------
// SB/SP Framework — cykl refleksji
// ---------------------------------------------------------------------------

/** Faza cyklu refleksji SB/SP */
export type SB_SP_Phase =
  | "identification"
  | "analysis"
  | "synthesis"
  | "evaluation";

/** Wynik pełnego cyklu refleksji */
export interface SB_SP_Reflection {
  /** Identyfikacja obrazu SB/SP */
  identification: string;
  /** Analiza obrazu SB/SP */
  analysis: string;
  /** Synteza obrazu SB/SP */
  synthesis: string;
  /** Ocena obrazu SB/SP */
  evaluation: string;
  /** Klasyfikacja: "safe", "risky", "critical" */
  classification: "safe" | "risky" | "critical";
}

// ---------------------------------------------------------------------------
// Zdarzenie SB/SP (główny format zapisu)
// ---------------------------------------------------------------------------

/** Pojedyncze zdarzenie SB/SP — format zapisu do refleksyjnej bazy wiedzy */
export interface SB_SP_Event {
  /** Znacznik czasu zdarzenia (ISO 8601) */
  timestamp: string;
  /** ID przejazdu, którego dotyczy */
  rideId: string;
  /** Lokalizacja */
  location: {
    lat: number;
    lon: number;
    speedKmh: number;
    heading: number;
  };

  /** Tor poznawczy — WR / WP / Δ */
  cognitive: {
    WR: Record<string, unknown>;
    WP: Record<string, unknown>;
    delta: Record<string, number>;
  };

  /** Tor decyzyjny — WR / WP / Δ */
  decision: {
    WR: Record<string, unknown>;
    WP: Record<string, unknown>;
    delta: Record<string, number>;
  };

  /** Zgodność z kodeksem */
  compliance: ComplianceResult;

  /** Wizualizacja bąbelkowa */
  visualization: BubbleVisualization;

  /** Framework SB/SP */
  sb_sp_framework: SB_SP_Reflection;
}

// ---------------------------------------------------------------------------
// Role agentów AI
// ---------------------------------------------------------------------------

/** Definicja roli agenta w systemie SB/SP */
export interface AgentRole {
  /** Identyfikator roli */
  id: string;
  /** Nazwa roli */
  name: string;
  /** Opis odpowiedzialności */
  description: string;
  /** Który tor obsługuje */
  track: "cognitive" | "decision" | "both";
  /** Fazy cyklu, w których uczestniczy */
  phases: SB_SP_Phase[];
}

/** Predefiniowane role agentów */
export const AGENT_ROLES: AgentRole[] = [
  {
    id: "sensor_fusion_engineer",
    name: "Sensor Fusion Engineer",
    description:
      "Integruje dane GPS/kamera/radar. Tworzy WR dla toru poznawczego.",
    track: "cognitive",
    phases: ["identification"],
  },
  {
    id: "road_sign_interpreter",
    name: "Road Sign Interpreter",
    description:
      "Rozpoznaje znaki drogowe. Tworzy WP zgodnie z kodeksem.",
    track: "cognitive",
    phases: ["identification", "analysis"],
  },
  {
    id: "driver_decision_analyzer",
    name: "Driver Decision Analyzer",
    description:
      "Rejestruje decyzje kierowcy. Oblicza Δ dla toru decyzyjnego.",
    track: "decision",
    phases: ["identification", "analysis"],
  },
  {
    id: "risk_collision_forecaster",
    name: "Risk & Collision Forecaster",
    description:
      "Analizuje Δ pod kątem ryzyka. Wykrywa potencjalne kolizje.",
    track: "both",
    phases: ["analysis", "synthesis"],
  },
  {
    id: "memory_engineer",
    name: "Memory Engineer",
    description:
      "Zapisuje WR/WP/Δ oraz SB/SP do bazy wiedzy. Buduje pamięć refleksyjną.",
    track: "both",
    phases: ["evaluation"],
  },
  {
    id: "bubble_visualization_engineer",
    name: "Bubble Visualization Engineer",
    description:
      "Generuje dynamiczny wykres bąbelkowy. Aktualizuje wizualizację w czasie rzeczywistym.",
    track: "both",
    phases: ["synthesis", "evaluation"],
  },
];

// ---------------------------------------------------------------------------
// Refleksyjna baza wiedzy
// ---------------------------------------------------------------------------

/** Stan refleksyjnej bazy wiedzy */
export interface KnowledgeBase {
  /** ID przejazdu */
  rideId: string;
  /** Lista zarejestrowanych zdarzeń */
  events: SB_SP_Event[];
  /** Zagregowane metryki bezpieczeństwa */
  metrics: SafetyMetrics;
  /** Wzorce zachowań kierowcy */
  behaviorPatterns: BehaviorPattern[];
  /** Wygenerowane rekomendacje */
  recommendations: string[];
}

/** Zagregowane metryki bezpieczeństwa */
export interface SafetyMetrics {
  /** Średni wynik ryzyka (0–100) */
  averageRiskScore: number;
  /** Liczba zdarzeń krytycznych */
  criticalEvents: number;
  /** Liczba zdarzeń ryzykownych */
  riskyEvents: number;
  /** Liczba zdarzeń bezpiecznych */
  safeEvents: number;
  /** Procentowa zgodność z kodeksem */
  complianceRate: number;
  /** Średnie odchylenie prędkości (km/h) */
  avgSpeedDeviation: number;
  /** Średni czas reakcji (ms) */
  avgReactionTimeMs: number;
}

/** Wzorzec zachowania kierowcy */
export interface BehaviorPattern {
  /** Nazwa wzorca (np. "tendencja do przekraczania prędkości") */
  name: string;
  /** Częstotliwość występowania (0–1) */
  frequency: number;
  /** Średni poziom ryzyka wzorca */
  avgRisk: number;
  /** Powiązane zdarzenia (indeksy w tablicy events) */
  relatedEventIndices: number[];
}
