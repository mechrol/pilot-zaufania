// =============================================================================
// Pilot Zaufania — Wizualizacja bąbelkowa SB/SP
// =============================================================================
// Generuje dane do dynamicznego wykresu bąbelkowego zgodności SB/SP.
//
// Agent: Bubble Visualization Engineer
// =============================================================================

import type { BubbleVisualization, SB_SP_Event, RiskColor } from "../types/sb-sp.js";
import type { BubbleChartState } from "../types/bubble-chart.js";
import {
  DEFAULT_BUBBLE_CHART_CONFIG,
  MONITORED_ATTRIBUTES,
  getRiskColor as getRiskColorFromThresholds,
} from "../types/bubble-chart.js";

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/** Tworzy nowy stan wykresu bąbelkowego */
export function createBubbleChartState(rideId: string): BubbleChartState {
  return {
    rideId,
    lastUpdated: new Date().toISOString(),
    config: { ...DEFAULT_BUBBLE_CHART_CONFIG },
    bubbles: [],
    history: [],
  };
}

// ---------------------------------------------------------------------------
// Generowanie bąbelka
// ---------------------------------------------------------------------------

/** Generuje pojedynczy bąbelek na podstawie zdarzenia SB/SP */
export function generateBubble(
  event: SB_SP_Event,
  timeProgress: number // 0–100, postęp czasu przejazdu
): BubbleVisualization {
  // Wybieramy główny atrybut na podstawie największego Δ
  const allDeltas = {
    ...event.cognitive.delta,
    ...event.decision.delta,
  };

  const entries = Object.entries(allDeltas);
  const topEntry =
    entries.length > 0
      ? entries.reduce((a, b) =>
          Math.abs(a[1]!) > Math.abs(b[1]!) ? a : b
        )
      : ["unknown", 0];

  const attributeName = String(topEntry[0] ?? "unknown");
  const delta = Number(topEntry[1] ?? 0);

  // Znajdź definicję atrybutu
  const attrDef = MONITORED_ATTRIBUTES.find((a) => a.key === attributeName);

  // Oblicz rozmiar bąbelka (proporcjonalny do |Δ|)
  const size = computeBubbleSize(Math.abs(delta));

  // Określ kolor ryzyka
  const color = attrDef
    ? getRiskColorFromThresholds(delta, attrDef)
    : delta > 0
      ? "red"
      : "green";

  // Pozycja: x = czas, y = Δ
  const position = {
    x: timeProgress,
    y: Math.max(-100, Math.min(100, delta)),
  };

  // Przezroczystość: na podstawie compliance risk score
  const opacity = 1 - event.compliance.riskScore / 100;

  return {
    attributeName: attrDef?.name ?? attributeName,
    size,
    color,
    position,
    opacity,
  };
}

// ---------------------------------------------------------------------------
// Rozmiar bąbelka
// ---------------------------------------------------------------------------

/** Mapuje |Δ| na rozmiar bąbelka (w pikselach, skala 8–64) */
function computeBubbleSize(absDelta: number): number {
  const { min, max } = DEFAULT_BUBBLE_CHART_CONFIG.sizeScale;
  // Logarytmiczne skalowanie — małe Δ nie znikają
  if (absDelta === 0) return min;
  const scaled = Math.log2(absDelta + 1) * 8;
  return Math.max(min, Math.min(max, scaled));
}

// ---------------------------------------------------------------------------
// Aktualizacja stanu
// ---------------------------------------------------------------------------

/** Aktualizuje stan wykresu o nowe zdarzenie */
export function updateChartState(
  state: BubbleChartState,
  event: SB_SP_Event,
  totalEvents: number,
  eventIndex: number
): BubbleChartState {
  const timeProgress =
    totalEvents > 1 ? Math.round((eventIndex / (totalEvents - 1)) * 100) : 50;

  const bubble = generateBubble(event, timeProgress);

  // Zapisz poprzedni stan do historii
  const history = [...state.history, [...state.bubbles]].slice(-20); // ostatnie 20 stanów

  return {
    ...state,
    lastUpdated: new Date().toISOString(),
    bubbles: [...state.bubbles, bubble],
    history,
  };
}

// ---------------------------------------------------------------------------
// Generowanie zbiorczej wizualizacji
// ---------------------------------------------------------------------------

/** Generuje kompletny stan wykresu na podstawie listy zdarzeń */
export function generateChartFromEvents(
  rideId: string,
  events: SB_SP_Event[]
): BubbleChartState {
  let state = createBubbleChartState(rideId);

  for (let i = 0; i < events.length; i++) {
    state = updateChartState(state, events[i]!, events.length, i);
  }

  return state;
}

// ---------------------------------------------------------------------------
// Eksport do formatu frontendowego
// ---------------------------------------------------------------------------

/** Format danych wykresu gotowy do renderowania w UI */
export interface ChartRenderData {
  config: {
    title: string;
    xLabel: string;
    yLabel: string;
    colors: Record<RiskColor, string>;
  };
  points: Array<{
    id: string;
    name: string;
    x: number;
    y: number;
    size: number;
    color: string;
    opacity: number;
    riskScore: number;
    timestamp: string;
  }>;
}

/** Konwertuje stan wykresu na format renderowalny */
export function toRenderData(
  state: BubbleChartState,
  events: SB_SP_Event[]
): ChartRenderData {
  return {
    config: {
      title: state.config.title,
      xLabel: state.config.xAxisLabel,
      yLabel: state.config.yAxisLabel,
      colors: state.config.colorMap,
    },
    points: state.bubbles.map((b, i) => ({
      id: `bubble-${i}`,
      name: b.attributeName,
      x: b.position.x,
      y: b.position.y,
      size: b.size,
      color: state.config.colorMap[b.color] ?? "#888",
      opacity: b.opacity,
      riskScore: events[i]?.compliance.riskScore ?? 0,
      timestamp: events[i]?.timestamp ?? "",
    })),
  };
}
