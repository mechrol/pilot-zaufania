// =============================================================================
// Pilot Zaufania — Wizualizacja bąbelkowa SB/SP
// =============================================================================
// Dynamiczny wykres bąbelkowy zgodności SB/SP:
//   - bąbelek = atrybut (np. prędkość, odległość, czas reakcji)
//   - rozmiar = wielkość odchylenia Δ
//   - kolor = poziom ryzyka
//   - położenie = relacja SB/SP w czasie
//   - przezroczystość = stabilność zachowania kierowcy
// =============================================================================

import type { BubbleVisualization, RiskColor } from "./sb-sp";

// ---------------------------------------------------------------------------
// Konfiguracja wykresu
// ---------------------------------------------------------------------------

/** Konfiguracja wykresu bąbelkowego */
export interface BubbleChartConfig {
  /** Tytuł wykresu */
  title: string;
  /** Oś X — zazwyczaj czas (timestamp) */
  xAxisLabel: string;
  /** Oś Y — relacja SB/SP (zwykle Δ) */
  yAxisLabel: string;
  /** Min/max dla osi */
  xRange: { min: number; max: number };
  yRange: { min: number; max: number };
  /** Mapowanie kolorów na poziomy ryzyka */
  colorMap: Record<RiskColor, string>;
  /** Skala rozmiaru bąbelków */
  sizeScale: { min: number; max: number };
}

/** Domyślna konfiguracja wykresu */
export const DEFAULT_BUBBLE_CHART_CONFIG: BubbleChartConfig = {
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
};

// ---------------------------------------------------------------------------
// Dane wykresu
// ---------------------------------------------------------------------------

/** Stan wykresu bąbelkowego w danym momencie */
export interface BubbleChartState {
  /** ID przejazdu */
  rideId: string;
  /** Znacznik czasu ostatniej aktualizacji */
  lastUpdated: string;
  /** Konfiguracja */
  config: BubbleChartConfig;
  /** Lista bąbelków (atrybutów) do wyświetlenia */
  bubbles: BubbleVisualization[];
  /** Historia poprzednich stanów (do animacji przejść) */
  history: BubbleVisualization[][];
}

// ---------------------------------------------------------------------------
// Atrybuty do wizualizacji
// ---------------------------------------------------------------------------

/** Definicja monitorowanego atrybutu */
export interface MonitoredAttribute {
  /** Nazwa wyświetlana */
  name: string;
  /** Klucz w danych */
  key: string;
  /** Który tor: cognitive lub decision */
  track: "cognitive" | "decision";
  /** Próg krytyczny (Δ) */
  criticalThreshold: number;
  /** Próg wysokiego ryzyka (Δ) */
  highRiskThreshold: number;
  /** Próg średniego ryzyka (Δ) */
  mediumRiskThreshold: number;
}

/** Lista atrybutów monitorowanych na wykresie bąbelkowym */
export const MONITORED_ATTRIBUTES: MonitoredAttribute[] = [
  {
    name: "Prędkość",
    key: "speedKmh",
    track: "decision",
    criticalThreshold: 30,
    highRiskThreshold: 20,
    mediumRiskThreshold: 10,
  },
  {
    name: "Odległość od obiektu",
    key: "objectDistanceM",
    track: "decision",
    criticalThreshold: -30,
    highRiskThreshold: -20,
    mediumRiskThreshold: -10,
  },
  {
    name: "Czas reakcji",
    key: "reactionTimeMs",
    track: "decision",
    criticalThreshold: 500,
    highRiskThreshold: 300,
    mediumRiskThreshold: 150,
  },
  {
    name: "Przyspieszenie/hamowanie",
    key: "accelerationMs2",
    track: "decision",
    criticalThreshold: 3,
    highRiskThreshold: 2,
    mediumRiskThreshold: 1,
  },
  {
    name: "Widoczność",
    key: "visibilityM",
    track: "cognitive",
    criticalThreshold: -200,
    highRiskThreshold: -100,
    mediumRiskThreshold: -50,
  },
];

/** Wyznacza kolor ryzyka na podstawie Δ i progów */
export function getRiskColor(
  delta: number,
  thresholds: {
    criticalThreshold: number;
    highRiskThreshold: number;
    mediumRiskThreshold: number;
  }
): RiskColor {
  const absDelta = Math.abs(delta);

  const effectiveDelta =
    thresholds.criticalThreshold < 0
      ? delta < thresholds.criticalThreshold
        ? Math.abs(delta)
        : delta < thresholds.highRiskThreshold
          ? Math.abs(delta)
          : absDelta
      : absDelta;

  if (effectiveDelta >= Math.abs(thresholds.criticalThreshold)) return "darkred";
  if (effectiveDelta >= Math.abs(thresholds.highRiskThreshold)) return "red";
  if (effectiveDelta >= Math.abs(thresholds.mediumRiskThreshold)) return "orange";
  if (effectiveDelta > 0) return "yellow";
  return "green";
}
