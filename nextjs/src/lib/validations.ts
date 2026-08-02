import { z } from "zod";

export const passengerSchema = z.object({
  firstName: z.string().min(1, "Imię jest wymagane"),
  lastName: z.string().min(1, "Nazwisko jest wymagane"),
  email: z.string().email("Nieprawidłowy adres email"),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  postCode: z.string().optional(),
  country: z.string().default("Polska"),
  preferredPayment: z.enum(["gotówka", "karta", "blik", "przelew"]).optional(),
  accessibilityNeeds: z.string().optional(),
  notes: z.string().optional(),
});
export type PassengerInput = z.infer<typeof passengerSchema>;

export const driverSchema = z.object({
  firstName: z.string().min(1, "Imię jest wymagane"),
  lastName: z.string().min(1, "Nazwisko jest wymagane"),
  email: z.string().email("Nieprawidłowy adres email"),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  licenseNumber: z.string().min(1, "Numer prawa jazdy jest wymagany"),
  licenseExpiry: z.string().optional(),
  licenseCategories: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  postCode: z.string().optional(),
  country: z.string().default("Polska"),
  yearsOfExperience: z.number().int().min(0).optional(),
  status: z.enum(["aktywny", "nieaktywny", "zawieszony"]).optional(),
  rating: z.number().min(0).max(5).default(5.0),
  notes: z.string().optional(),
});
export type DriverInput = z.infer<typeof driverSchema>;

export const carSchema = z.object({
  brand: z.string().min(1, "Marka jest wymagana"),
  model: z.string().min(1, "Model jest wymagany"),
  year: z.number().int().min(1900).max(2030).optional(),
  registrationPlate: z.string().min(1, "Numer rejestracyjny jest wymagany"),
  vin: z.string().optional(),
  fuelType: z.enum(["benzyna", "diesel", "lpg", "elektryczny", "hybryda"]).optional(),
  engineCapacity: z.number().min(0).optional(),
  powerKw: z.number().min(0).optional(),
  seats: z.number().int().min(1).max(50).default(5),
  doors: z.number().int().min(2).max(6).default(5),
  color: z.string().optional(),
  mileage: z.number().int().min(0).optional(),
  insuranceProvider: z.string().optional(),
  insuranceNumber: z.string().optional(),
  insuranceExpiry: z.string().optional(),
  technicalInspection: z.string().optional(),
  isActive: z.boolean().default(true),
  driverId: z.string().min(1, "Kierowca jest wymagany"),
});
export type CarInput = z.infer<typeof carSchema>;

export const waypointSchema = z.object({
  order: z.number().int().min(1),
  name: z.string().min(1, "Nazwa punktu jest wymagana"),
  description: z.string().optional(),
  address: z.string().min(1, "Adres jest wymagany"),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  eventType: z.enum(["początek_załadunku","koniec_załadunku","początek_rozładunku","koniec_rozładunku","odpoczynek","tankowanie","kontrola","przekroczenie_granicy","awaria","inne"]).optional(),
  eventStatus: z.enum(["oczekujące","w_trakcie","zarejestrowane"]).default("oczekujące"),
  registeredAt: z.string().optional(),
  registeredBy: z.string().optional(),
  estimatedArrival: z.string().optional(),
  actualArrival: z.string().optional(),
  notes: z.string().optional(),
});
export type WaypointInput = z.infer<typeof waypointSchema>;

export const routeSchema = z.object({
  name: z.string().min(1, "Nazwa trasy jest wymagana"),
  description: z.string().optional(),
  startPoint: z.string().min(1, "Punkt początkowy jest wymagany"),
  endPoint: z.string().min(1, "Punkt końcowy jest wymagany"),
  startLat: z.number().min(-90).max(90).optional(),
  startLng: z.number().min(-180).max(180).optional(),
  endLat: z.number().min(-90).max(90).optional(),
  endLng: z.number().min(-180).max(180).optional(),
  distanceKm: z.number().min(0).optional(),
  estimatedTimeMin: z.number().int().min(0).optional(),
  status: z.enum(["zaplanowana","w_trakcie","zakończona","anulowana"]).default("zaplanowana"),
  scheduledAt: z.string().optional(),
  passengerId: z.string().optional(),
  driverId: z.string().optional(),
  carId: z.string().optional(),
  waypoints: z.array(waypointSchema).default([]),
});
export type RouteInput = z.infer<typeof routeSchema>;
