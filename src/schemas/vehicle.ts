// =============================================================================
// Pilot Zaufania — Schemat Zod: Pojazd
// =============================================================================

import { z } from "zod";
import { baseProfileSchema } from "./base-profile";

export const vehicleCategorySchema = z.enum([
  "mini",
  "sedan",
  "suv",
  "van",
  "luxury",
]);

export const vehicleProfileSchema = baseProfileSchema.extend({
  brand: z
    .string()
    .min(1, "Marka jest wymagana")
    .max(50),
  model: z
    .string()
    .min(1, "Model jest wymagany")
    .max(50),
  year: z
    .number()
    .int()
    .min(1990, "Rok produkcji nie może być wcześniejszy niż 1990")
    .max(2030, "Rok produkcji nie może być późniejszy niż 2030"),
  color: z.string().min(1).max(30),
  plate: z
    .string()
    .min(1, "Numer rejestracyjny jest wymagany")
    .max(15),
  vin: z
    .string()
    .length(17, "VIN musi mieć dokładnie 17 znaków")
    .regex(/^[A-HJ-NPR-Z0-9]{17}$/, "Nieprawidłowy format VIN"),
  seats: z
    .number()
    .int()
    .min(1, "Minimalna liczba miejsc to 1")
    .max(60),
  category: vehicleCategorySchema,
  assignedDriverId: z.string().uuid().optional(),
  lastInspectionDate: z.string().datetime().optional(),
  insuranceExpiry: z.string().datetime().optional(),
});

/** Dane wejściowe do utworzenia nowego profilu pojazdu */
export const createVehicleInputSchema = vehicleProfileSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deviceExtensions: true,
  gpsData: true,
  tripChecklist: true,
});

/** Dane do aktualizacji profilu pojazdu */
export const updateVehicleInputSchema = createVehicleInputSchema.partial();

export type CreateVehicleInput = z.infer<typeof createVehicleInputSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleInputSchema>;
