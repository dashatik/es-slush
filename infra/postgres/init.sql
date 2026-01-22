-- Postgres is system of record; Elasticsearch is a projection.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Entities: single-table system of record (intentionally pragmatic for a take-home)
CREATE TABLE IF NOT EXISTS entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  entity_type text NOT NULL,
  CONSTRAINT entities_entity_type_check
    CHECK (entity_type IN ('startup','investor','person','event')),

  name text NOT NULL,
  description text,

  country text,
  location text,

  industries text[] NOT NULL DEFAULT ARRAY[]::text[],
  topics text[] NOT NULL DEFAULT ARRAY[]::text[],

  stage text,

  role_title text,
  company_name text,

  event_type text,
  speakers text[] NOT NULL DEFAULT ARRAY[]::text[],

  active_2026 boolean NOT NULL DEFAULT false,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Maintain updated_at on writes (dev-friendly, deterministic)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_entities_set_updated_at ON entities;

CREATE TRIGGER trg_entities_set_updated_at
BEFORE UPDATE ON entities
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Minimal, intentional indexes
CREATE INDEX IF NOT EXISTS entities_active_type_idx ON entities (active_2026, entity_type);
CREATE INDEX IF NOT EXISTS entities_country_idx ON entities (country);
CREATE INDEX IF NOT EXISTS entities_stage_idx ON entities (stage);
CREATE INDEX IF NOT EXISTS entities_updated_at_idx ON entities (updated_at);

-- ============================================================
-- ENTITY_LINKS: Universal relationship table (knowledge graph edges)
-- Enables: "team of startup", "investors in startup", "events attended", etc.
-- ============================================================

-- Link types (extendable without schema migration)
CREATE TYPE link_type AS ENUM (
  'works_at',      -- person -> startup/investor
  'founded',       -- person -> startup
  'invests_in',    -- investor -> startup
  'partner_at',    -- person -> investor
  'speaks_at',     -- person/startup -> event
  'organizes',     -- person/startup/investor -> event
  'attends',       -- any -> event
  'volunteers_at', -- person -> event
  'related'        -- generic fallback
);

CREATE TABLE IF NOT EXISTS entity_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  from_entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  to_entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,

  type link_type NOT NULL,

  -- Optional context fields
  role_title text,        -- e.g., "Founder", "Lead Investor", "Keynote Speaker"
  context text,           -- e.g., "Series A", "2026 Main Stage"
  meta jsonb DEFAULT '{}', -- extensible: { "equity_percentage": 15, "talk_duration": 30 }

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Prevent duplicate edges
  CONSTRAINT entity_links_unique_edge UNIQUE (from_entity_id, to_entity_id, type)
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_entity_links_set_updated_at ON entity_links;
CREATE TRIGGER trg_entity_links_set_updated_at
BEFORE UPDATE ON entity_links
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Indexes for efficient graph queries
-- "All links FROM this entity" (e.g., person's jobs, investor's portfolio)
CREATE INDEX IF NOT EXISTS entity_links_from_idx ON entity_links (from_entity_id, type);
-- "All links TO this entity" (e.g., startup's team, event's speakers)
CREATE INDEX IF NOT EXISTS entity_links_to_idx ON entity_links (to_entity_id, type);
-- "All links involving this entity" (bidirectional lookups)
CREATE INDEX IF NOT EXISTS entity_links_type_to_idx ON entity_links (type, to_entity_id);
