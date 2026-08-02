// =============================================================================
// Pilot Zaufania — Schemat Zod: Smartphone
// =============================================================================

import { z } from "zod";

export const sensorInfoSchema = z.object({
  name: z.string().min(1),
  available: z.boolean(),
  samplingRateHz: z.number().positive().optional(),
});

export const networkTypeSchema = z.enum([
  "wifi",
  "4g",
  "5g",
  "3g",
  "edge",
  "none",
  "unknown",
]);

export const smartphoneMetadataSchema = z.object({
  deviceModel: z.string().min(1, "Model urządzenia jest wymagany"),
  osVersion: z.string().min(1, "Wersja OS jest wymagana"),
  appInstallId: z.string().uuid(),
  appVersion: z.string().min(1, "Wersja aplikacji jest wymagana"),
  availableSensors: z.array(sensorInfoSchema).default([]),
  batteryLevelStart: z
    .number()
    .int()
    .min(0)
    .max(100, "Poziom baterii musi być między 0 a 100"),
  isCharging: z.boolean(),
  networkType: networkTypeSchema,
  signalStrength: z
    .number()
    .int()
    .min(0)
    .max(5, "Siła sygnału musi być między 0 a 5"),
});
