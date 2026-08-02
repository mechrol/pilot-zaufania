// =============================================================================
// Pilot Zaufania — Testy profili
// =============================================================================

import { describe, it, expect } from "vitest";
import {
  createPassengerInputSchema,
  passengerProfileSchema,
} from "../schemas/passenger";
import {
  createDriverInputSchema,
} from "../schemas/driver";
import {
  createVehicleInputSchema,
} from "../schemas/vehicle";
import { gpsDataSchema, gpsPointSchema } from "../schemas/gps";
import { smartphoneMetadataSchema } from "../schemas/smartphone";
import { tripChecklistSchema } from "../schemas/checklist";
import { DEVICE_REGISTRY } from "../schemas/device-registry";
import { TRIP_FACTORS, getCriticalFactors, createEmptyChecklist } from "../checklist/trip-factors-defs";

// ======================== SCHEMATY BAZOWE ========================

describe("GPS Schema", () => {
  it("poprawnie waliduje poprawny punkt GPS", () => {
    const point = {
      latitude: 52.2297,
      longitude: 21.0122,
      accuracy: 5.0,
      timestamp: "2026-08-01T12:00:00.000Z",
    };
    const result = gpsPointSchema.safeParse(point);
    expect(result.success).toBe(true);
  });

  it("odrzuca nieprawidłową szerokość geograficzną", () => {
    const point = {
      latitude: 91,
      longitude: 21.0122,
      accuracy: 5.0,
      timestamp: "2026-08-01T12:00:00.000Z",
    };
    const result = gpsPointSchema.safeParse(point);
    expect(result.success).toBe(false);
  });

  it("odrzuca ujemną dokładność", () => {
    const point = {
      latitude: 52.2297,
      longitude: 21.0122,
      accuracy: -1,
      timestamp: "2026-08-01T12:00:00.000Z",
    };
    const result = gpsPointSchema.safeParse(point);
    expect(result.success).toBe(false);
  });

  it("poprawnie waliduje pełną sesję GPS", () => {
    const session = {
      sessionId: crypto.randomUUID(),
      points: [
        {
          latitude: 52.2297,
          longitude: 21.0122,
          accuracy: 5.0,
          timestamp: "2026-08-01T12:00:00.000Z",
        },
      ],
      startedAt: "2026-08-01T12:00:00.000Z",
      source: "smartphone",
    };
    const result = gpsDataSchema.safeParse(session);
    expect(result.success).toBe(true);
  });
});

