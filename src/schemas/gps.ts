// =============================================================================
// Pilot Zaufania — Schemat Zod: GPS
// =============================================================================

import { z } from "zod";

export const gpsPointSchema = z.object({
  latitude: z
    .number()
    .min(-90, "Szerokość geograficzna musi być ≥ -90")
    .max(90, "Szerokość geograficzna musi być ≤ 90"),
  longitude: z
    .number()
    .min(-180, "Długość geograficzna musi być ≥ -180")
    .max(180, "Długość geograficzna musi być ≤ 180"),
  altitude: z.number().optional(),
  accuracy: z
    .number()
    .min(0, "Dokładność nie może być ujemna"),
  timestamp: z.string().datetime(),
});

export const gpsDataSourceSchema = z.enum([
  "smartphone",
  "dedicated_gps",
  "vehicle_obd",
  "unknown",
]);

export const gpsDataSchema = z.object({
  sessionId: z.string().uuid(),
  points: z
    .array(gpsPointSchema)
    .min(1, "Przynajmniej jeden punkt GPS jest wymagany"),
  averageSpeedKmh: z.number().min(0).optional(),
  totalDistanceKm: z.number().min(0).optional(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
  source: gpsDataSourceSchema,
});
