// =============================================================================
// Pilot Zaufania — Model CRUD: Kierowca
// =============================================================================

import {
  driverProfileSchema,
  createDriverInputSchema,
  updateDriverInputSchema,
} from "../schemas/driver.js";
import type { CreateDriverInput, UpdateDriverInput } from "../schemas/driver.js";
import type { DriverProfile } from "../types/driver.js";

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

const STORAGE_KEY = "pilot-zaufania:drivers";

function readAll(): DriverProfile[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function writeAll(profiles: DriverProfile[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

// ======================== CREATE ========================

export function createDriver(input: CreateDriverInput): DriverProfile {
  const validated = createDriverInputSchema.parse(input);

  const now = new Date().toISOString();
  const profile: DriverProfile = {
    ...validated,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    tier: "T1",
    rating: 5.0,
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

export function getDriver(id: string): DriverProfile | undefined {
  return readAll().find((d) => d.id === id);
}

export function listDrivers(): DriverProfile[] {
  return readAll();
}

// ======================== UPDATE ========================

export function updateDriver(
  id: string,
  input: UpdateDriverInput
): DriverProfile {
  const validated = updateDriverInputSchema.parse(input);
  const all = readAll();
  const index = all.findIndex((d) => d.id === id);

  if (index === -1) {
    throw new Error(`Kierowca o ID "${id}" nie został znaleziony.`);
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

export function deleteDriver(id: string): void {
  const all = readAll();
  const filtered = all.filter((d) => d.id !== id);

  if (filtered.length === all.length) {
    throw new Error(`Kierowca o ID "${id}" nie został znaleziony.`);
  }

  writeAll(filtered);
}

// ======================== WALIDACJA ========================

export function validateDriver(
  data: unknown
): { success: true; data: DriverProfile } | { success: false; errors: string[] } {
  const result = driverProfileSchema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map(
        (i) => `${i.path.join(".")}: ${i.message}`
      ),
    };
  }

  return { success: true, data: result.data as DriverProfile };
}
