// =============================================================================
// Pilot Zaufania — Profil kierowcy
// =============================================================================

import type { BaseProfile } from "./base-profile.js";

/** Profil kierowcy — rozszerza BaseProfile o dane zawodowe i uprawnienia */
export interface DriverProfile extends BaseProfile {
  /** Imię i nazwisko */
  fullName: string;
  /** Adres e-mail (unikalny) */
  email: string;
  /** Numer telefonu */
  phone: string;
  /** Numer prawa jazdy (unikalny) */
  licenseNumber: string;
  /** Kategorie prawa jazdy */
  licenseCategories: string[];
  /** Data ważności prawa jazdy (ISO 8601) */
  licenseExpiry: string;
  /** Lata doświadczenia */
  yearsOfExperience: number;
  /** Ocena kierowcy (1.00–5.00, średnia z przejazdów) */
  rating: number;
  /** Ocena zaufania (0–100, obliczana na podstawie historii przejazdów) */
  trustScore?: number;
  /** ID przypisanego pojazdu (opcjonalne — kierowca może nie mieć stałego pojazdu) */
  assignedVehicleId?: string;
  /** ID ustawień Wellness (opcjonalne) */
  wellnessSettingsId?: string;
  /** ID subskrypcji (opcjonalne) */
  subscriptionId?: string;
}
