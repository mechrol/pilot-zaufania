// =============================================================================
// Pilot Zaufania — Bazowe typy profili
// =============================================================================
// Wszystkie profile rozszerzają BaseProfile. Każdy zawiera "deviceExtensions"
// — słownik na dane z przyszłych urządzeń pomiarowych (OBD-II, dashcam, radar…).
// =============================================================================

import type { GPSData } from "./gps";
import type { SmartphoneMetadata } from "./smartphone";
import type { TripChecklist } from "../checklist/trip-factors";

/** Dostępny poziom wyposażenia (tier sprzętowy) */
export type EquipmentTier = "T0" | "T1" | "T2" | "T3" | "T4" | "T5";

/** Bazowy interfejs dla wszystkich profili */
export interface BaseProfile {
  id: string; // UUID
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601

  /** Poziom wyposażenia dostępny dla tego profilu */
  tier: EquipmentTier;

  /** Metadane smartfona — dostępne od T1 */
  smartphoneMetadata?: SmartphoneMetadata;

  /** Dane GPS — dostępne od T2 */
  gpsData?: GPSData[];

  /**
   * Rozszerzenia od przyszłych urządzeń pomiarowych.
   * Klucz = identyfikator urządzenia (np. "obd2", "dashcam").
   * Wartość = dowolne dane JSON zgodne ze schematem danego urządzenia.
   */
  deviceExtensions: Record<string, unknown>;

  /** Checklista czynników podróży do zatwierdzenia */
  tripChecklist: TripChecklist;
}

/** Role uczestnika przejazdu */
export type ParticipantRole = "passenger" | "driver";
