// =============================================================================
// Pilot Zaufania — Zdefiniowane pozycje checklisty "Czynniki podróży"
// =============================================================================
// Predefiniowany zestaw pozycji do zatwierdzenia przed rozpoczęciem podróży.
// Podzielone na trzy kategorie: bezpieczeństwo (safety), komfort (comfort)
// i gotowość (readiness). Każda pozycja ma przypisaną rolę (passenger/driver/both)
// i flagę krytyczności — krytyczne MUSZĄ być potwierdzone przed startem.
// =============================================================================

import type { ChecklistItem } from "./trip-factors.js";

/**
 * Kompletna lista czynników podróży.
 * W przyszłości można ją rozszerzać lub ładować z bazy danych.
 */
export const TRIP_FACTORS: ChecklistItem[] = [
  // ======================== BEZPIECZEŃSTWO (SAFETY) ========================
  {
    id: "SF-01",
    category: "safety",
    label: "Zapięte pasy bezpieczeństwa — pasażer i kierowca",
    description:
      "Obu uczestnikom podróży zapięto pasy bezpieczeństwa. Wymóg prawny — bezwzględnie przed ruszeniem.",
    requiredBy: ["both"],
    critical: true,
  },
  {
    id: "SF-02",
    category: "safety",
    label: "Fotelik dziecięcy — jeśli dotyczy",
    description:
      "Jeśli podróżuje dziecko wymagające fotelika — fotelik jest prawidłowo zamontowany i zapięty.",
    requiredBy: ["driver"],
    critical: true,
  },
  {
    id: "SF-03",
    category: "safety",
    label: "Trzeźwość kierowcy",
    description:
      "Kierowca potwierdza, że jest w pełni trzeźwy i zdolny do prowadzenia pojazdu.",
    requiredBy: ["driver"],
    critical: true,
  },
  {
    id: "SF-04",
    category: "safety",
    label: "Sprawność świateł i hamulców (kontrola wzrokowa)",
    description:
      "Szybka kontrola wzrokowa: światła działają, hamulce nie wykazują niepokojących objawów.",
    requiredBy: ["driver"],
    critical: true,
  },
  {
    id: "SF-05",
    category: "safety",
    label: "Stan opon — brak widocznych uszkodzeń",
    description:
      "Opony nie są przebite, nie mają wybrzuszeń ani widocznych uszkodzeń. Ciśnienie w normie.",
    requiredBy: ["driver"],
    critical: true,
  },
  {
    id: "SF-06",
    category: "safety",
    label: "Apteczka pierwszej pomocy na pokładzie",
    description:
      "Pojazd jest wyposażony w sprawną apteczkę pierwszej pomocy.",
    requiredBy: ["driver"],
    critical: false,
  },
  {
    id: "SF-07",
    category: "safety",
    label: "Gaśnica na pokładzie (sprawna, z aktualnym przeglądem)",
    description:
      "Gaśnica jest na wyposażeniu, ma aktualny termin ważności.",
    requiredBy: ["driver"],
    critical: false,
  },

  // ======================== KOMFORT (COMFORT) ========================
  {
    id: "CF-01",
    category: "comfort",
    label: "Temperatura w pojeździe — uzgodniona",
    description:
      "Pasażer i kierowca uzgodnili komfortową temperaturę / ustawienie klimatyzacji.",
    requiredBy: ["both"],
    critical: false,
  },
  {
    id: "CF-02",
    category: "comfort",
    label: "Preferencje muzyczne / cisza — uzgodnione",
    description:
      "Ustalono, czy w trakcie podróży ma grać muzyka/radio, czy preferowana jest cisza.",
    requiredBy: ["both"],
    critical: false,
  },
  {
    id: "CF-03",
    category: "comfort",
    label: "Bagaż prawidłowo umieszczony i zabezpieczony",
    description:
      "Wszystkie bagaże są w bagażniku lub bezpiecznie umieszczone w kabinie.",
    requiredBy: ["both"],
    critical: false,
  },
  {
    id: "CF-04",
    category: "comfort",
    label: "Trasa przejazdu — potwierdzona",
    description:
      "Obie strony znają i akceptują trasę przejazdu. Ewentualne objazdy zostały omówione.",
    requiredBy: ["both"],
    critical: false,
  },

  // ======================== GOTOWOŚĆ (READINESS) ========================
  {
    id: "RD-01",
    category: "readiness",
    label: "Smartfon — aplikacja Pilot Zaufania uruchomiona",
    description:
      "Aplikacja jest aktywna na smartfonie, gotowa do rejestracji zdarzeń (T1).",
    requiredBy: ["both"],
    critical: true,
  },
  {
    id: "RD-02",
    category: "readiness",
    label: "GPS — sygnał satelitarny dostępny",
    description:
      "Moduł GPS smartfona ma aktywny sygnał satelitarny do śledzenia trasy (T2).",
    requiredBy: ["driver"],
    critical: false,
  },
  {
    id: "RD-03",
    category: "readiness",
    label: "Zgoda na rejestrację — pasażer",
    description:
      "Pasażer wyraża zgodę na rejestrację zdarzeń zgodnie z polityką prywatności.",
    requiredBy: ["passenger"],
    critical: true,
  },
  {
    id: "RD-04",
    category: "readiness",
    label: "Zgoda na rejestrację — kierowca",
    description:
      "Kierowca potwierdza gotowość sprzętu i zgodę na rejestrację zdarzeń.",
    requiredBy: ["driver"],
    critical: true,
  },
  {
    id: "RD-05",
    category: "readiness",
    label: "Szacowana cena przejazdu — zaakceptowana",
    description:
      "Pasażer potwierdza akceptację szacowanej ceny (lub jej przedziału).",
    requiredBy: ["passenger"],
    critical: true,
  },
];

/**
 * Filtruje checklistę według kategorii.
 */
export function getFactorsByCategory(
  category: "safety" | "comfort" | "readiness"
): ChecklistItem[] {
  return TRIP_FACTORS.filter((f) => f.category === category);
}

/**
 * Zwraca tylko pozycje krytyczne (obowiązkowe przed startem).
 */
export function getCriticalFactors(): ChecklistItem[] {
  return TRIP_FACTORS.filter((f) => f.critical);
}

/**
 * Zwraca pozycje wymagane dla danej roli.
 */
export function getFactorsForRole(
  role: "passenger" | "driver"
): ChecklistItem[] {
  return TRIP_FACTORS.filter(
    (f) => f.requiredBy.includes(role) || f.requiredBy.includes("both")
  );
}

/**
 * Tworzy pustą checklistę dla danego przejazdu.
 * Wszystkie pozycje są inicjalnie niepotwierdzone.
 */
export function createEmptyChecklist(rideId: string) {
  return {
    rideId,
    entries: TRIP_FACTORS.map((item) => ({
      itemId: item.id,
      passengerConfirmed: false,
      driverConfirmed: false,
    })),
    allCriticalConfirmed: false,
    fullyApproved: false,
  };
}
