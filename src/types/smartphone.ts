// =============================================================================
// Pilot Zaufania — Metadane smartfona
// =============================================================================

/** Informacje o smartfonie używanym jako urządzenie rejestrujące (T1+) */
export interface SmartphoneMetadata {
  /** Model urządzenia (np. "iPhone 15 Pro") */
  deviceModel: string;
  /** System operacyjny i wersja (np. "iOS 17.4") */
  osVersion: string;
  /** Identyfikator instalacji aplikacji (niezmienny per instalacja) */
  appInstallId: string;
  /** Wersja aplikacji Pilot Zaufania */
  appVersion: string;

  /** Dostępne sensory w smartfonie */
  availableSensors: SensorInfo[];

  /** Poziom naładowania baterii (0–100) w momencie startu */
  batteryLevelStart: number;
  /** Czy ładowarka była podłączona */
  isCharging: boolean;

  /** Jakość połączenia sieciowego */
  networkType: NetworkType;
  /** Siła sygnału (0–5, gdzie 0 = brak) */
  signalStrength: number;
}

export interface SensorInfo {
  /** Nazwa sensora: "accelerometer", "gyroscope", "magnetometer", "barometer" */
  name: string;
  /** Czy sensor jest dostępny */
  available: boolean;
  /** Częstotliwość próbkowania w Hz (jeśli dostępny) */
  samplingRateHz?: number;
}

export type NetworkType =
  | "wifi"
  | "4g"
  | "5g"
  | "3g"
  | "edge"
  | "none"
  | "unknown";
