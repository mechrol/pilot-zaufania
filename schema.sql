-- =============================================================================
-- Pilot Zaufania — Refleksyjna Baza Wiedzy (Supabase / PostgreSQL)
-- =============================================================================
-- Schemat przechowuje pełną historię przejazdów, zdarzeń, refleksji pasażerów
-- i Smart Kontraktów jako trwałą, przeszukiwalną i relacyjną bazę wiedzy.
-- =============================================================================

-- ======================== ROZSZERZENIA ========================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ======================== TABELE SŁOWNIKOWE ========================

CREATE TABLE drivers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  rating        NUMERIC(3,2) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  license       TEXT NOT NULL UNIQUE,
  experience    TEXT NOT NULL,
  photo_emoji   TEXT DEFAULT '👨‍✈️',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE vehicles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id     UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  brand         TEXT NOT NULL,
  model         TEXT NOT NULL,
  year          INT NOT NULL,
  color         TEXT NOT NULL,
  plate         TEXT NOT NULL UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE categories (
  key           TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  icon          TEXT NOT NULL,
  description   TEXT,
  base_fare     NUMERIC(10,2) NOT NULL,
  per_km        NUMERIC(10,2) NOT NULL,
  seats         INT NOT NULL DEFAULT 4
);

CREATE TABLE reflection_prompts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text          TEXT NOT NULL,
  category      TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE safety_tips (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text          TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ======================== ENCJE GŁÓWNE ========================

CREATE TABLE rides (
  ride_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  passenger_id  UUID NOT NULL,
  driver_id     UUID REFERENCES drivers(id),
  category_key  TEXT REFERENCES categories(key),
  pickup        TEXT NOT NULL,
  dropoff       TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'booked'
                CHECK (status IN ('booked','in_progress','completed',
                      'pending_approval','approved','disputed')),
  tier          TEXT NOT NULL DEFAULT 'T1'
                CHECK (tier IN ('T1','T2','T3')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  fare_base     NUMERIC(10,2),
  fare_distance_km NUMERIC(6,2),
  fare_per_km   NUMERIC(10,2),
  fare_total    NUMERIC(10,2),
  fare_final    NUMERIC(10,2)
);

CREATE INDEX idx_rides_passenger ON rides(passenger_id);
CREATE INDEX idx_rides_status    ON rides(status);
CREATE INDEX idx_rides_created   ON rides(created_at DESC);

-- ======================== ZDARZENIA PRZEJAZDU ========================

CREATE TABLE ride_events (
  event_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id       UUID NOT NULL REFERENCES rides(ride_id) ON DELETE CASCADE,
  source_tier   TEXT NOT NULL DEFAULT 'T1'
                CHECK (source_tier IN ('T1','T2','T3')),
  event_type    TEXT NOT NULL
                CHECK (event_type IN ('trip_start','route_update','stop',
                      'trip_end','manual_alert')),
  payload       JSONB NOT NULL DEFAULT '{}',
  geolocation   JSONB,
  evidence_ref  TEXT,
  integrity_hash TEXT NOT NULL,
  timestamp     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_ride    ON ride_events(ride_id);
CREATE INDEX idx_events_type    ON ride_events(event_type);
CREATE INDEX idx_events_ts      ON ride_events(timestamp);

-- ======================== DZIENNICZEK "ZWIERCIADŁO" ========================

CREATE TABLE journal_entries (
  entry_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id       UUID REFERENCES rides(ride_id) ON DELETE SET NULL,
  author_id     UUID NOT NULL,
  author_role   TEXT NOT NULL DEFAULT 'passenger'
                CHECK (author_role IN ('passenger','driver')),
  prompt_id     UUID REFERENCES reflection_prompts(id),
  content       TEXT NOT NULL,
  visibility    TEXT NOT NULL DEFAULT 'private'
                CHECK (visibility IN ('private','shared','public')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_journal_content_fts
  ON journal_entries USING GIN (to_tsvector('polish', content));
CREATE INDEX idx_journal_ride    ON journal_entries(ride_id);
CREATE INDEX idx_journal_author  ON journal_entries(author_id);
CREATE INDEX idx_journal_created ON journal_entries(created_at DESC);

-- ======================== SMART KONTRAKTY ========================

CREATE TABLE contracts (
  contract_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id           UUID NOT NULL REFERENCES rides(ride_id) ON DELETE CASCADE UNIQUE,
  passenger_snapshot JSONB NOT NULL DEFAULT '{}',
  driver_snapshot    JSONB NOT NULL DEFAULT '{}',
  vehicle_snapshot   JSONB NOT NULL DEFAULT '{}',
  cost_breakdown     JSONB NOT NULL DEFAULT '{}',
  status            TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','pending_approval','disputed',
                          'approved','approved_with_correction','rejected')),
  passenger_signoff JSONB,
  driver_signoff    JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contracts_ride   ON contracts(ride_id);
CREATE INDEX idx_contracts_status ON contracts(status);

-- ======================== ROW LEVEL SECURITY ========================

ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY rides_passenger ON rides
  FOR ALL USING (passenger_id = auth.uid());

CREATE POLICY events_passenger ON ride_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM rides
            WHERE rides.ride_id = ride_events.ride_id
            AND rides.passenger_id = auth.uid())
  );

CREATE POLICY journal_owner ON journal_entries
  FOR ALL USING (author_id = auth.uid());

CREATE POLICY contracts_passenger ON contracts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM rides
            WHERE rides.ride_id = contracts.ride_id
            AND rides.passenger_id = auth.uid())
  );

CREATE POLICY drivers_read ON drivers FOR SELECT USING (true);
CREATE POLICY vehicles_read ON vehicles FOR SELECT USING (true);
CREATE POLICY categories_read ON categories FOR SELECT USING (true);
CREATE POLICY prompts_read ON reflection_prompts FOR SELECT USING (true);
CREATE POLICY tips_read ON safety_tips FOR SELECT USING (true);

-- ======================== WIDOK ANALITYCZNY ========================

CREATE VIEW passenger_knowledge AS
SELECT
  r.passenger_id,
  COUNT(DISTINCT r.ride_id)                             AS total_rides,
  COUNT(DISTINCT je.entry_id)                           AS total_reflections,
  ROUND(AVG(r.fare_total), 2)                           AS avg_fare,
  COUNT(DISTINCT CASE WHEN re.event_type = 'manual_alert'
    THEN re.event_id END)                               AS alert_count,
  MIN(r.created_at)                                     AS first_ride_at,
  MAX(r.created_at)                                     AS last_ride_at
FROM rides r
LEFT JOIN journal_entries je ON je.ride_id = r.ride_id
LEFT JOIN ride_events re     ON re.ride_id = r.ride_id
GROUP BY r.passenger_id;