describe("Smartphone Schema", () => {
  it("poprawnie waliduje kompletne metadane smartfona", () => {
    const data = {
      deviceModel: "iPhone 15 Pro",
      osVersion: "iOS 17.4",
      appInstallId: crypto.randomUUID(),
      appVersion: "0.1.0",
      availableSensors: [
        { name: "accelerometer", available: true, samplingRateHz: 100 },
        { name: "gyroscope", available: true, samplingRateHz: 100 },
      ],
      batteryLevelStart: 85,
      isCharging: false,
      networkType: "5g",
      signalStrength: 4,
    };
    const result = smartphoneMetadataSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("odrzuca poziom baterii > 100", () => {
    const data = {
      deviceModel: "iPhone",
      osVersion: "iOS 17",
      appInstallId: crypto.randomUUID(),
      appVersion: "0.1.0",
      batteryLevelStart: 150,
      isCharging: false,
      networkType: "wifi",
      signalStrength: 3,
    };
    const result = smartphoneMetadataSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

// ======================== PROFILE ========================

describe("Passenger Profile Schema", () => {
  const validPassenger = {
    fullName: "Jan Kowalski",
    email: "jan@example.com",
    phone: "+48123456789",
    preferredLanguage: "pl",
    consentToRecording: true,
  };

  it("poprawnie waliduje dane wejściowe pasażera", () => {
    const result = createPassengerInputSchema.safeParse(validPassenger);
    expect(result.success).toBe(true);
  });

  it("odrzuca brak zgody na rejestrację", () => {
    const result = createPassengerInputSchema.safeParse({
      ...validPassenger,
      consentToRecording: false,
    });
    expect(result.success).toBe(false);
  });

  it("odrzuca nieprawidłowy email", () => {
    const result = createPassengerInputSchema.safeParse({
      ...validPassenger,
      email: "nie-email",
    });
    expect(result.success).toBe(false);
  });

  it("odrzuca nieprawidłowy format telefonu", () => {
    const result = createPassengerInputSchema.safeParse({
      ...validPassenger,
      phone: "abc",
    });
    expect(result.success).toBe(false);
  });

  it("wymaga imienia i nazwiska", () => {
    const result = createPassengerInputSchema.safeParse({
      ...validPassenger,
      fullName: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("Driver Profile Schema", () => {
  const validDriver = {
    fullName: "Adam Kierowca",
    email: "adam@example.com",
    phone: "+48123456789",
    licenseNumber: "XYZ12345",
    licenseCategories: ["B"],
    licenseExpiry: "2030-12-31T00:00:00.000Z",
    yearsOfExperience: 5,
  };

  it("poprawnie waliduje dane wejściowe kierowcy", () => {
    const result = createDriverInputSchema.safeParse(validDriver);
    expect(result.success).toBe(true);
  });

  it("odrzuca ujemne lata doświadczenia", () => {
    const result = createDriverInputSchema.safeParse({
      ...validDriver,
      yearsOfExperience: -1,
    });
    expect(result.success).toBe(false);
  });

  it("wymaga przynajmniej jednej kategorii prawa jazdy", () => {
    const result = createDriverInputSchema.safeParse({
      ...validDriver,
      licenseCategories: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("Vehicle Profile Schema", () => {
  const validVehicle = {
    brand: "Toyota",
    model: "Corolla",
    year: 2022,
    color: "Biały",
    plate: "WA12345",
    vin: "JTDBR32E602053943",
    seats: 5,
    category: "sedan",
  };

  it("poprawnie waliduje dane wejściowe pojazdu", () => {
    const result = createVehicleInputSchema.safeParse(validVehicle);
    expect(result.success).toBe(true);
  });

  it("odrzuca VIN o złej długości", () => {
    const result = createVehicleInputSchema.safeParse({
      ...validVehicle,
      vin: "ABC",
    });
    expect(result.success).toBe(false);
  });

  it("odrzuca rok spoza zakresu", () => {
    const result = createVehicleInputSchema.safeParse({
      ...validVehicle,
      year: 1980,
    });
    expect(result.success).toBe(false);
  });
});

// ======================== CHECKLISTA ========================

describe("Trip Checklist Definitions", () => {
  it("zawiera poprawne kategorie", () => {
    const categories = new Set(TRIP_FACTORS.map((f) => f.category));
    expect(categories.has("safety")).toBe(true);
    expect(categories.has("comfort")).toBe(true);
    expect(categories.has("readiness")).toBe(true);
  });

  it("wszystkie pozycje krytyczne są typu safety lub readiness", () => {
    const critical = getCriticalFactors();
    for (const f of critical) {
      expect(["safety", "readiness"]).toContain(f.category);
    }
  });

  it("checklista ma przynajmniej 10 pozycji", () => {
    expect(TRIP_FACTORS.length).toBeGreaterThanOrEqual(10);
  });

  it("tworzy pustą checklistę z wszystkimi wpisami", () => {
    const checklist = createEmptyChecklist(
      crypto.randomUUID()
    );
    expect(checklist.entries.length).toBe(TRIP_FACTORS.length);
    expect(checklist.fullyApproved).toBe(false);
    expect(checklist.allCriticalConfirmed).toBe(false);
  });
});

describe("Checklist Schema Validation", () => {
  it("poprawnie waliduje kompletną checklistę", () => {
    const checklist = createEmptyChecklist(
      crypto.randomUUID()
    );
    const result = tripChecklistSchema.safeParse(checklist);
    expect(result.success).toBe(true);
  });
});

// ======================== DEVICE REGISTRY ========================

describe("Device Registry", () => {
  it("zawiera zarejestrowane urządzenia podstawowe", () => {
    const smartphone = DEVICE_REGISTRY.get("smartphone");
    expect(smartphone).toBeDefined();
    expect(smartphone!.tier).toBe("T1");

    const gps = DEVICE_REGISTRY.get("gps");
    expect(gps).toBeDefined();
    expect(gps!.tier).toBe("T2");
  });

  it("filtruje pluginy po typie profilu", () => {
    const forPassenger = DEVICE_REGISTRY.listForProfile("passenger");
    expect(forPassenger.length).toBeGreaterThanOrEqual(2);

    const forVehicle = DEVICE_REGISTRY.listForProfile("vehicle");
    expect(forVehicle.length).toBeGreaterThanOrEqual(2);
  });
});
