-- Schema for Slush Discovery Search (v1)
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
