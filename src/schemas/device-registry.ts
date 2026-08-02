// =============================================================================
// Pilot Zaufania — Rejestr pluginów urządzeń pomiarowych
// =============================================================================

import { z } from "zod";
import type { DevicePlugin, DeviceRegistry } from "../types/device.js";
import { equipmentTierSchema } from "./base-profile.js";

/**
 * Implementacja rejestru pluginów urządzeń.
 *
 * Nowe urządzenia rejestruje się przez DEVICE_REGISTRY.register(...).
 * Przy walidacji profilu, dla każdego klucza w deviceExtensions
 * wyszukiwany jest odpowiedni plugin i łączone są schematy.
 */
export function createDeviceRegistry(): DeviceRegistry {
  const plugins = new Map<string, DevicePlugin>();

  return {
    plugins,

    register(plugin: DevicePlugin): void {
      if (plugins.has(plugin.id)) {
        throw new Error(
          `Device plugin "${plugin.id}" jest już zarejestrowany.`
        );
      }
      plugins.set(plugin.id, plugin);
    },

    get(id: string): DevicePlugin | undefined {
      return plugins.get(id);
    },

    listForProfile(
      profileType: "passenger" | "driver" | "vehicle"
    ): DevicePlugin[] {
      return Array.from(plugins.values()).filter((p) =>
        p.applicableTo.includes(profileType)
      );
    },
  };
}

/** Globalna instancja rejestru */
export const DEVICE_REGISTRY = createDeviceRegistry();

// =============================================================================
// Rejestracja podstawowych urządzeń (T1 — smartfon)
// =============================================================================
// Smartfon jest urządzeniem bazowym, które rejestrujemy jako "plugin",
// aby zachować spójność mechanizmu rozszerzeń.

import { smartphoneMetadataSchema } from "./smartphone.js";
import { gpsDataSchema } from "./gps.js";

DEVICE_REGISTRY.register({
  id: "smartphone",
  name: "Smartfon (rejestrator podstawowy)",
  tier: "T1",
  applicableTo: ["passenger", "driver", "vehicle"],
  schema: smartphoneMetadataSchema,
  description:
    "Podstawowy rejestrator: znaczniki czasu, przybliżona lokalizacja, zdjęcia.",
});

DEVICE_REGISTRY.register({
  id: "gps",
  name: "GPS (nawigacja satelitarna)",
  tier: "T2",
  applicableTo: ["passenger", "driver", "vehicle"],
  schema: gpsDataSchema,
  description:
    "Pełna trasa GPS: współrzędne, prędkość, przystanki, odchylenia od trasy.",
});

// =============================================================================
// Walidacja rozszerzeń — łączy schemat rdzenia ze schematami pluginów
// =============================================================================

/**
 * Tworzy rozszerzony schemat profilu z uwzględnieniem zarejestrowanych pluginów.
 * Każdy klucz w deviceExtensions jest walidowany schematem odpowiedniego pluginu.
 */
export function createExtendedProfileSchema(
  baseSchema: z.ZodObject<any>,
  profileType: "passenger" | "driver" | "vehicle"
): z.ZodObject<any> {
  const plugins = DEVICE_REGISTRY.listForProfile(profileType);

  if (plugins.length === 0) return baseSchema;

  // Dla każdego pluginu tworzymy opcjonalne pole w deviceExtensions
  const extensionSchemas: Record<string, z.ZodTypeAny> = {};

  for (const plugin of plugins) {
    extensionSchemas[plugin.id] = plugin.schema.optional();
  }

  // Rozszerzamy schemat bazowy o opcjonalne pola pluginów w deviceExtensions
  const deviceExtensionsSchema = z.object(extensionSchemas).partial();

  return baseSchema.extend({
    deviceExtensions: deviceExtensionsSchema.default({}),
  });
}
