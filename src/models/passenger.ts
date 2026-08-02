// =============================================================================
// Pilot Zaufania — Model CRUD: Pasażer
// =============================================================================
// Warstwa dostępu do danych dla profilu pasażera. W wersji podstawowej
// operuje na localStorage — gotowa do wymiany na Supabase/API.
// =============================================================================

import {
  passengerProfileSchema,
  createPassengerInputSchema,
  updatePassengerInputSchema,
} from "../schemas/passenger.js";
import type { CreatePassengerInput, UpdatePassengerInput } from "../schemas/passenger.js";
import type { PassengerProfile } from "../types/passenger.js";

/** Generuje unikalne ID (UUID v4 — uproszczona wersja dla demo) */
function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

const STORAGE_KEY = "pilot-zaufania:passengers";

function readAll(): PassengerProfile[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function writeAll(profiles: PassengerProfile[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

// ======================== CREATE ========================

export function createPassenger(
  input: CreatePassengerInput
): PassengerProfile {
  const validated = createPassengerInputSchema.parse(input);

  const now = new Date().toISOString();
  const profile: PassengerProfile = {
    ...validated,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    tier: "T1",
    deviceExtensions: {},
    tripChecklist: {
      rideId: "",
      entries: [],
      allCriticalConfirmed: false,
      fullyApproved: false,
    },
  };

  const all = readAll();
  all.push(profile);
  writeAll(all);

  return profile;
}

// ======================== READ ========================

export function getPassenger(id: string): PassengerProfile | undefined {
  return readAll().find((p) => p.id === id);
}

export function listPassengers(): PassengerProfile[] {
  return readAll();
}

// ======================== UPDATE ========================

export function updatePassenger(
  id: string,
  input: UpdatePassengerInput
): PassengerProfile {
  const validated = updatePassengerInputSchema.parse(input);
  const all = readAll();
  const index = all.findIndex((p) => p.id === id);

  if (index === -1) {
    throw new Error(`Pasażer o ID "${id}" nie został znaleziony.`);
  }

  all[index] = {
    ...all[index]!,
    ...validated,
    updatedAt: new Date().toISOString(),
  };

  writeAll(all);
  return all[index]!;
}

// ======================== DELETE ========================

export function deletePassenger(id: string): void {
  const all = readAll();
  const filtered = all.filter((p) => p.id !== id);

  if (filtered.length === all.length) {
    throw new Error(`Pasażer o ID "${id}" nie został znaleziony.`);
  }

  writeAll(filtered);
}

// ======================== WALIDACJA ========================

export function validatePassenger(
  data: unknown
): { success: true; data: PassengerProfile } | { success: false; errors: string[] } {
  const result = passengerProfileSchema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map(
        (i) => `${i.path.join(".")}: ${i.message}`
      ),
    };
  }

  return { success: true, data: result.data as PassengerProfile };
}
