-- =============================================================================
-- Pilot Zaufania — Migracja: Rozszerzone profile (v0.2)
-- =============================================================================
-- Dodaje tabele dla profili pasażera, rozszerza kierowców i pojazdy
-- o pola dla deviceExtensions (pluginów urządzeń IoT), metadanych
-- smartfona, danych GPS oraz checklisty czynników podróży.
-- =============================================================================

-- ======================== PROFIL PASAŻERA ========================

CREATE TABLE passengers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name       TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  phone           TEXT NOT NULL,
  preferred_language TEXT NOT NULL DEFAULT 'pl',
  consent_to_recording BOOLEAN NOT NULL DEFAULT false,
  trust_score     INT CHECK (trust_score >= 0 AND trust_score <= 100),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_passengers_email ON passengers(email);

-- ======================== ROZSZERZENIE PROFILU KIEROWCY ========================
-- Dodajemy kolumny do istniejącej tabeli drivers (rozbudowa względem schema.sql)

ALTER TABLE drivers
  ADD COLUMN IF NOT EXISTS email           TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS phone           TEXT,
  ADD COLUMN IF NOT EXISTS license_categories TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS license_expiry  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS years_of_experience INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trust_score     INT CHECK (trust_score >= 0 AND trust_score <= 100),
  ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ NOT NULL DEFAULT now();

-- ======================== ROZSZERZENIE PROFILU POJAZDU ========================
-- Dodajemy kolumny do istniejącej tabeli vehicles

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS vin                TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS seats              INT DEFAULT 4,
  ADD COLUMN IF NOT EXISTS category           TEXT DEFAULT 'sedan'
                CHECK (category IN ('mini','sedan','suv','van','luxury')),
  ADD COLUMN IF NOT EXISTS last_inspection_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS insurance_expiry   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at         TIMESTAMPTZ NOT NULL DEFAULT now();

-- ======================== ROZSZERZENIA URZĄDZEŃ (deviceExtensions) ========================

CREATE TABLE profile_devices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Do którego profilu należy rozszerzenie
  profile_type    TEXT NOT NULL CHECK (profile_type IN ('passenger','driver','vehicle')),
  profile_id      UUID NOT NULL,
  -- Identyfikator urządzenia: "smartphone", "gps", "obd2", "dashcam", ...
  device_id       TEXT NOT NULL,
  -- Dane urządzenia w formacie JSONB (schemat zależny od device_id)
  device_data     JSONB NOT NULL DEFAULT '{}',
  -- Minimalny tier potrzebny do działania tego urządzenia
  tier            TEXT NOT NULL DEFAULT 'T1'
                CHECK (tier IN ('T0','T1','T2','T3','T4','T5')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (profile_type, profile_id, device_id)
);

CREATE INDEX idx_profile_devices_lookup
  ON profile_devices(profile_type, profile_id);
CREATE INDEX idx_profile_devices_device
  ON profile_devices(device_id);

-- ======================== METADANE SMARTFONA ========================

CREATE TABLE smartphone_metadata (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_type    TEXT NOT NULL CHECK (profile_type IN ('passenger','driver','vehicle')),
  profile_id      UUID NOT NULL,
  device_model    TEXT NOT NULL,
  os_version      TEXT NOT NULL,
  app_install_id  UUID NOT NULL,
  app_version     TEXT NOT NULL,
  available_sensors JSONB DEFAULT '[]',
  battery_level_start INT NOT NULL CHECK (battery_level_start >= 0 AND battery_level_start <= 100),
  is_charging     BOOLEAN NOT NULL DEFAULT false,
  network_type    TEXT DEFAULT 'unknown'
                CHECK (network_type IN ('wifi','4g','5g','3g','edge','none','unknown')),
  signal_strength INT CHECK (signal_strength >= 0 AND signal_strength <= 5),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (profile_type, profile_id)
);

-- ======================== DANE GPS ========================

