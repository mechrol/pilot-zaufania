// =============================================================================
// Pilot Zaufania — Tor poznawczy (Cognitive Track)
// =============================================================================
// Przetwarza dane z sensorów i tworzy WR (wartości rzeczywiste) dla toru
// poznawczego. Integruje GPS, kamerę, radar/LiDAR i obserwacje pasażera.
//
// Agent: Sensor Fusion Engineer
// =============================================================================

import type {
  CognitiveTrack,
  CognitiveGPS,
  CameraData,
  RadarLidarData,
  EnvironmentalConditions,
} from "../types/sb-sp";

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/** Tworzy pusty tor poznawczy z wartościami domyślnymi */
export function createEmptyCognitiveTrack(): CognitiveTrack {
  return {
    gps: { lat: 0, lon: 0, speedKmh: 0, heading: 0 },
    passengerObservations: [],
    routineObjects: [],
    environment: {
      weather: "clear",
      traffic: "light",
      visibilityM: 1000,
      timeOfDay: "day",
      roadSurface: "dry",
    },
  };
}

// ---------------------------------------------------------------------------
// GPS
// ---------------------------------------------------------------------------

/** Aktualizuje dane GPS w torze poznawczym */
export function updateGPS(
  track: CognitiveTrack,
  gps: Partial<CognitiveGPS>
): CognitiveTrack {
  return {
    ...track,
    gps: { ...track.gps, ...gps },
  };
}

// ---------------------------------------------------------------------------
// Kamera
// ---------------------------------------------------------------------------

/** Aktualizuje dane z kamery */
export function updateCamera(
  track: CognitiveTrack,
  camera: CameraData
): CognitiveTrack {
  return { ...track, camera };
}

// ---------------------------------------------------------------------------
// Radar / LiDAR
// ---------------------------------------------------------------------------

/** Aktualizuje dane z radaru/LiDAR */
export function updateRadarLidar(
  track: CognitiveTrack,
  radarLidar: RadarLidarData
): CognitiveTrack {
  return { ...track, radarLidar };
}

// ---------------------------------------------------------------------------
// Obserwacje pasażera
// ---------------------------------------------------------------------------

/** Dodaje obserwację pasażera */
export function addPassengerObservation(
  track: CognitiveTrack,
  observation: string
): CognitiveTrack {
  return {
    ...track,
    passengerObservations: [...track.passengerObservations, observation],
  };
}

// ---------------------------------------------------------------------------
// Obiekty rutynowe
// ---------------------------------------------------------------------------

/** Dodaje rutynowy obiekt na trasie */
export function addRoutineObject(
  track: CognitiveTrack,
  object: string
): CognitiveTrack {
  return {
    ...track,
    routineObjects: [...track.routineObjects, object],
  };
}

// ---------------------------------------------------------------------------
// Środowisko
// ---------------------------------------------------------------------------

/** Aktualizuje warunki środowiskowe */
export function updateEnvironment(
  track: CognitiveTrack,
  env: Partial<EnvironmentalConditions>
): CognitiveTrack {
  return {
    ...track,
    environment: { ...track.environment, ...env },
  };
}

// ---------------------------------------------------------------------------
// WR — ekstrakcja wartości rzeczywistych
// ---------------------------------------------------------------------------

/** Ekstrahuje WR (wartości rzeczywiste) z toru poznawczego */
export function extractCognitiveWR(
  track: CognitiveTrack
): Record<string, unknown> {
  return {
    speedKmh: track.gps.speedKmh,
    heading: track.gps.heading,
    latitude: track.gps.lat,
    longitude: track.gps.lon,
    visibilityM: track.environment.visibilityM,
    weather: track.environment.weather,
    traffic: track.environment.traffic,
    timeOfDay: track.environment.timeOfDay,
    roadSurface: track.environment.roadSurface,
    cameraObjects: track.camera?.objects ?? [],
    cameraSigns: track.camera?.signs ?? [],
    cameraPedestrians: track.camera?.pedestrianCount ?? 0,
    cameraVehicles: track.camera?.vehicleCount ?? 0,
    radarDistances: track.radarLidar?.distancesM ?? [],
    passengerObservations: track.passengerObservations,
    routineObjects: track.routineObjects,
  };
}

// ---------------------------------------------------------------------------
// WP — wartości postulowane dla toru poznawczego
// ---------------------------------------------------------------------------

/**
 * Tworzy WP (wartości postulowane) dla toru poznawczego
 * na podstawie warunków środowiskowych i norm bezpieczeństwa.
 */
export function computeCognitiveWP(
  track: CognitiveTrack,
  roadType: string
): Record<string, unknown> {
  const isNight = track.environment.timeOfDay === "night" || track.environment.timeOfDay === "dusk";
  const isBadWeather = track.environment.weather === "rain" || track.environment.weather === "snow" || track.environment.weather === "fog";

  return {
    // Widoczność — minimum 200 m w dobrych warunkach, 50 m we mgle
    visibilityM: track.environment.weather === "fog" ? 50 : isNight ? 200 : 1000,
    // Bezpieczna prędkość zależna od warunków
    safeSpeedHint: isBadWeather ? "reduce_by_20_percent" : "normal",
    // Zalecana uwaga na pieszych w nocy
    pedestrianAlert: isNight ? "high" : "normal",
  };
}

// ---------------------------------------------------------------------------
// Δ — obliczanie odchyleń
// ---------------------------------------------------------------------------

/** Oblicza Δ dla toru poznawczego na podstawie WR i WP */
export function computeCognitiveDelta(
  wr: Record<string, unknown>,
  wp: Record<string, unknown>
): Record<string, number> {
  const delta: Record<string, number> = {};

  // Dla każdego klucza liczbowego w WR i WP oblicz Δ
  for (const key of Object.keys(wr)) {
    const wrVal = wr[key];
    const wpVal = wp[key];
    if (typeof wrVal === "number" && typeof wpVal === "number") {
      delta[key] = wrVal - wpVal;
    }
  }

  return delta;
}
