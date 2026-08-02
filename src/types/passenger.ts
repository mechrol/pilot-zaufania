// =============================================================================
// Pilot Zaufania — Profil pasażera
// =============================================================================

import type { BaseProfile } from "./base-profile";

/** Profil pasażera — rozszerza BaseProfile o dane osobowe */
export interface PassengerProfile extends BaseProfile {
  /** Imię i nazwisko */
  fullName: string;
  /** Adres e-mail (unikalny) */
  email: string;
  /** Numer telefonu */
  phone: string;
  /** Preferowany język (kod ISO 639-1, np. "pl", "en") */
  preferredLanguage: string;
  /** Czy pasażer wyraził zgodę na rejestrację zdarzeń */
  consentToRecording: boolean;
  /** Ocena zaufania (0–100, obliczana na podstawie historii przejazdów) */
  trustScore?: number;
  /** ID subskrypcji (opcjonalne) */
  subscriptionId?: string;
}
