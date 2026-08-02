// =============================================================================
// Pilot Zaufania — Dane GPS
// =============================================================================

/** Pojedynczy punkt GPS */
export interface GPSPoint {
  /** Szerokość geograficzna (-90 do 90) */
  latitude: number;
  /** Długość geograficzna (-180 do 180) */
  longitude: number;
  /** Wysokość n.p.m. w metrach (opcjonalne) */
  altitude?: number;
  /** Dokładność pomiaru w metrach */
  accuracy: number;
  /** Znacznik czasu (ISO 8601) */
  timestamp: string;
}

/** Dane GPS zebrane podczas podróży */
export interface GPSData {
  /** Unikalny identyfikator sesji GPS */
  sessionId: string;
  /** Lista punktów trasy */
  points: GPSPoint[];
  /** Średnia prędkość w km/h */
  averageSpeedKmh?: number;
  /** Całkowity dystans w km */
  totalDistanceKm?: number;
  /** Czas rozpoczęcia (ISO 8601) */
  startedAt: string;
  /** Czas zakończenia (ISO 8601) */
  endedAt?: string;
  /** Źródło danych GPS */
  source: GPSDataSource;
}

export type GPSDataSource =
  | "smartphone"
  | "dedicated_gps"
  | "vehicle_obd"
  | "unknown";
