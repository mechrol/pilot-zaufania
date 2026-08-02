// =============================================================================
// Pilot Zaufania — Bazowy schemat Zod dla profili
// =============================================================================

import { z } from "zod";
import { gpsDataSchema } from "./gps";
import { smartphoneMetadataSchema } from "./smartphone";
import { tripChecklistSchema } from "./checklist";

export const equipmentTierSchema = z.enum([
  "T0",
  "T1",
  "T2",
  "T3",
  "T4",
  "T5",
]);

export const baseProfileSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  tier: equipmentTierSchema.default("T1"),
  smartphoneMetadata: smartphoneMetadataSchema.optional(),
  gpsData: z.array(gpsDataSchema).optional(),
  deviceExtensions: z.record(z.string(), z.unknown()).default({}),
  tripChecklist: tripChecklistSchema,
});

export const participantRoleSchema = z.enum(["passenger", "driver"]);
