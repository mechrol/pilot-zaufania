// =============================================================================
// Pilot Zaufania — Interfejs pluginu urządzenia pomiarowego
// =============================================================================
// Każde nowe urządzenie (OBD-II, dashcam, radar…) implementuje ten interfejs.
// Dzięki temu profil może dynamicznie rozszerzać się o dane z nowych sensorów.
// =============================================================================

import type { z } from "zod";
import type { EquipmentTier } from "./base-profile.js";

/**
 * Definicja jednego rozszerzenia (pluginu) urządzenia pomiarowego.
 *
 * Przykład urządzenia OBD-II:
 * ```
 * const obd2Plugin: DevicePlugin = {
 *   id: "obd2",
 *   name: "Komputer pokładowy OBD-II",
 *   tier: "T5",
 *   applicableTo: ["vehicle"],
 *   schema: obd2DataSchema,
 *   description: "Telemetria pojazdu: RPM, paliwo, temp. silnika, błędy."
 * };
 * ```
 */
export interface DevicePlugin<
  TSchema extends z.ZodTypeAny = z.ZodTypeAny
> {
  /** Unikalny identyfikator — np. "obd2", "dashcam", "radar_t4" */
  id: string;
  /** Nazwa wyświetlana */
  name: string;
  /** Minimalny poziom wyposażenia potrzebny do działania */
  tier: EquipmentTier;
  /** Do których profili może być podpięte */
  applicableTo: ("passenger" | "driver" | "vehicle")[];
  /** Schemat Zod walidujący dane dostarczane przez urządzenie */
  schema: TSchema;
  /** Opis dla dokumentacji */
  description: string;
}

/**
 * Rejestr wszystkich dostępnych pluginów urządzeń.
 * Przy walidacji profilu, dla każdego klucza w deviceExtensions
 * wyszukiwany jest odpowiedni plugin i jego schema.
 */
export interface DeviceRegistry {
  /** Mapa plugin_id → plugin */
  plugins: Map<string, DevicePlugin>;
  /** Zarejestruj nowy plugin */
  register: (plugin: DevicePlugin) => void;
  /** Pobierz plugin po id */
  get: (id: string) => DevicePlugin | undefined;
  /** Lista pluginów dostępnych dla danego typu profilu */
  listForProfile: (
    profileType: "passenger" | "driver" | "vehicle"
  ) => DevicePlugin[];
}
