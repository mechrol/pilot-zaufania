// =============================================================================
// Pilot Zaufania — Schemat Zod: Kierowca
// =============================================================================

import { z } from "zod";
import { baseProfileSchema } from "./base-profile";

export const driverProfileSchema = baseProfileSchema.extend({
  fullName: z
    .string()
    .min(1, "Imię i nazwisko jest wymagane")
    .max(100),
  email: z
    .string()
    .email("Nieprawidłowy format e-mail"),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{6,14}$/, "Nieprawidłowy format numeru telefonu"),
  licenseNumber: z
    .string()
    .min(1, "Numer prawa jazdy jest wymagany"),
  licenseCategories: z
    .array(z.string())
    .min(1, "Przynajmniej jedna kategoria prawa jazdy jest wymagana"),
  licenseExpiry: z
    .string()
    .datetime("Nieprawidłowa data ważności prawa jazdy"),
  yearsOfExperience: z
    .number()
    .int()
    .min(0, "Lata doświadczenia nie mogą być ujemne")
    .max(60),
  rating: z
    .number()
    .min(1, "Ocena minimalna to 1.00")
    .max(5, "Ocena maksymalna to 5.00")
    .default(5.0),
  trustScore: z.number().min(0).max(100).optional(),
  assignedVehicleId: z.string().uuid().optional(),
  wellnessSettingsId: z.string().uuid().optional(),
  subscriptionId: z.string().uuid().optional(),
});

/** Dane wejściowe do utworzenia nowego profilu kierowcy */
export const createDriverInputSchema = driverProfileSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  rating: true,
  trustScore: true,
  deviceExtensions: true,
  gpsData: true,
  tripChecklist: true,
});

/** Dane do aktualizacji profilu kierowcy */
export const updateDriverInputSchema = createDriverInputSchema.partial();

export type CreateDriverInput = z.infer<typeof createDriverInputSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverInputSchema>;
