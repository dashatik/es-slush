import { Router } from 'express';
import { pool } from '../db.js';
import { FacetsResponse } from '../types.js';

const router = Router();

router.get('/facets', async (_req, res) => {
  try {
    const [industriesResult, countriesResult, stagesResult] = await Promise.all([
      pool.query<{ industry: string }>(
        `SELECT DISTINCT UNNEST(industries) as industry
         FROM entities
         WHERE active_2026 = true
         ORDER BY industry`
      ),
      pool.query<{ country: string }>(
        `SELECT DISTINCT country
         FROM entities
         WHERE active_2026 = true AND country IS NOT NULL
         ORDER BY country`
      ),
      pool.query<{ stage: string }>(
        `SELECT DISTINCT stage
         FROM entities
         WHERE active_2026 = true AND stage IS NOT NULL
         ORDER BY stage`
      ),
    ]);

    const facets: FacetsResponse = {
      industries: industriesResult.rows.map((r) => r.industry),
      countries: countriesResult.rows.map((r) => r.country),
      stages: stagesResult.rows.map((r) => r.stage),
    };

    res.json(facets);
  } catch (error) {
    console.error('Facets query failed:', error);
    res.status(500).json({
      error: 'Facets query failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
