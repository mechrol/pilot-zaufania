// =============================================================================
// Pilot Zaufania — Plugin: OBD-II (komputer pokładowy)
// =============================================================================
// Urządzenie T5 — telemetria pojazdu: RPM, paliwo, temp. silnika, błędy.
// =============================================================================

import { z } from "zod";
import { DEVICE_REGISTRY } from "../schemas/device-registry.js";
import type { DevicePlugin } from "../types/device.js";

// ---------------------------------------------------------------------------
// 1. Typ danych OBD-II
// ---------------------------------------------------------------------------

/** Dane rejestrowane przez OBD-II */
export interface OBD2Data {
  /** Obroty silnika (RPM) */
  rpm: number;
  /** Prędkość pojazdu (km/h) — z ECU */
  speedKmh: number;
  /** Temperatura płynu chłodzącego (°C) */
  coolantTempC: number;
  /** Poziom paliwa (%) */
  fuelLevelPercent: number;
  /** Pozycja pedału przyspieszenia (%) */
  throttlePositionPercent: number;
  /** Obciążenie silnika (%) */
  engineLoadPercent: number;
  /** Kody błędów DTC */
  dtcCodes: string[];
  /** Znacznik czasu odczytu */
  timestamp: string;
}

// ---------------------------------------------------------------------------
// 2. Schemat Zod
// ---------------------------------------------------------------------------

const obd2DataSchema = z.object({
  rpm: z.number().min(0).max(12000),
  speedKmh: z.number().min(0).max(350),
  coolantTempC: z.number().min(-40).max(215),
  fuelLevelPercent: z.number().min(0).max(100),
  throttlePositionPercent: z.number().min(0).max(100),
  engineLoadPercent: z.number().min(0).max(100),
  dtcCodes: z.array(z.string()).default([]),
  timestamp: z.string().datetime(),
});

// ---------------------------------------------------------------------------
// 3. Definicja pluginu
// ---------------------------------------------------------------------------

const obd2Plugin: DevicePlugin<typeof obd2DataSchema> = {
  id: "obd2",
  name: "Komputer pokładowy OBD-II",
  tier: "T5",
  applicableTo: ["vehicle"],
  schema: obd2DataSchema,
  description:
    "Telemetria pojazdu przez złącze OBD-II: RPM, prędkość, temperatura silnika, poziom paliwa, kody błędów DTC.",
};

// ---------------------------------------------------------------------------
// 4. Rejestracja
// ---------------------------------------------------------------------------

DEVICE_REGISTRY.register(obd2Plugin);

export { obd2Plugin, obd2DataSchema };
