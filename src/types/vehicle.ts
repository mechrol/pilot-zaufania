// =============================================================================
// Pilot Zaufania — Profil pojazdu
// =============================================================================

import type { BaseProfile } from "./base-profile";

/** Profil pojazdu — rozszerza BaseProfile o dane techniczne */
export interface VehicleProfile extends BaseProfile {
  /** Marka (np. "Toyota") */
  brand: string;
  /** Model (np. "Corolla") */
  model: string;
  /** Rok produkcji */
  year: number;
  /** Kolor */
  color: string;
  /** Numer rejestracyjny (unikalny) */
  plate: string;
  /** Numer VIN */
  vin: string;
  /** Liczba miejsc pasażerskich */
  seats: number;
  /** Kategoria pojazdu (Mini, Sedan, SUV, Van) */
  category: VehicleCategory;
  /** ID przypisanego kierowcy (opcjonalne) */
  assignedDriverId?: string;
  /** Data ostatniego przeglądu technicznego (ISO 8601) */
  lastInspectionDate?: string;
  /** Data ważności ubezpieczenia (ISO 8601) */
  insuranceExpiry?: string;
}

export type VehicleCategory = "mini" | "sedan" | "suv" | "van" | "luxury";
