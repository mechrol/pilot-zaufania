// =============================================================================
// Pilot Zaufania — Kodeks drogowy: typy i dane referencyjne
// =============================================================================
// Definicje typów dla norm kodeksu drogowego (WP — wartości postulowane).
// Wsparcie dla różnych państw — aktualnie Polska (PL).
// =============================================================================

// ---------------------------------------------------------------------------
// Kategorie znaków drogowych
// ---------------------------------------------------------------------------

/** Typ znaku drogowego */
export type RoadSignType =
  | "warning"       // A — ostrzegawcze
  | "prohibition"   // B — zakazu
  | "mandatory"     // C — nakazu
  | "information"   // D — informacyjne
  | "horizontal";   // P — poziome (znaki na jezdni)

/** Pojedynczy znak drogowy w katalogu */
export interface RoadSignDefinition {
  /** Identyfikator znaku (np. "B-33") */
  id: string;
  /** Typ znaku */
  type: RoadSignType;
  /** Nazwa / opis znaku */
  name: string;
  /** Wartość normatywna (jeśli dotyczy — np. prędkość, odległość) */
  normativeValue?: number;
  /** Jednostka wartości normatywnej */
  unit?: string;
  /** Opis reguły do zastosowania */
  rule: string;
  /** Referencja do artykułu kodeksu */
  codeReference: string;
}

// ---------------------------------------------------------------------------
// Ograniczenia prędkości (Polska)
// ---------------------------------------------------------------------------

/** Typ drogi */
export type RoadType =
  | "built_up"            // teren zabudowany
  | "non_built_up"        // poza terenem zabudowanym
  | "expressway_single"   // droga ekspresowa jednojezdniowa
  | "expressway_dual"     // droga ekspresowa dwujezdniowa
  | "motorway";           // autostrada

/** Ograniczenia prędkości w Polsce (km/h) */
export const SPEED_LIMITS_PL: Record<RoadType, number> = {
  built_up: 50,
  non_built_up: 90,
  expressway_single: 100,
  expressway_dual: 120,
  motorway: 140,
};

// ---------------------------------------------------------------------------
// Kodeks drogowy — Polska: katalog znaków
// ---------------------------------------------------------------------------