CREATE TABLE gps_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_type    TEXT NOT NULL CHECK (profile_type IN ('passenger','driver','vehicle')),
  profile_id      UUID NOT NULL,
  ride_id         UUID REFERENCES rides(ride_id) ON DELETE CASCADE,
  source          TEXT NOT NULL DEFAULT 'smartphone'
                CHECK (source IN ('smartphone','dedicated_gps','vehicle_obd','unknown')),
  average_speed_kmh NUMERIC(8,2),
  total_distance_km  NUMERIC(10,3),
  started_at      TIMESTAMPTZ NOT NULL,
  ended_at        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE gps_points (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      UUID NOT NULL REFERENCES gps_sessions(id) ON DELETE CASCADE,
  latitude        NUMERIC(10,7) NOT NULL,
  longitude       NUMERIC(10,7) NOT NULL,
  altitude        NUMERIC(8,2),
  accuracy        NUMERIC(8,2) NOT NULL,
  timestamp       TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_gps_sessions_profile ON gps_sessions(profile_type, profile_id);
CREATE INDEX idx_gps_sessions_ride    ON gps_sessions(ride_id);
CREATE INDEX idx_gps_points_session   ON gps_points(session_id);
CREATE INDEX idx_gps_points_ts        ON gps_points(timestamp);

-- ======================== CHECKLISTA CZYNNIKÓW PODRÓŻY ========================

CREATE TABLE trip_checklists (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id         UUID NOT NULL REFERENCES rides(ride_id) ON DELETE CASCADE UNIQUE,
  all_critical_confirmed BOOLEAN NOT NULL DEFAULT false,
  fully_approved  BOOLEAN NOT NULL DEFAULT false,
  approved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE checklist_entries (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id    UUID NOT NULL REFERENCES trip_checklists(id) ON DELETE CASCADE,
  item_id         TEXT NOT NULL,  -- Referencja do TRIP_FACTORS (np. "SF-01")
  passenger_confirmed BOOLEAN NOT NULL DEFAULT false,
  driver_confirmed   BOOLEAN NOT NULL DEFAULT false,
  confirmed_at    TIMESTAMPTZ,
  comment         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (checklist_id, item_id)
);

CREATE INDEX idx_checklist_ride ON trip_checklists(ride_id);

-- ======================== ROW LEVEL SECURITY ========================

ALTER TABLE passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE smartphone_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_entries ENABLE ROW LEVEL SECURITY;

-- Pasażer widzi tylko swój profil
CREATE POLICY passengers_owner ON passengers
  FOR ALL USING (id = auth.uid());

-- Urządzenia profilu — widoczne dla właściciela profilu
CREATE POLICY devices_owner ON profile_devices
  FOR ALL USING (
    (profile_type = 'passenger' AND profile_id = auth.uid())
    OR (profile_type = 'driver' AND EXISTS (
      SELECT 1 FROM drivers WHERE drivers.id = profile_devices.profile_id
    ))
  );

-- Metadane smartfona dostępne dla właściciela
CREATE POLICY smartphone_owner ON smartphone_metadata
  FOR ALL USING (
    (profile_type = 'passenger' AND profile_id = auth.uid())
  );

-- Sesje GPS widoczne dla uczestników przejazdu
CREATE POLICY gps_sessions_ride ON gps_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rides
      WHERE rides.ride_id = gps_sessions.ride_id
      AND rides.passenger_id = auth.uid()
    )
  );

CREATE POLICY gps_points_ride ON gps_points
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM gps_sessions gs
      JOIN rides r ON r.ride_id = gs.ride_id
      WHERE gs.id = gps_points.session_id
      AND r.passenger_id = auth.uid()
    )
  );

-- Checklista — widoczna dla uczestników przejazdu
CREATE POLICY checklist_ride ON trip_checklists
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rides
      WHERE rides.ride_id = trip_checklists.ride_id
      AND rides.passenger_id = auth.uid()
    )
  );
