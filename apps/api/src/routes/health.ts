import { Router } from 'express';
import { checkPostgresHealth } from '../db.js';
import { checkElasticsearchHealth } from '../es.js';

const router = Router();

router.get('/health', async (_req, res) => {
  const [postgresHealthy, elasticsearchHealthy] = await Promise.all([
    checkPostgresHealth(),
    checkElasticsearchHealth(),
  ]);

  const ok = postgresHealthy && elasticsearchHealthy;

  res.status(ok ? 200 : 503).json({
    ok,
    postgres: postgresHealthy,
    elasticsearch: elasticsearchHealthy,
  });
});

export default router;
