// =============================================================================
// Pilot Zaufania — Szablon pluginu urządzenia pomiarowego
// =============================================================================
// Skopiuj ten plik przy dodawaniu nowego urządzenia (np. obd2, dashcam, radar).
//
// Kroki:
// 1. Skopiuj ten plik jako src/devices/<nazwa-urzadzenia>.ts
// 2. Zdefiniuj interfejs danych (WhatThisDeviceCaptures)
// 3. Stwórz schemat Zod dla tych danych
// 4. Zarejestruj plugin w DEVICE_REGISTRY
// 5. (opcjonalnie) Dodaj typy do src/types/
// =============================================================================

import { z } from "zod";
import { DEVICE_REGISTRY } from "../schemas/device-registry.js";
import type { DevicePlugin } from "../types/device.js";

// ---------------------------------------------------------------------------
// 1. Typ danych urządzenia
// ---------------------------------------------------------------------------

/** Dane rejestrowane przez to urządzenie */
export interface ExampleDeviceData {
  /** Przykładowe pole — zastąp własnymi */
  sampleField: number;
  sampleTimestamp: string;
}

// ---------------------------------------------------------------------------
// 2. Schemat Zod
// ---------------------------------------------------------------------------

const exampleDeviceSchema = z.object({
  sampleField: z.number().min(0),
  sampleTimestamp: z.string().datetime(),
});

// ---------------------------------------------------------------------------
// 3. Definicja pluginu
// ---------------------------------------------------------------------------

const exampleDevicePlugin: DevicePlugin<typeof exampleDeviceSchema> = {
  id: "example_device", // unikalny identyfikator (użyj kebab-case)
  name: "Przykładowe urządzenie",
  tier: "T3", // minimalny tier wyposażenia
  applicableTo: ["vehicle"], // do których profili pasuje
  schema: exampleDeviceSchema,
  description: "Opis działania urządzenia — co mierzy i jakie dane dostarcza.",
};

// ---------------------------------------------------------------------------
// 4. Rejestracja
// ---------------------------------------------------------------------------

DEVICE_REGISTRY.register(exampleDevicePlugin);

// Eksport dla innych modułów
export { exampleDevicePlugin, exampleDeviceSchema };
