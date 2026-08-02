# Architektura profili — system rozszerzalny o urządzenia pomiarowe

**Projekt:** Pilot Zaufania  
**Data:** 2026-08-01  
**Status:** Draft — gotowe do wdrożenia

---

## 1. Koncepcja: pluginy urządzeń pomiarowych (Device Plugin Architecture)

Profile (Pasażer, Kierowca, Pojazd) mają **rdzeń** (dane zawsze dostępne) i **rozszerzenia** (dane opcjonalne, zależne od dostępnych urządzeń).

```
┌─────────────────────────────────────────────────────┐
│                  PROFIL PODSTAWOWY                    │
│  (zawsze dostępny — smartfon, GPS, checklista)       │
│                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ Pasażer   │  │ Kierowca  │  │ Pojazd           │   │
│  │ • dane os.│  │ • dane os.│  │ • marka, model    │   │
│  │ • smartfon│  │ • smartfon│  │ • nr rej.         │   │
│  │ • GPS     │  │ • GPS     │  │ • rok prod.       │   │
│  │ • checklist│ │ • checklist│ │ • parametry       │   │
│  └─────┬─────┘  └─────┬─────┘  └────────┬─────────┘   │
│        │              │                 │              │
└────────┼──────────────┼─────────────────┼──────────────┘
         │              │                 │
         ▼              ▼                 ▼
┌─────────────────────────────────────────────────────┐
│               WARSTWA ROZSZERZEŃ (pluginów)          │
│                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ OBD-II    │  │ Dashcam  │  │ Radar            │   │
│  │ (T5)      │  │ (T3)     │  │ (T4)             │   │
│  │ • rpm     │  │ • video  │  │ • prędkość       │   │
│  │ • paliwo  │  │ • klatki │  │ • odległość      │   │
│  │ • błędy   │  │ • audio  │  │ • alerty         │   │
│  └──────────┘  └──────────┘  └──────────────────┘   │
│                                                       │
│  ┌──────────┐  ┌──────────┐                          │
│  │ Czujnik   │  │ Kamera   │  ... (dowolny plugin)   │
│  │ ciśnienia │  │ 360°     │                          │
│  │ opon      │  │          │                          │
│  └──────────┘  └──────────┘                          │
└─────────────────────────────────────────────────────┘
```

## 2. Mechanizm rozszerzeń: `deviceExtensions`

Każdy profil zawiera pole `deviceExtensions: Record<string, unknown>` — słownik, gdzie kluczem jest identyfikator urządzenia (np. `"obd2"`, `"dashcam"`), a wartością dane specyficzne dla tego urządzenia.

### Rejestracja nowego urządzenia

1. **Definicja typu** — nowy interfejs TypeScript w `src/devices/`
2. **Schemat Zod** — walidacja danych urządzenia
3. **Rejestracja** — dodanie do rejestru `DEVICE_REGISTRY`
4. **Merge** — przy walidacji profilu, schemat urządzenia łączony jest z rdzeniem

```typescript
// Przykład rejestracji OBD-II
DEVICE_REGISTRY.register({
  id: "obd2",
  name: "Komputer pokładowy OBD-II",
  tier: "T5",
  applicableTo: ["vehicle"],
  schema: z.object({
    rpm: z.number(),
    fuelLevel: z.number(),
    engineTemp: z.number(),
    errorCodes: z.array(z.string()),
  }),
  description: "Telemetria pojazdu.",
});
```

## 3. Poziomy wyposażenia (T0–T5) a profile

| Tier | Urządzenia | Co rejestruje | Dotyczy profilu |
|------|-----------|---------------|-----------------|
| **T0** | Brak / notatnik | Ręczne wpisy | Passenger, Driver |
| **T1** | Smartfon | Znaczniki czasu, przybliżona lokalizacja, zdjęcia | Passenger, Driver |
| **T2** | Smartfon + GPS | Pełna trasa GPS, prędkość, przystanki, odchylenia | Wszystkie |
| **T3** | Dashcam / kamera | Nagrania wideo, zdarzenia wizualne | Vehicle |
| **T4** | Radar | Prędkość, odległość od innych pojazdów | Vehicle |
| **T5** | Komputer pokładowy (OBD-II) | Telemetria: paliwo, RPM, diagnostyka | Vehicle |

## 4. Struktura katalogów

```
src/
├── types/           # Definicje TypeScript
│   ├── base-profile.ts
│   ├── passenger.ts
│   ├── driver.ts
│   ├── vehicle.ts
│   ├── gps.ts
│   ├── smartphone.ts
│   └── device.ts
├── schemas/         # Schematy Zod + walidacja
│   ├── base-profile.ts
│   ├── passenger.ts
│   ├── driver.ts
│   ├── vehicle.ts
│   ├── gps.ts
│   ├── smartphone.ts
│   ├── checklist.ts
│   └── device-registry.ts
├── checklist/       # Checklista czynników podróży
│   ├── trip-factors.ts      # Typy
│   └── trip-factors-defs.ts # Definicje 16 pozycji
├── models/          # CRUD + walidacja
│   ├── passenger.ts
│   ├── driver.ts
│   └── vehicle.ts
└── devices/         # Przyszłe pluginy urządzeń
    └── _template.ts
```

## 5. Zasady rozszerzania

1. **Rdzeń jest nienaruszalny** — podstawowe pola (id, name, smartphone, gps) nie zmieniają się przy dodawaniu pluginów.
2. **Pluginy są addytywne** — nowe urządzenie dodaje pola, nie modyfikuje istniejących.
3. **Walidacja progresywna** — schema profilu waliduje tylko to, co jest zadeklarowane.
4. **Wsteczna kompatybilność** — profil utworzony w T1 działa bez zmian po rozszerzeniu do T5.

## 6. Checklista czynników podróży

16 predefiniowanych pozycji w 3 kategoriach:

| Kategoria | Liczba pozycji | Krytyczne |
|-----------|---------------|-----------|
| Bezpieczeństwo (safety) | 7 | 5 |
| Komfort (comfort) | 4 | 0 |
| Gotowość (readiness) | 5 | 4 |

Wszystkie krytyczne muszą być potwierdzone przed rozpoczęciem podróży.
