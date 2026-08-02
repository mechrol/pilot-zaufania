// =============================================================================
// Pilot Zaufania — Schemat Zod: Checklista
// =============================================================================

import { z } from "zod";

export const checklistCategorySchema = z.enum([
  "safety",
  "comfort",
  "readiness",
]);

export const checklistItemSchema = z.object({
  id: z.string().min(1),
  category: checklistCategorySchema,
  label: z.string().min(1, "Treść pozycji jest wymagana"),
  description: z.string().optional(),
  requiredBy: z
    .array(z.enum(["passenger", "driver", "both"]))
    .min(1, "Przynajmniej jedna rola musi być przypisana"),
  critical: z.boolean().default(false),
});

export const checklistEntrySchema = z.object({
  itemId: z.string().min(1),
  passengerConfirmed: z.boolean().default(false),
  driverConfirmed: z.boolean().default(false),
  confirmedAt: z.string().datetime().optional(),
  comment: z.string().max(500).optional(),
});

export const tripChecklistSchema = z.object({
  rideId: z.string().uuid(),
  entries: z
    .array(checklistEntrySchema)
    .min(1, "Checklista musi zawierać przynajmniej jedną pozycję"),
  allCriticalConfirmed: z.boolean().default(false),
  fullyApproved: z.boolean().default(false),
  approvedAt: z.string().datetime().optional(),
});
