// =============================================================================
// Pilot Zaufania — Model CRUD: Pojazd
// =============================================================================

import {
  vehicleProfileSchema,
  createVehicleInputSchema,
  updateVehicleInputSchema,
} from "../schemas/vehicle.js";
import type { CreateVehicleInput, UpdateVehicleInput } from "../schemas/vehicle.js";
import type { VehicleProfile } from "../types/vehicle.js";

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

const STORAGE_KEY = "pilot-zaufania:vehicles";

function readAll(): VehicleProfile[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function writeAll(profiles: VehicleProfile[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

// ======================== CREATE ========================

export function createVehicle(input: CreateVehicleInput): VehicleProfile {
  const validated = createVehicleInputSchema.parse(input);

  const now = new Date().toISOString();
  const profile: VehicleProfile = {
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

export function getVehicle(id: string): VehicleProfile | undefined {
  return readAll().find((v) => v.id === id);
}

export function listVehicles(): VehicleProfile[] {
  return readAll();
}

// ======================== UPDATE ========================

export function updateVehicle(
  id: string,
  input: UpdateVehicleInput
): VehicleProfile {
  const validated = updateVehicleInputSchema.parse(input);
  const all = readAll();
  const index = all.findIndex((v) => v.id === id);

  if (index === -1) {
    throw new Error(`Pojazd o ID "${id}" nie został znaleziony.`);
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

export function deleteVehicle(id: string): void {
  const all = readAll();
  const filtered = all.filter((v) => v.id !== id);

  if (filtered.length === all.length) {
    throw new Error(`Pojazd o ID "${id}" nie został znaleziony.`);
  }

  writeAll(filtered);
}

// ======================== WALIDACJA ========================

export function validateVehicle(
  data: unknown
): { success: true; data: VehicleProfile } | { success: false; errors: string[] } {
  const result = vehicleProfileSchema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map(
        (i) => `${i.path.join(".")}: ${i.message}`
      ),
    };
  }

  return { success: true, data: result.data as VehicleProfile };
}
