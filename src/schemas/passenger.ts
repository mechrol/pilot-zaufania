// =============================================================================
// Pilot Zaufania — Schemat Zod: Pasażer
// =============================================================================

import { z } from "zod";
import { baseProfileSchema } from "./base-profile";

export const passengerProfileSchema = baseProfileSchema.extend({
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
  preferredLanguage: z
    .string()
    .length(2, "Kod języka musi mieć 2 znaki (ISO 639-1)")
    .default("pl"),
  consentToRecording: z
    .boolean()
    .refine((val) => val === true, {
      message: "Zgoda na rejestrację zdarzeń jest wymagana",
    }),
  trustScore: z.number().min(0).max(100).optional(),
  subscriptionId: z.string().uuid().optional(),
});

/** Dane wejściowe do utworzenia nowego profilu pasażera */
export const createPassengerInputSchema = passengerProfileSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  trustScore: true,
  deviceExtensions: true,
  gpsData: true,
  tripChecklist: true,
});

/** Dane do aktualizacji profilu pasażera (wszystkie pola opcjonalne) */
export const updatePassengerInputSchema = createPassengerInputSchema.partial();

export type CreatePassengerInput = z.infer<typeof createPassengerInputSchema>;
export type UpdatePassengerInput = z.infer<typeof updatePassengerInputSchema>;