/** Katalog wybranych znaków drogowych (Polska) */
export const ROAD_SIGNS_PL: RoadSignDefinition[] = [
  // --- Ostrzegawcze (A) ---
  {
    id: "A-1",
    type: "warning",
    name: "Niebezpieczny zakręt w prawo",
    rule: "Zmniejsz prędkość, przygotuj się na ostry zakręt.",
    codeReference: "Rozp. MI § 13.1",
  },
  {
    id: "A-7",
    type: "warning",
    name: "Ustąp pierwszeństwa",
    rule: "Ustąp pierwszeństwa pojazdom na drodze głównej.",
    codeReference: "Art. 25 PoRD",
  },
  {
    id: "A-16",
    type: "warning",
    name: "Przejście dla pieszych",
    rule: "Zachowaj szczególną ostrożność, ustąp pierwszeństwa pieszym.",
    codeReference: "Art. 26 PoRD",
  },
  {
    id: "A-18a",
    type: "warning",
    name: "Zwierzęta gospodarskie",
    rule: "Zwolnij, przygotuj się na obecność zwierząt na drodze.",
    codeReference: "Rozp. MI § 14.2",
  },

  // --- Zakazu (B) ---
  {
    id: "B-1",
    type: "prohibition",
    name: "Zakaz ruchu w obu kierunkach",
    rule: "Nie wjeżdżaj — zakaz dotyczy obu kierunków.",
    codeReference: "Rozp. MI § 18.1",
  },
  {
    id: "B-20",
    type: "prohibition",
    name: "STOP — zatrzymaj się",
    rule: "Zatrzymaj pojazd przed linią / skrzyżowaniem. Ustąp pierwszeństwa.",
    codeReference: "Art. 25 PoRD",
  },
  {
    id: "B-25",
    type: "prohibition",
    name: "Zakaz wyprzedzania",
    rule: "Nie wyprzedzaj innych pojazdów.",
    codeReference: "Art. 24 PoRD",
  },

  // --- Ograniczenia prędkości (B-33) ---
  {
    id: "B-33",
    type: "prohibition",
    name: "Ograniczenie prędkości",
    normativeValue: 50,
    unit: "km/h",
    rule: "Nie przekraczaj prędkości wskazanej na znaku.",
    codeReference: "Art. 20 PoRD",
  },

  // --- Nakazu (C) ---
  {
    id: "C-1",
    type: "mandatory",
    name: "Nakaz jazdy w prawo przed znakiem",
    rule: "Skręć w prawo.",
    codeReference: "Rozp. MI § 23.1",
  },
  {
    id: "C-5",
    type: "mandatory",
    name: "Nakaz jazdy prosto",
    rule: "Jedź prosto — nie skręcaj.",
    codeReference: "Rozp. MI § 23.5",
  },
  {
    id: "C-9",
    type: "mandatory",
    name: "Nakaz jazdy z prawej strony znaku",
    rule: "Omijaj przeszkodę z prawej strony.",
    codeReference: "Rozp. MI § 24.1",
  },

  // --- Poziome (P) ---
  {
    id: "P-4",
    type: "horizontal",
    name: "Linia podwójna ciągła",
    rule: "Zakaz przejeżdżania i najeżdżania na linię.",
    codeReference: "Rozp. MI § 86.4",
  },
  {
    id: "P-6",
    type: "horizontal",
    name: "Linia ostrzegawcza (przerywana długa)",
    rule: "Można zmienić pas, ale z zachowaniem szczególnej ostrożności.",
    codeReference: "Rozp. MI § 86.6",
  },
  {
    id: "P-10",
    type: "horizontal",
    name: "Przejście dla pieszych",
    rule: "Zatrzymaj się przed przejściem, jeśli pieszy wchodzi.",
    codeReference: "Art. 26 PoRD",
  },
];

// ---------------------------------------------------------------------------
// Bezpieczne odległości
// ---------------------------------------------------------------------------

/** Zalecane minimalne odstępy między pojazdami */
export const SAFETY_DISTANCES = {
  /** Odstęp w metrach przy danej prędkości (reguła 2 sekund) */
  twoSecondRule: (speedKmh: number): number => (speedKmh / 3.6) * 2,
  /** Minimalny odstęp w terenie zabudowanym (metry) */
  builtUpMinM: 15,
  /** Minimalny odstęp poza terenem zabudowanym (metry) */
  nonBuiltUpMinM: 30,
  /** Minimalny odstęp na autostradzie (metry) */
  motorwayMinM: 50,
} as const;

// ---------------------------------------------------------------------------
// Bezpieczny czas reakcji
// ---------------------------------------------------------------------------

/** Normatywne czasy reakcji (ms) */
export const REACTION_TIME_NORMS = {
  /** Średni czas reakcji kierowcy (ms) */
  averageMs: 1000,
  /** Dobry czas reakcji (ms) */
  goodMs: 700,
  /** Doskonały czas reakcji (ms) */
  excellentMs: 500,
  /** Próg niebezpieczny (> tej wartości = ryzyko) */
  dangerousThresholdMs: 1500,
} as const;

// ---------------------------------------------------------------------------
// Kraj
// ---------------------------------------------------------------------------

/** Obsługiwane kraje dla kodeksu drogowego */
export type CountryCode = "PL";

/** Pobiera ograniczenia prędkości dla danego kraju */
export function getSpeedLimits(country: CountryCode): Record<RoadType, number> {
  switch (country) {
    case "PL":
      return SPEED_LIMITS_PL;
    default:
      return SPEED_LIMITS_PL;
  }
}

/** Pobiera katalog znaków drogowych dla danego kraju */
export function getRoadSigns(country: CountryCode): RoadSignDefinition[] {
  switch (country) {
    case "PL":
      return ROAD_SIGNS_PL;
    default:
      return ROAD_SIGNS_PL;
  }
}
