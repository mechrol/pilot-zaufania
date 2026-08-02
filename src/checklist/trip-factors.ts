// =============================================================================
// Pilot Zaufania — Checklista czynników podróży
// =============================================================================
// Checklista zawiera pozycje do potwierdzenia przez pasażera i/lub kierowcę
// przed rozpoczęciem podróży. Obejmuje bezpieczeństwo, komfort i gotowość.
// =============================================================================

/** Pojedyncza pozycja checklisty */
export interface ChecklistItem {
  /** Unikalny identyfikator pozycji */
  id: string;
  /** Kategoria czynnika */
  category: ChecklistCategory;
  /** Treść do potwierdzenia */
  label: string;
  /** Opis / wyjaśnienie (opcjonalne) */
  description?: string;
  /** Kto musi potwierdzić */
  requiredBy: ("passenger" | "driver" | "both")[];
  /** Czy pozycja jest krytyczna (bez niej podróż nie może się rozpocząć) */
  critical: boolean;
}

export type ChecklistCategory = "safety" | "comfort" | "readiness";

/** Stan pojedynczej pozycji checklisty */
export interface ChecklistEntry {
  /** Referencja do pozycji checklisty */
  itemId: string;
  /** Czy potwierdzone przez pasażera */
  passengerConfirmed: boolean;
  /** Czy potwierdzone przez kierowcę */
  driverConfirmed: boolean;
  /** Znacznik czasu potwierdzenia (ostatniego) */
  confirmedAt?: string;
  /** Komentarz (opcjonalny) */
  comment?: string;
}

/** Kompletna checklista podróży */
export interface TripChecklist {
  /** ID przejazdu, którego dotyczy */
  rideId: string;
  /** Lista pozycji z ich stanem */
  entries: ChecklistEntry[];
  /** Czy wszystkie pozycje krytyczne są potwierdzone */
  allCriticalConfirmed: boolean;
  /** Czy checklista jest w całości zatwierdzona */
  fullyApproved: boolean;
  /** Znacznik czasu pełnego zatwierdzenia */
  approvedAt?: string;
}
