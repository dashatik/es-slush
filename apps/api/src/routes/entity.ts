import { Router } from 'express';
import { pool } from '../db.js';

/* Entity detail API - returns entity with grouped connections
GET /entity/:id returns:
- entity: core entity fields
- connections: grouped by relationship type (team, investors, events, related)
Connections are resolved via entity_links table (knowledge graph edges).
Grouping logic is backend-owned, frontend just iterates arrays. */

const router = Router();

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* SQL query that returns entity + grouped connections in one call. 
Connection grouping rules (backend-owned):i
- team: works_at, founded where person -> entity (for startups/investors)
- investors: invests_in where investor -> entity (for startups)
- portfolio: invests_in where entity -> startup (for investors)
- events: speaks_at, organizes, attends, volunteers_at
- related: fallback for 'related' type */

const ENTITY_DETAIL_QUERY = `
WITH base AS (
  SELECT *
  FROM entities
  WHERE id = $1
),
links AS (
  SELECT
    l.*,
    CASE
      WHEN l.from_entity_id = b.id THEN l.to_entity_id
      ELSE l.from_entity_id
    END AS other_id
  FROM entity_links l
  JOIN base b ON (l.from_entity_id = b.id OR l.to_entity_id = b.id)
),
other_entities AS (
  SELECT
    l.id AS link_id,
    l.type,
    l.role_title,
    l.context,
    l.meta,
    l.other_id,
    l.from_entity_id,
    l.to_entity_id,
    e.name AS other_name,
    e.entity_type AS other_type
  FROM links l
  JOIN entities e ON e.id = l.other_id
)
SELECT jsonb_build_object(
  'entity', jsonb_build_object(
    'id', b.id,
    'name', b.name,
    'entity_type', b.entity_type,
    'description', b.description,
    'country', b.country,
    'location', b.location,
    'industries', b.industries,
    'topics', b.topics,
    'stage', b.stage,
    'role_title', b.role_title,
    'company_name', b.company_name,
    'event_type', b.event_type,
    'speakers', b.speakers
  ),
  'connections', jsonb_build_object(
    -- TEAM: people who work at or founded this entity (for startup/investor pages)
    'team', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', oe.other_id,
        'name', oe.other_name,
        'type', oe.type,
        'role', oe.role_title,
        'context', oe.context
      ) ORDER BY oe.other_name)
      FROM other_entities oe
      WHERE
        oe.other_type = 'person'
        AND oe.type IN ('works_at', 'founded', 'partner_at')
        AND oe.to_entity_id = b.id
    ), '[]'::jsonb),

    -- INVESTORS: investors who invested in this startup
    'investors', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', oe.other_id,
        'name', oe.other_name,
        'type', oe.type,
        'role', oe.role_title,
        'context', oe.context
      ) ORDER BY oe.other_name)
      FROM other_entities oe
      WHERE
        b.entity_type = 'startup'
        AND oe.other_type = 'investor'
        AND oe.type = 'invests_in'
        AND oe.to_entity_id = b.id
    ), '[]'::jsonb),

    -- PORTFOLIO: startups this investor has invested in
    'portfolio', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', oe.other_id,
        'name', oe.other_name,
        'type', oe.type,
        'role', oe.role_title,
        'context', oe.context
      ) ORDER BY oe.other_name)
      FROM other_entities oe
      WHERE
        b.entity_type = 'investor'
        AND oe.other_type = 'startup'
        AND oe.type = 'invests_in'
        AND oe.from_entity_id = b.id
    ), '[]'::jsonb),

    -- EVENTS: events this entity speaks at, organizes, or attends
    'events', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', oe.other_id,
        'name', oe.other_name,
        'type', oe.type,
        'role', oe.role_title,
        'context', oe.context
      ) ORDER BY oe.other_name)
      FROM other_entities oe
      WHERE
        oe.other_type = 'event'
        AND oe.type IN ('speaks_at', 'organizes', 'attends', 'volunteers_at')
    ), '[]'::jsonb),

    -- SPEAKERS: for event pages, people/startups speaking at this event
    'speakers', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', oe.other_id,
        'name', oe.other_name,
        'entity_type', oe.other_type,
        'type', oe.type,
        'role', oe.role_title,
        'context', oe.context
      ) ORDER BY oe.other_name)
      FROM other_entities oe
      WHERE
        b.entity_type = 'event'
        AND oe.type IN ('speaks_at', 'organizes')
        AND oe.to_entity_id = b.id
    ), '[]'::jsonb),

    -- RELATED: fallback for generic relationships
    'related', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', oe.other_id,
        'name', oe.other_name,
        'entity_type', oe.other_type,
        'type', oe.type,
        'role', oe.role_title,
        'context', oe.context
      ) ORDER BY oe.other_name)
      FROM other_entities oe
      WHERE oe.type = 'related'
    ), '[]'::jsonb)
  )
) AS payload
FROM base b;
`;

/* Fallback query when entity_links table doesn't exist */
const ENTITY_ONLY_QUERY = `
SELECT jsonb_build_object(
  'entity', jsonb_build_object(
    'id', id,
    'name', name,
    'entity_type', entity_type,
    'description', description,
    'country', country,
    'location', location,
    'industries', industries,
    'topics', topics,
    'stage', stage,
    'role_title', role_title,
    'company_name', company_name,
    'event_type', event_type,
    'speakers', speakers
  ),
  'connections', jsonb_build_object(
    'team', '[]'::jsonb,
    'investors', '[]'::jsonb,
    'portfolio', '[]'::jsonb,
    'events', '[]'::jsonb,
    'speakers', '[]'::jsonb,
    'related', '[]'::jsonb
  )
) AS payload
FROM entities
WHERE id = $1;
`;

router.get('/entity/:id', async (req, res) => {
  const { id } = req.params;
  if (!UUID_REGEX.test(id)) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid entity ID format (expected UUID)',
    });
    return;
  }
  try {
    const result = await pool.query<{ payload: unknown }>(
      ENTITY_DETAIL_QUERY,
      [id]
    );
    if (result.rows.length === 0 || result.rows[0].payload === null) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Entity not found',
      });
      return;
    }
    res.json(result.rows[0].payload);
  } catch (err) {
    if (err instanceof Error && err.message.includes('entity_links')) {
      console.warn('entity_links table not found, using fallback query');
      try {
        const fallbackResult = await pool.query<{ payload: unknown }>(
          ENTITY_ONLY_QUERY,
          [id]
        );
        if (fallbackResult.rows.length === 0 || fallbackResult.rows[0].payload === null) {
          res.status(404).json({
            error: 'Not Found',
            message: 'Entity not found',
          });
          return;
        }
        res.json(fallbackResult.rows[0].payload);
        return;
      } catch (fallbackErr) {
        console.error('Fallback query failed:', fallbackErr);
      }
    }
    console.error('GET /entity/:id failed:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

export default router;
